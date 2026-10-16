-- Categorias e tamanho da experiência (ADR 038).
--
-- 1. Tamanho: quanto a experiência pede (uma noite, um dia, fim de semana, viagem). Opcional.
-- 2. Categorias: organização do casal (Filme, Viagem…). Cada Laço começa com uma lista pronta e pode
--    criar outras. Uma experiência pode ter várias; nenhuma é obrigatória (future.md, "Categorias").

-- ---------------------------------------------------------------------------------------------
-- Tamanho
-- ---------------------------------------------------------------------------------------------
alter table public.experiencias
  add column tamanho text check (tamanho is null or tamanho in ('noite', 'dia', 'fim_de_semana', 'viagem'));

grant insert (tamanho) on public.experiencias to authenticated;
grant update (tamanho) on public.experiencias to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Categorias do Laço
-- ---------------------------------------------------------------------------------------------
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  laco_id uuid not null default public.meu_laco_id() references public.lacos (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 40),
  criado_em timestamptz not null default now()
);

-- O mesmo nome uma vez por Laço, sem diferenciar maiúsculas.
create unique index categorias_nome_no_laco on public.categorias (laco_id, lower(btrim(nome)));

alter table public.categorias enable row level security;
revoke all on public.categorias from anon, authenticated;
grant select, delete on public.categorias to authenticated;
grant insert (nome) on public.categorias to authenticated;

create policy categorias_leitura on public.categorias for select to authenticated
  using (laco_id = (select public.meu_laco_id()));
create policy categorias_criacao on public.categorias for insert to authenticated
  with check (laco_id = (select public.meu_laco_id()));
create policy categorias_exclusao on public.categorias for delete to authenticated
  using (laco_id = (select public.meu_laco_id()));

-- A lista pronta de cada Laço novo e dos que já existem.
create function public.categorias_iniciais() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.categorias (laco_id, nome)
  select new.id, nome from unnest(array['Filme', 'Restaurante', 'Passeio', 'Viagem', 'Show', 'Em casa']) as nome;
  return new;
end;
$$;
revoke all on function public.categorias_iniciais() from public, anon, authenticated;

create trigger lacos_categorias_iniciais after insert on public.lacos
for each row execute function public.categorias_iniciais();

insert into public.categorias (laco_id, nome)
select l.id, nome
from public.lacos l, unnest(array['Filme', 'Restaurante', 'Passeio', 'Viagem', 'Show', 'Em casa']) as nome
on conflict do nothing;

-- ---------------------------------------------------------------------------------------------
-- Categorias de cada experiência
-- ---------------------------------------------------------------------------------------------
create table public.experiencia_categorias (
  experiencia_id uuid not null references public.experiencias (id) on delete cascade,
  categoria_id uuid not null references public.categorias (id) on delete cascade,
  laco_id uuid not null default public.meu_laco_id() references public.lacos (id) on delete cascade,
  primary key (experiencia_id, categoria_id)
);

create index experiencia_categorias_categoria_idx on public.experiencia_categorias (categoria_id);

alter table public.experiencia_categorias enable row level security;
revoke all on public.experiencia_categorias from anon, authenticated;
grant select, delete on public.experiencia_categorias to authenticated;
grant insert (experiencia_id, categoria_id) on public.experiencia_categorias to authenticated;

create policy experiencia_categorias_leitura on public.experiencia_categorias for select to authenticated
  using (laco_id = (select public.meu_laco_id()));
-- Experiência e categoria precisam ser do próprio Laço.
create policy experiencia_categorias_criacao on public.experiencia_categorias for insert to authenticated
  with check (
    laco_id = (select public.meu_laco_id())
    and exists (select 1 from public.experiencias e where e.id = experiencia_id and e.laco_id = (select public.meu_laco_id()))
    and exists (select 1 from public.categorias c where c.id = categoria_id and c.laco_id = (select public.meu_laco_id()))
  );
create policy experiencia_categorias_exclusao on public.experiencia_categorias for delete to authenticated
  using (laco_id = (select public.meu_laco_id()));
