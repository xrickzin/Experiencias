-- Fase 5: Memória.
-- Decisões: ADR 005 (memória e impressões), 008 (registrar memória direto), 010 (registros tipados),
-- 012 e 028 (momento favorito e foto de destaque), 020 (fotos excluídas), 029 (observações e "+").
-- Produto: memory.md, permissions.md#privacidade-da-impressão-e-do-momento-favorito, lifecycle.md.
--
-- 1. Observações simples como registro (tipo `observacao`), ao lado das fotos.
-- 2. Memória exige referência temporal; finalizar (Vivendo → Memória) e registrar uma memória direto.
-- 3. Impressão pessoal e momento favorito, de cada pessoa, com a regra de privacidade no banco (RLS):
--    só vê os da outra pessoa quem já registrou a própria impressão (texto não vazio).

-- ---------------------------------------------------------------------------------------------
-- 1. Observações
-- ---------------------------------------------------------------------------------------------
alter table public.registros
  alter column caminho drop not null,
  add column texto text check (texto is null or char_length(btrim(texto)) between 1 and 2000);

alter table public.registros drop constraint registros_tipo_check;
alter table public.registros add constraint registros_tipo_check check (tipo in ('foto', 'observacao'));
-- Cada tipo tem exatamente o seu conteúdo: foto aponta para um arquivo; observação é só texto.
alter table public.registros add constraint registros_conteudo_do_tipo check (
  (tipo = 'foto' and caminho is not null and texto is null) or
  (tipo = 'observacao' and caminho is null and texto is not null)
);

-- O cliente escolhe o tipo e o texto; Laço, autor e data continuam vindo do servidor.
grant insert (tipo, texto) on public.registros to authenticated;
-- Editar: só o texto de uma observação (ADR 003: os dois podem). O autor original é preservado.
grant update (texto) on public.registros to authenticated;

create policy registros_edicao on public.registros for update to authenticated
  using (laco_id = (select public.meu_laco_id()) and tipo = 'observacao')
  with check (laco_id = (select public.meu_laco_id()) and tipo = 'observacao');

-- ---------------------------------------------------------------------------------------------
-- 2. Memória
-- ---------------------------------------------------------------------------------------------
-- Uma experiência não vira Memória sem referência temporal (dates-and-automation.md).
alter table public.experiencias add constraint experiencias_memoria_tem_data
  check (estado <> 'memoria' or referencia_precisao <> 'sem_data');

-- Criar: um Desejo ou uma Memória (algo vivido antes do aplicativo; ADR 008). Nunca Planejamento ou Vivendo.
grant insert (estado) on public.experiencias to authenticated;
drop policy experiencias_criacao on public.experiencias;
create policy experiencias_criacao on public.experiencias for insert to authenticated
  with check (laco_id = (select public.meu_laco_id()) and estado in ('desejo', 'memoria'));

-- Finalizar: Vivendo → Memória, sem volta. Sem referência temporal, a pessoa informa uma; se a outra
-- pessoa definiu antes (linha travada), vale a dela: o primeiro a definir fixa (ADR 004).
create function public.finalizar_experiencia(
  p_experiencia uuid,
  p_precisao text default null,
  p_inicio date default null,
  p_fim date default null,
  p_horario time default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  atual text;
  precisao text;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'codigo', 'sem_sessao');
  end if;

  select e.estado, e.referencia_precisao into atual, precisao from public.experiencias e
    where e.id = p_experiencia and e.laco_id = public.meu_laco_id()
    for update;
  if atual is null then
    return jsonb_build_object('ok', false, 'codigo', 'experiencia_inexistente');
  end if;
  -- A outra pessoa finalizou ao mesmo tempo: o resultado é o mesmo.
  if atual = 'memoria' then
    return jsonb_build_object('ok', true);
  end if;
  if atual <> 'vivendo' then
    return jsonb_build_object('ok', false, 'codigo', 'transicao_invalida');
  end if;

  if precisao = 'sem_data' then
    if p_precisao is null or p_precisao = 'sem_data' then
      return jsonb_build_object('ok', false, 'codigo', 'referencia_obrigatoria');
    end if;
    update public.experiencias
      set estado = 'memoria', referencia_precisao = p_precisao, referencia_inicio = p_inicio,
          referencia_fim = p_fim, referencia_horario = p_horario
      where id = p_experiencia;
  else
    update public.experiencias set estado = 'memoria' where id = p_experiencia;
  end if;
  return jsonb_build_object('ok', true);
exception
  when check_violation then
    return jsonb_build_object('ok', false, 'codigo', 'referencia_invalida');
end;
$$;

