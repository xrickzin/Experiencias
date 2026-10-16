-- Fase 3: referência temporal, instante de início, armado_em e transições de estado.
-- Decisões: ADR 002 (ciclo), 004 e 019 (datas, automação e anti-loop), 014 e 027 (Início), 025.
--
-- A referência temporal guarda a precisão escolhida pelo casal e nunca é alterada pelo servidor.
-- O servidor calcula o instante de início (para a automação da Fase 7) e o `armado_em`.
-- As transições passam por `mudar_estado`, que só aceita as do ciclo; o cliente não escreve `estado`.
-- Finalizar (Vivendo → Memória) fica para a Fase 5.

alter table public.experiencias
  add column referencia_precisao text not null default 'sem_data'
    check (referencia_precisao in ('sem_data', 'mes_ano', 'data', 'data_horario', 'periodo')),
  -- mês/ano: primeiro dia do mês; data e data + horário: o dia; período: o primeiro dia.
  add column referencia_inicio date,
  add column referencia_fim date,
  add column referencia_horario time,
  -- Calculados pelo servidor.
  add column inicio_em timestamptz,
  add column armado_em timestamptz not null default now();

-- Cada precisão tem exatamente os campos que precisa.
alter table public.experiencias add constraint experiencias_referencia_coerente check (
  case referencia_precisao
    when 'sem_data' then referencia_inicio is null and referencia_fim is null and referencia_horario is null
    when 'mes_ano' then referencia_inicio is not null and extract(day from referencia_inicio) = 1
      and referencia_fim is null and referencia_horario is null
    when 'data' then referencia_inicio is not null and referencia_fim is null and referencia_horario is null
    when 'data_horario' then referencia_inicio is not null and referencia_horario is not null and referencia_fim is null
    when 'periodo' then referencia_inicio is not null and referencia_fim is not null
      and referencia_fim >= referencia_inicio and referencia_horario is null
  end
);

-- Instante de início (ADR 019): data → 00:00 no fuso do Laço; data + horário → esse horário no fuso;
-- período → 00:00 do primeiro dia; sem data e mês/ano → nenhum.
-- `armado_em` muda a cada edição da referência e a cada transição de estado (anti-loop da automação).
create function public.experiencias_calcular_tempo() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  fuso text;
begin
  select l.fuso into fuso from public.lacos l where l.id = new.laco_id;
  fuso := coalesce(fuso, 'America/Sao_Paulo');

  new.inicio_em := case new.referencia_precisao
    when 'data' then (new.referencia_inicio::timestamp) at time zone fuso
    when 'periodo' then (new.referencia_inicio::timestamp) at time zone fuso
    when 'data_horario' then (new.referencia_inicio + new.referencia_horario) at time zone fuso
    else null
  end;

  if tg_op = 'INSERT' then
    new.armado_em := now();
  elsif new.estado is distinct from old.estado
     or new.referencia_precisao is distinct from old.referencia_precisao
     or new.referencia_inicio is distinct from old.referencia_inicio
     or new.referencia_fim is distinct from old.referencia_fim
     or new.referencia_horario is distinct from old.referencia_horario then
    new.armado_em := now();
  else
    new.armado_em := old.armado_em;
  end if;
  return new;
end;
$$;

create trigger experiencias_calcular_tempo before insert or update on public.experiencias
for each row execute function public.experiencias_calcular_tempo();

revoke all on function public.experiencias_calcular_tempo() from public, anon, authenticated;

-- O cliente passa a escrever também a referência temporal (nunca `inicio_em`, `armado_em` ou `estado`).
grant insert (referencia_precisao, referencia_inicio, referencia_fim, referencia_horario)
  on public.experiencias to authenticated;
grant update (referencia_precisao, referencia_inicio, referencia_fim, referencia_horario)
  on public.experiencias to authenticated;

-- Transições permitidas nesta fase (lifecycle.md): Desejo ↔ Planejamento, Planejamento ↔ Vivendo.
create function public.mudar_estado(p_experiencia uuid, p_estado text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  atual text;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok', false, 'codigo', 'sem_sessao');
  end if;

  select e.estado into atual from public.experiencias e
    where e.id = p_experiencia and e.laco_id = public.meu_laco_id()
    for update;
  if atual is null then
    return jsonb_build_object('ok', false, 'codigo', 'experiencia_inexistente');
  end if;

  if not (
    (atual = 'desejo' and p_estado = 'planejamento') or
    (atual = 'planejamento' and p_estado in ('desejo', 'vivendo')) or
    (atual = 'vivendo' and p_estado = 'planejamento')
  ) then
    return jsonb_build_object('ok', false, 'codigo', 'transicao_invalida');
  end if;

  update public.experiencias set estado = p_estado where id = p_experiencia;
  return jsonb_build_object('ok', true, 'estado', p_estado);
end;
$$;

revoke all on function public.mudar_estado(uuid, text) from public, anon, authenticated;
grant execute on function public.mudar_estado(uuid, text) to authenticated;

create index experiencias_laco_inicio_idx on public.experiencias (laco_id, estado, inicio_em);
