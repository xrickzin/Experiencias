-- Fase 1: Laço, membros e vínculo por palavra-chave.
-- Decisões: ADR 011, 015, 016, 017, 018, 022, 023, 024. Modelo: docs/architecture/data-model.md.
--
-- O cliente (chave anônima + sessão do usuário) só chama as funções públicas abaixo e lê o próprio
-- Laço e seus membros por RLS. Nenhuma tabela de palavra-chave, de tentativas ou de configuração
-- é legível ou gravável pelo cliente.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------------------------
-- Configuração do servidor. Guarda o segredo do HMAC (gerado aqui, nunca vai para o repositório)
-- e os limites de tentativas (ADR 018), ajustáveis sem mudar o aplicativo.
-- ---------------------------------------------------------------------------------------------
create table public.configuracao_servidor (
  chave text primary key,
  valor text not null
);

insert into public.configuracao_servidor (chave, valor) values
  ('palavra_hmac_segredo', encode(extensions.gen_random_bytes(32), 'hex')),
  ('palavra_max_falhas', '5'),
  ('palavra_janela_minutos', '10'),
  ('palavra_bloqueio_minutos', '15'),
  ('palavra_tamanho_minimo', '4'),
  ('email_max_consultas', '20');

-- ---------------------------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------------------------
create table public.lacos (
  id uuid primary key default gen_random_uuid(),
  -- Só o derivado (HMAC) da palavra normalizada. Nunca o texto.
  palavra_hmac text not null unique,
  fuso text not null default 'America/Sao_Paulo',
  -- Nome da outra pessoa, informado por quem criou. Vira o nome do membro no vínculo e é limpo.
  nome_companheiro_provisorio text,
  criado_em timestamptz not null default now()
);

create table public.membros (
  id uuid primary key default gen_random_uuid(),
  laco_id uuid not null references public.lacos (id) on delete cascade,
  -- Uma identidade pertence a no máximo um Laço (ADR 015 e 017).
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 60),
  criado_em timestamptz not null default now()
);

create index membros_laco_id_idx on public.membros (laco_id);

create table public.tentativas_vinculo (
  id bigint generated always as identity primary key,
  chave text not null,
  criado_em timestamptz not null default now()
);

create index tentativas_vinculo_chave_idx on public.tentativas_vinculo (chave, criado_em);

create table public.bloqueios_vinculo (
  chave text primary key,
  ate timestamptz not null
);

-- Nunca mais que dois membros por Laço, mesmo que uma função seja alterada no futuro.
create function public.limitar_membros() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.lacos where id = new.laco_id for update;
  if (select count(*) from public.membros where laco_id = new.laco_id) >= 2 then
    raise exception 'laco_completo';
  end if;
  return new;
end;
$$;

create trigger membros_limite before insert on public.membros
for each row execute function public.limitar_membros();

-- ---------------------------------------------------------------------------------------------
-- Acesso: tudo fechado por padrão; o cliente lê só o próprio Laço e edita só o próprio nome.
-- ---------------------------------------------------------------------------------------------
alter table public.configuracao_servidor enable row level security;
alter table public.lacos enable row level security;
alter table public.membros enable row level security;
alter table public.tentativas_vinculo enable row level security;
alter table public.bloqueios_vinculo enable row level security;

revoke all on public.configuracao_servidor, public.lacos, public.membros,
  public.tentativas_vinculo, public.bloqueios_vinculo from anon, authenticated;

-- Sem a coluna palavra_hmac.
grant select (id, fuso, nome_companheiro_provisorio, criado_em) on public.lacos to authenticated;
grant select on public.membros to authenticated;
grant update (nome) on public.membros to authenticated;

create function public.meu_laco_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select laco_id from public.membros where user_id = (select auth.uid())
$$;

create policy lacos_leitura on public.lacos for select to authenticated
  using (id = (select public.meu_laco_id()));

create policy membros_leitura on public.membros for select to authenticated
  using (laco_id = (select public.meu_laco_id()));

create policy membros_edita_o_proprio_nome on public.membros for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Funções internas (não chamáveis pelo cliente)
-- ---------------------------------------------------------------------------------------------
create function public.interno_config_int(p_chave text, p_padrao int) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce((select valor::int from public.configuracao_servidor where chave = p_chave), p_padrao)
$$;

