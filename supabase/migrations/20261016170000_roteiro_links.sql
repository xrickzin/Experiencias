-- Links nos itens do roteiro (ADR 040): um item pode apontar para vários links da própria experiência
-- (os mesmos da seção Links). Excluir o link ou o item só desfaz a associação.
create table public.roteiro_links (
  item_id uuid not null references public.roteiro (id) on delete cascade,
  link_id uuid not null references public.links (id) on delete cascade,
  laco_id uuid not null default public.meu_laco_id() references public.lacos (id) on delete cascade,
  primary key (item_id, link_id)
);

create index roteiro_links_link_idx on public.roteiro_links (link_id);

alter table public.roteiro_links enable row level security;
revoke all on public.roteiro_links from anon, authenticated;
grant select, delete on public.roteiro_links to authenticated;
grant insert (item_id, link_id) on public.roteiro_links to authenticated;

create policy roteiro_links_leitura on public.roteiro_links for select to authenticated
  using (laco_id = (select public.meu_laco_id()));
-- O item e o link são do próprio Laço e da mesma experiência.
create policy roteiro_links_criacao on public.roteiro_links for insert to authenticated
  with check (
    laco_id = (select public.meu_laco_id())
    and exists (
      select 1 from public.roteiro r
      join public.links l on l.experiencia_id = r.experiencia_id
      where r.id = item_id and l.id = link_id and r.laco_id = (select public.meu_laco_id())
    )
  );
create policy roteiro_links_exclusao on public.roteiro_links for delete to authenticated
  using (laco_id = (select public.meu_laco_id()));
