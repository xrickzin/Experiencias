-- Links da experiência (ADR 038 e 039): endereços que o casal guarda (o restaurante, o ingresso, o lugar
-- no Google Maps). Os dois criam, editam e excluem, em qualquer estado; o autor é definido pelo servidor.
create table public.links (
  id uuid primary key default gen_random_uuid(),
  experiencia_id uuid not null references public.experiencias (id) on delete cascade,
  laco_id uuid not null default public.meu_laco_id() references public.lacos (id) on delete cascade,
  autor_id uuid default public.meu_membro_id() references public.membros (id) on delete set null,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 60),
  -- Só endereços web: nada de `javascript:`, `file:` ou esquemas de outros apps.
  url text not null check (char_length(url) <= 2000 and url ~* '^https?://[^[:space:]]+$'),
  criado_em timestamptz not null default now()
);

create index links_experiencia_idx on public.links (experiencia_id, criado_em);

alter table public.links enable row level security;
revoke all on public.links from anon, authenticated;
grant select, delete on public.links to authenticated;
-- O cliente informa só a experiência, o título e o endereço; Laço, autor e data vêm do servidor.
grant insert (experiencia_id, titulo, url) on public.links to authenticated;
grant update (titulo, url) on public.links to authenticated;

create policy links_leitura on public.links for select to authenticated
  using (laco_id = (select public.meu_laco_id()));
create policy links_criacao on public.links for insert to authenticated
  with check (
    laco_id = (select public.meu_laco_id())
    and autor_id = (select public.meu_membro_id())
    and exists (select 1 from public.experiencias e where e.id = experiencia_id and e.laco_id = (select public.meu_laco_id()))
  );
create policy links_edicao on public.links for update to authenticated
  using (laco_id = (select public.meu_laco_id()))
  with check (laco_id = (select public.meu_laco_id()));
create policy links_exclusao on public.links for delete to authenticated
  using (laco_id = (select public.meu_laco_id()));