-- IP da requisição. Prefere o cabeçalho do proxy de borda (não forjável pelo cliente) e só depois
-- o X-Forwarded-For. Sem cabeçalho, todos caem na mesma chave, o que só torna o limite mais severo.
create function public.interno_ip() returns text
language plpgsql stable set search_path = '' as $$
declare
  cabecalhos jsonb;
  ip text;
begin
  begin
    cabecalhos := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    cabecalhos := null;
  end;
  ip := coalesce(
    cabecalhos ->> 'cf-connecting-ip',
    cabecalhos ->> 'x-real-ip',
    btrim(split_part(coalesce(cabecalhos ->> 'x-forwarded-for', ''), ',', 1))
  );
  return coalesce(nullif(ip, ''), 'desconhecido');
end;
$$;

-- Sem espaços nas pontas, minúsculas, sem acentos e espaços internos colapsados (ADR 018).
create function public.interno_normalizar_palavra(p_palavra text) returns text
language sql stable set search_path = '' as $$
  select regexp_replace(lower(extensions.unaccent(btrim(coalesce(p_palavra, '')))), '\s+', ' ', 'g')
$$;

create function public.interno_hmac_palavra(p_normalizada text) returns text
language sql stable security definer set search_path = '' as $$
  select encode(
    extensions.hmac(
      convert_to(p_normalizada, 'UTF8'),
      convert_to((select valor from public.configuracao_servidor where chave = 'palavra_hmac_segredo'), 'UTF8'),
      'sha256'
    ),
    'hex'
  )
$$;

create function public.interno_bloqueio_ate(p_chaves text[]) returns timestamptz
language sql stable security definer set search_path = '' as $$
  select max(ate) from public.bloqueios_vinculo where chave = any (p_chaves) and ate > now()
$$;

-- Registra uma tentativa sem sucesso em cada chave e bloqueia a chave que atingir o limite.
create function public.interno_registrar_falha(p_chaves text[], p_max int) returns void
language plpgsql security definer set search_path = '' as $$
declare
  k text;
  janela int := public.interno_config_int('palavra_janela_minutos', 10);
  bloqueio int := public.interno_config_int('palavra_bloqueio_minutos', 15);
  total int;
begin
  foreach k in array p_chaves loop
    perform pg_advisory_xact_lock(hashtext(k));
    insert into public.tentativas_vinculo (chave) values (k);
    select count(*) into total from public.tentativas_vinculo
      where tentativas_vinculo.chave = k
        and criado_em > now() - make_interval(mins => janela);
    if total >= p_max then
      insert into public.bloqueios_vinculo (chave, ate) values (k, now() + make_interval(mins => bloqueio))
        on conflict (chave) do update set ate = excluded.ate;
      delete from public.tentativas_vinculo where tentativas_vinculo.chave = k;
    end if;
  end loop;
  -- Limpeza oportunista: o que é antigo não afeta mais nenhuma decisão.
  delete from public.tentativas_vinculo where criado_em < now() - interval '1 day';
  delete from public.bloqueios_vinculo where ate < now() - interval '1 day';
end;
$$;

create function public.interno_chaves_palavra() returns text[]
language sql stable set search_path = '' as $$
  select case
    when (select auth.uid()) is null then array['palavra:ip:' || public.interno_ip()]
    else array['palavra:ip:' || public.interno_ip(), 'palavra:uid:' || (select auth.uid())::text]
  end
$$;

create function public.interno_resposta_bloqueado(p_chaves text[]) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('ok', false, 'codigo', 'bloqueado', 'bloqueado_ate', public.interno_bloqueio_ate(p_chaves))
$$;

-- ---------------------------------------------------------------------------------------------
-- Funções chamadas pelo aplicativo
-- Resultado sempre jsonb {ok, codigo?, ...}; erros esperados não são exceções, para que o registro
-- das tentativas sem sucesso seja gravado.
-- ---------------------------------------------------------------------------------------------

