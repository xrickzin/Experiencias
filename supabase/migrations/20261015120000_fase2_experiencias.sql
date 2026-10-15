-- Fase 2: experiências (por enquanto, só Desejos).
-- Decisões: ADR 002, 003, 006, 025. Modelo: docs/architecture/data-model.md.
--
-- Cada experiência pertence a um Laço e os dois membros têm as mesmas permissões, inclusive excluir
-- (ADR 003). O acesso do cliente é só por esta tabela, protegido por RLS; o estado não é escrito pelo
-- cliente (nasce `desejo`; as transições vêm com a Fase 3 e serão validadas no servidor).
-- Fora desta migração, de propósito: referência temporal e `armado_em` (Fase 3), registros e fotos.

create table public.experiencias (
  id uuid primary key default gen_random_uuid(),
  -- Vem do Laço da pessoa autenticada; o cliente não escolhe.
  laco_id uuid not null default public.meu_laco_id() references public.lacos (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 120),
  estado text not null default 'desejo' check (estado in ('desejo', 'planejamento', 'vivendo', 'memoria')),
  local text check (local is null or char_length(local) <= 120),
  observacoes text check (observacoes is null or char_length(observacoes) <= 2000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index experiencias_laco_estado_idx on public.experiencias (laco_id, estado, criado_em desc);

create function public.experiencias_atualizado_em() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger experiencias_atualizado_em before update on public.experiencias
for each row execute function public.experiencias_atualizado_em();

alter table public.experiencias enable row level security;

revoke all on public.experiencias from anon, authenticated;
revoke all on function public.experiencias_atualizado_em() from public, anon, authenticated;

-- Colunas liberadas: nada de `laco_id`, `estado` ou datas escritos pelo cliente.
grant select on public.experiencias to authenticated;
grant insert (titulo, local, observacoes) on public.experiencias to authenticated;
grant update (titulo, local, observacoes) on public.experiencias to authenticated;
grant delete on public.experiencias to authenticated;

create policy experiencias_leitura on public.experiencias for select to authenticated
  using (laco_id = (select public.meu_laco_id()));

create policy experiencias_criacao on public.experiencias for insert to authenticated
  with check (laco_id = (select public.meu_laco_id()) and estado = 'desejo');

create policy experiencias_edicao on public.experiencias for update to authenticated
  using (laco_id = (select public.meu_laco_id()))
  with check (laco_id = (select public.meu_laco_id()));

-- Excluir é definitivo, vale em qualquer estado e qualquer um dos dois pode fazê-lo (ADR 006).
create policy experiencias_exclusao on public.experiencias for delete to authenticated
  using (laco_id = (select public.meu_laco_id()));
