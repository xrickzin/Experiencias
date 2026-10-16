-- Reservas da experiência (ADR 038, etapa 3): hospedagem, transporte, ingresso, mesa. Tudo além do tipo e
-- do nome é opcional. Os dois criam, editam e excluem; o autor é definido pelo servidor.
create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  experiencia_id uuid not null references public.experiencias (id) on delete cascade,
  laco_id uuid not null default public.meu_laco_id() references public.lacos (id) on delete cascade,
  autor_id uuid default public.meu_membro_id() references public.membros (id) on delete set null,
  tipo text not null check (tipo in ('hospedagem', 'transporte', 'ingresso', 'mesa', 'outro')),
  nome text not null check (char_length(btrim(nome)) between 1 and 80),
  data date,
  -- Horário só junto de um dia.
  horario time check (horario is null or data is not null),
  codigo text check (codigo is null or char_length(btrim(codigo)) between 1 and 60),
  -- Só endereços web, como em `links`.
  url text check (url is null or (char_length(url) <= 2000 and url ~* '^https?://[^[:space:]]+$')),
  criado_em timestamptz not null default now()
);

create index reservas_experiencia_idx on public.reservas (experiencia_id, data, horario);

alter table public.reservas enable row level security;
revoke all on public.reservas from anon, authenticated;
grant select, delete on public.reservas to authenticated;
-- Laço, autor e data de criação vêm do servidor.
grant insert (experiencia_id, tipo, nome, data, horario, codigo, url) on public.reservas to authenticated;
grant update (tipo, nome, data, horario, codigo, url) on public.reservas to authenticated;

create policy reservas_leitura on public.reservas for select to authenticated
  using (laco_id = (select public.meu_laco_id()));
create policy reservas_criacao on public.reservas for insert to authenticated
  with check (
    laco_id = (select public.meu_laco_id())
    and autor_id = (select public.meu_membro_id())
    and exists (select 1 from public.experiencias e where e.id = experiencia_id and e.laco_id = (select public.meu_laco_id()))
  );
create policy reservas_edicao on public.reservas for update to authenticated
  using (laco_id = (select public.meu_laco_id()))
  with check (laco_id = (select public.meu_laco_id()));
create policy reservas_exclusao on public.reservas for delete to authenticated
  using (laco_id = (select public.meu_laco_id()));
