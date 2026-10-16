-- Fase 7: automação do início (dates-and-automation.md, ADR 019).
-- Uma rotina no próprio PostgreSQL, a cada minuto, passa para Vivendo as experiências em Planejamento
-- cujo instante de início chegou. `inicio_em` (no fuso do Laço) e `armado_em` já são calculados pelo
-- trigger da Fase 3; a mudança de estado renova `armado_em`, então a mesma data nunca dispara de novo.

create extension if not exists pg_cron;

-- Dispara só se o início é posterior à última decisão (`armado_em`) e já chegou:
-- sem data e mês/ano não têm início; data passada ao definir e volta manual a Planejamento ficam
-- com início <= `armado_em`; editar para um novo instante futuro reabilita.
-- `p_agora` existe para os testes; a rotina usa o padrão.
create function public.iniciar_experiencias_do_momento(p_agora timestamptz default now()) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  iniciadas integer;
begin
  update public.experiencias
    set estado = 'vivendo'
    where estado = 'planejamento'
      and inicio_em is not null
      and inicio_em > armado_em
      and inicio_em <= p_agora;
  get diagnostics iniciadas = row_count;
  return iniciadas;
end;
$$;

-- Só o servidor: nunca o aplicativo.
revoke all on function public.iniciar_experiencias_do_momento(timestamptz) from public, anon, authenticated;
grant execute on function public.iniciar_experiencias_do_momento(timestamptz) to service_role;

-- Mesmo nome: reaplicar substitui o agendamento em vez de duplicar.
select cron.schedule('iniciar-experiencias', '* * * * *', 'select public.iniciar_experiencias_do_momento()');