-- Primeiro passo de "Quero entrar no nosso Laço" (ADR 024). Sem sessão; limitada por IP.
-- Revela que um e-mail tem conta: risco aceito no ADR 023 e 024.
create function public.verificar_email(p_email text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  chaves text[] := array['email:ip:' || public.interno_ip()];
begin
  if char_length(v_email) not between 3 and 254 or position('@' in v_email) < 2 then
    return jsonb_build_object('ok', false, 'codigo', 'email_invalido');
  end if;
  if public.interno_bloqueio_ate(chaves) is not null then
    return public.interno_resposta_bloqueado(chaves);
  end if;
  -- Cada consulta conta, porque a resposta revela algo nos dois sentidos.
  perform public.interno_registrar_falha(chaves, public.interno_config_int('email_max_consultas', 20));
  return jsonb_build_object(
    'ok', true,
    'existe', exists (select 1 from auth.users u where lower(u.email) = v_email and u.deleted_at is null)
  );
end;
$$;

-- Etapa do código na criação do Laço (ADR 023). Sem sessão; não reserva a palavra.
-- Diferente da vinculação, aqui "em uso" é informado de propósito (ADR 016).
create function public.palavra_disponivel(p_palavra text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  normalizada text := public.interno_normalizar_palavra(p_palavra);
  chaves text[] := public.interno_chaves_palavra();
begin
  if public.interno_bloqueio_ate(chaves) is not null then
    return public.interno_resposta_bloqueado(chaves);
  end if;
  if char_length(normalizada) < public.interno_config_int('palavra_tamanho_minimo', 4)
     or char_length(normalizada) > 60 then
    return jsonb_build_object('ok', false, 'codigo', 'palavra_invalida');
  end if;
  if exists (select 1 from public.lacos where palavra_hmac = public.interno_hmac_palavra(normalizada)) then
    perform public.interno_registrar_falha(chaves, public.interno_config_int('palavra_max_falhas', 5));
    return jsonb_build_object('ok', false, 'codigo', 'palavra_em_uso');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- Etapa do código na entrada de quem ainda não tem conta (ADR 024). Sem sessão.
-- Resposta genérica: inexistente, incorreta e Laço já completo são indistinguíveis.
create function public.verificar_palavra_vinculo(p_palavra text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  normalizada text := public.interno_normalizar_palavra(p_palavra);
  chaves text[] := public.interno_chaves_palavra();
  laco uuid;
begin
  if public.interno_bloqueio_ate(chaves) is not null then
    return public.interno_resposta_bloqueado(chaves);
  end if;
  select l.id into laco from public.lacos l
    where l.palavra_hmac = public.interno_hmac_palavra(normalizada)
      and (select count(*) from public.membros m where m.laco_id = l.id) < 2;
  if laco is null then
    perform public.interno_registrar_falha(chaves, public.interno_config_int('palavra_max_falhas', 5));
    return jsonb_build_object('ok', false, 'codigo', 'nao_encontrado');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- Criar Laço. Exige sessão. Atômica: se a palavra foi tomada no intervalo, nada é criado (ADR 023).
create function public.criar_laco(
  p_nome text, p_nome_companheiro text, p_palavra text, p_fuso text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  usuario uuid := (select auth.uid());
  nome text := btrim(coalesce(p_nome, ''));
  nome_outra text := btrim(coalesce(p_nome_companheiro, ''));
  normalizada text := public.interno_normalizar_palavra(p_palavra);
  chaves text[] := public.interno_chaves_palavra();
  fuso text;
  novo_laco uuid;
  novo_membro uuid;
  restricao text;
begin
  if usuario is null then
    return jsonb_build_object('ok', false, 'codigo', 'sem_sessao');
  end if;
  if char_length(nome) not between 1 and 60 or char_length(nome_outra) not between 1 and 60 then
    return jsonb_build_object('ok', false, 'codigo', 'dados_invalidos');
  end if;
  if exists (select 1 from public.membros where user_id = usuario) then
    return jsonb_build_object('ok', false, 'codigo', 'ja_tem_laco');
  end if;
  if public.interno_bloqueio_ate(chaves) is not null then
    return public.interno_resposta_bloqueado(chaves);
  end if;
  if char_length(normalizada) < public.interno_config_int('palavra_tamanho_minimo', 4)
     or char_length(normalizada) > 60 then
    return jsonb_build_object('ok', false, 'codigo', 'palavra_invalida');
  end if;

  fuso := case
    when exists (select 1 from pg_catalog.pg_timezone_names where name = p_fuso) then p_fuso
    else 'America/Sao_Paulo'
  end;

  begin
    insert into public.lacos (palavra_hmac, fuso, nome_companheiro_provisorio)
      values (public.interno_hmac_palavra(normalizada), fuso, nome_outra)
      returning id into novo_laco;
    insert into public.membros (laco_id, user_id, nome)
      values (novo_laco, usuario, nome)
      returning id into novo_membro;
  exception when unique_violation then
    get stacked diagnostics restricao = constraint_name;
    if restricao = 'membros_user_id_key' then
      return jsonb_build_object('ok', false, 'codigo', 'ja_tem_laco');
    end if;
    perform public.interno_registrar_falha(chaves, public.interno_config_int('palavra_max_falhas', 5));
    return jsonb_build_object('ok', false, 'codigo', 'palavra_em_uso');
  end;

  return jsonb_build_object('ok', true, 'laco_id', novo_laco, 'membro_id', novo_membro);
end;
$$;

-- Vincular ao Laço. Exige sessão. Resposta genérica para qualquer falha de palavra.
create function public.vincular_laco(p_palavra text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  usuario uuid := (select auth.uid());
  normalizada text := public.interno_normalizar_palavra(p_palavra);
  chaves text[] := public.interno_chaves_palavra();
  laco record;
  novo_membro uuid;
  nome text;
begin
  if usuario is null then
    return jsonb_build_object('ok', false, 'codigo', 'sem_sessao');
  end if;
  if exists (select 1 from public.membros where user_id = usuario) then
    return jsonb_build_object('ok', false, 'codigo', 'ja_tem_laco');
  end if;
  if public.interno_bloqueio_ate(chaves) is not null then
    return public.interno_resposta_bloqueado(chaves);
  end if;

  select l.id, l.nome_companheiro_provisorio into laco from public.lacos l
    where l.palavra_hmac = public.interno_hmac_palavra(normalizada)
    for update;

  if laco.id is null or (select count(*) from public.membros where laco_id = laco.id) >= 2 then
    perform public.interno_registrar_falha(chaves, public.interno_config_int('palavra_max_falhas', 5));
    return jsonb_build_object('ok', false, 'codigo', 'nao_encontrado');
  end if;

  nome := coalesce(nullif(btrim(laco.nome_companheiro_provisorio), ''), 'Sem nome');
  insert into public.membros (laco_id, user_id, nome) values (laco.id, usuario, nome)
    returning id into novo_membro;
  update public.lacos set nome_companheiro_provisorio = null where id = laco.id;

  return jsonb_build_object('ok', true, 'laco_id', laco.id, 'membro_id', novo_membro, 'nome', nome);
end;
$$;

-- Estado do usuário atual: nulo se ainda não pertence a um Laço.
create function public.meu_perfil() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'membro_id', m.id,
    'nome', m.nome,
    'laco_id', l.id,
    'companheiro_vinculado', outro.id is not null,
    'companheiro_nome', coalesce(outro.nome, l.nome_companheiro_provisorio)
  )
  from public.membros m
  join public.lacos l on l.id = m.laco_id
  left join public.membros outro on outro.laco_id = m.laco_id and outro.id <> m.id
  where m.user_id = (select auth.uid())
$$;

-- ---------------------------------------------------------------------------------------------
-- Permissões de execução: nada para PUBLIC; só o necessário para cada papel.
-- ---------------------------------------------------------------------------------------------
revoke all on function
  public.limitar_membros(), public.meu_laco_id(), public.interno_config_int(text, int), public.interno_ip(),
  public.interno_normalizar_palavra(text), public.interno_hmac_palavra(text),
  public.interno_bloqueio_ate(text[]), public.interno_registrar_falha(text[], int),
  public.interno_chaves_palavra(), public.interno_resposta_bloqueado(text[]),
  public.verificar_email(text), public.palavra_disponivel(text), public.verificar_palavra_vinculo(text),
  public.criar_laco(text, text, text, text), public.vincular_laco(text), public.meu_perfil()
from public, anon, authenticated;

-- Usada pelas políticas de RLS, que executam com o papel de quem consulta.
grant execute on function public.meu_laco_id() to authenticated;

grant execute on function
  public.verificar_email(text), public.palavra_disponivel(text), public.verificar_palavra_vinculo(text)
to anon, authenticated;

grant execute on function
  public.criar_laco(text, text, text, text), public.vincular_laco(text), public.meu_perfil()
to authenticated;
