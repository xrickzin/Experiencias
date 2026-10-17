-- Roteiro por dia (ADR 038, etapa 4; ADR 040): o casal liga "Organizar por roteiro" na experiência e
-- monta, dia a dia, o que vai fazer em cada período. A ordem dentro do período é do casal (arrastar).

-- O botão da experiência. Desligar exclui o roteiro (o app pede confirmação antes).
alter table public.experiencias add column roteiro_ativo boolean not null default false;
grant insert (roteiro_ativo) on public.experiencias to authenticated;
grant update (roteiro_ativo) on public.experiencias to authenticated;

-- As mesmas faixas de `periodoDaHora` (app/src/services/agrupar-fotos.ts).
create function public.periodo_do_horario(p_horario time) returns text
language sql immutable set search_path = '' as $$
  select case
    when p_horario is null then null
    when p_horario < '05:00' then 'madrugada'
    when p_horario < '12:00' then 'manha'
    when p_horario < '18:00' then 'tarde'
    else 'noite'
  end;
$$;

create table public.roteiro (
  id uuid primary key default gen_random_uuid(),
  experiencia_id uuid not null references public.experiencias (id) on delete cascade,
  laco_id uuid not null default public.meu_laco_id() references public.lacos (id) on delete cascade,
  autor_id uuid default public.meu_membro_id() references public.membros (id) on delete set null,
  dia date not null,
  periodo text not null check (periodo in ('madrugada', 'manha', 'tarde', 'noite')),
  -- O horário cai no período: 14:00 só na tarde.
  horario time check (horario is null or public.periodo_do_horario(horario) = periodo),
  texto text not null check (char_length(btrim(texto)) between 1 and 200),
  -- Posição dentro do dia e do período. Esparsa: inserir entre dois itens usa o meio, sem renumerar.
  ordem double precision not null default 0,
  criado_em timestamptz not null default now()
);

create index roteiro_experiencia_idx on public.roteiro (experiencia_id, dia);

alter table public.roteiro enable row level security;
revoke all on public.roteiro from anon, authenticated;
grant select, delete on public.roteiro to authenticated;
-- Laço, autor e data de criação vêm do servidor.
grant insert (experiencia_id, dia, periodo, horario, texto, ordem) on public.roteiro to authenticated;
grant update (dia, periodo, horario, texto, ordem) on public.roteiro to authenticated;

create policy roteiro_leitura on public.roteiro for select to authenticated
  using (laco_id = (select public.meu_laco_id()));
-- Só numa experiência do próprio Laço com o roteiro ligado.
create policy roteiro_criacao on public.roteiro for insert to authenticated
  with check (
    laco_id = (select public.meu_laco_id())
    and autor_id = (select public.meu_membro_id())
    and exists (
      select 1 from public.experiencias e
      where e.id = experiencia_id and e.laco_id = (select public.meu_laco_id()) and e.roteiro_ativo
    )
  );
create policy roteiro_edicao on public.roteiro for update to authenticated
  using (laco_id = (select public.meu_laco_id()))
  with check (laco_id = (select public.meu_laco_id()));
create policy roteiro_exclusao on public.roteiro for delete to authenticated
  using (laco_id = (select public.meu_laco_id()));

-- Desligar o roteiro exclui os itens, na mesma transação. Roda com as permissões de quem desligou
-- (a RLS de exclusão já limita ao próprio Laço).
create function public.excluir_roteiro_desligado() returns trigger
language plpgsql set search_path = '' as $$
begin
  delete from public.roteiro where experiencia_id = new.id;
  return null;
end;
$$;

create trigger experiencias_roteiro_desligado
  after update of roteiro_ativo on public.experiencias
  for each row when (old.roteiro_ativo and not new.roteiro_ativo)
  execute function public.excluir_roteiro_desligado();