revoke all on function public.finalizar_experiencia(uuid, text, date, date, time) from public, anon, authenticated;
grant execute on function public.finalizar_experiencia(uuid, text, date, date, time) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- 3. Impressão pessoal e momento favorito
-- ---------------------------------------------------------------------------------------------
-- Uma linha por pessoa e memória. Texto nulo = impressão não registrada.
create table public.impressoes (
  experiencia_id uuid not null references public.experiencias (id) on delete cascade,
  membro_id uuid not null references public.membros (id) on delete cascade,
  laco_id uuid not null references public.lacos (id) on delete cascade,
  texto text check (texto is null or char_length(btrim(texto)) between 1 and 4000),
  -- Excluir a foto limpa o favorito, sem substituta (ADR 020).
  momento_favorito_id uuid references public.registros (id) on delete set null,
  atualizado_em timestamptz not null default now(),
  primary key (experiencia_id, membro_id)
);

alter table public.impressoes enable row level security;
-- Escrita só pelas funções abaixo, que conferem dono, estado e foto.
revoke all on public.impressoes from anon, authenticated;
grant select on public.impressoes to authenticated;

-- A pessoa atual já registrou a própria impressão nesta memória? (Fora da RLS, para não recursar.)
create function public.registrei_impressao(p_experiencia uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.impressoes i
    where i.experiencia_id = p_experiencia
      and i.membro_id = public.meu_membro_id()
      and i.texto is not null
  )
$$;

revoke all on function public.registrei_impressao(uuid) from public, anon, authenticated;
grant execute on function public.registrei_impressao(uuid) to authenticated;

-- Regra única, do leitor e decidida na leitura (permissions.md): os seus, sempre; os da outra pessoa,
-- só depois de registrar a própria impressão. Linhas ocultas não aparecem: nada revela se ela escreveu.
create policy impressoes_leitura on public.impressoes for select to authenticated
  using (
    laco_id = (select public.meu_laco_id())
    and (membro_id = (select public.meu_membro_id()) or public.registrei_impressao(experiencia_id))
  );

-- Confere sessão, memória do próprio Laço e devolve o membro, ou um código de falha.
create function public.interno_minha_memoria(p_experiencia uuid, out membro uuid, out laco uuid, out codigo text)
language plpgsql stable security definer set search_path = '' as $$
declare
  estado_atual text;
begin
  membro := public.meu_membro_id();
  laco := public.meu_laco_id();
  if membro is null or laco is null then
    codigo := 'sem_sessao';
    return;
  end if;
  select e.estado into estado_atual from public.experiencias e where e.id = p_experiencia and e.laco_id = laco;
  if estado_atual is null then
    codigo := 'experiencia_inexistente';
  elsif estado_atual <> 'memoria' then
    codigo := 'nao_e_memoria';
  end if;
end;
$$;

revoke all on function public.interno_minha_memoria(uuid) from public, anon, authenticated;

-- Escreve, reescreve ou apaga (texto vazio) a própria impressão. Não toca na da outra pessoa.
create function public.salvar_minha_impressao(p_experiencia uuid, p_texto text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  m record;
  limpo text := nullif(btrim(coalesce(p_texto, '')), '');
begin
  select * into m from public.interno_minha_memoria(p_experiencia);
  if m.codigo is not null then
    return jsonb_build_object('ok', false, 'codigo', m.codigo);
  end if;
  if char_length(limpo) > 4000 then
    return jsonb_build_object('ok', false, 'codigo', 'impressao_longa');
  end if;

  insert into public.impressoes (experiencia_id, membro_id, laco_id, texto)
  values (p_experiencia, m.membro, m.laco, limpo)
  on conflict (experiencia_id, membro_id)
  do update set texto = excluded.texto, atualizado_em = now();
  return jsonb_build_object('ok', true);
end;
$$;

-- Escolhe (ou tira, com nulo) o próprio momento favorito: sempre uma foto da própria memória.
create function public.escolher_meu_momento_favorito(p_experiencia uuid, p_foto uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  m record;
begin
  select * into m from public.interno_minha_memoria(p_experiencia);
  if m.codigo is not null then
    return jsonb_build_object('ok', false, 'codigo', m.codigo);
  end if;
  if p_foto is not null and not exists (
    select 1 from public.registros r where r.id = p_foto and r.experiencia_id = p_experiencia and r.tipo = 'foto'
  ) then
    return jsonb_build_object('ok', false, 'codigo', 'favorito_invalido');
  end if;

  insert into public.impressoes (experiencia_id, membro_id, laco_id, momento_favorito_id)
  values (p_experiencia, m.membro, m.laco, p_foto)
  on conflict (experiencia_id, membro_id)
  do update set momento_favorito_id = excluded.momento_favorito_id, atualizado_em = now();
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.salvar_minha_impressao(uuid, text) from public, anon, authenticated;
revoke all on function public.escolher_meu_momento_favorito(uuid, uuid) from public, anon, authenticated;
grant execute on function public.salvar_minha_impressao(uuid, text) to authenticated;
grant execute on function public.escolher_meu_momento_favorito(uuid, uuid) to authenticated;
