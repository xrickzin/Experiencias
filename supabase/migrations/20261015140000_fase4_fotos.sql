-- Fase 4: fotos (registros) com Storage privado.
-- Decisões: ADR 010 (registros tipados), 013 (registros a partir de Planejamento), 020 (fotos e
-- exclusão), 003 (mesmas permissões para os dois). Produto: memory.md#registros. Segurança: security.md.
--
-- Cada foto é um registro (`registros`, tipo `foto`) que aponta para um arquivo no bucket privado
-- `experiencias`, no caminho `{laco}/{experiencia}/{arquivo}`. O autor é definido pelo servidor.
-- Acesso só por membros do Laço, com URL assinada de curta duração; nada público.
-- Observações como registro ficam para quando forem implementadas (o tipo hoje só aceita `foto`).

create function public.meu_membro_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.membros where user_id = (select auth.uid())
$$;

revoke all on function public.meu_membro_id() from public, anon, authenticated;
grant execute on function public.meu_membro_id() to authenticated;

create table public.registros (
  id uuid primary key default gen_random_uuid(),
  experiencia_id uuid not null references public.experiencias (id) on delete cascade,
  laco_id uuid not null default public.meu_laco_id() references public.lacos (id) on delete cascade,
  -- Definido pelo servidor (security.md: "o autor de um registro é definido pelo servidor").
  autor_id uuid default public.meu_membro_id() references public.membros (id) on delete set null,
  tipo text not null default 'foto' check (tipo in ('foto')),
  -- `{laco}/{experiencia}/{arquivo}`; um arquivo pertence a um só registro.
  caminho text not null unique
    check (caminho ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,100}$'),
  criado_em timestamptz not null default now(),
  constraint registros_caminho_da_experiencia
    check (caminho like laco_id::text || '/' || experiencia_id::text || '/%')
);

create index registros_experiencia_idx on public.registros (experiencia_id, criado_em);

alter table public.registros enable row level security;
revoke all on public.registros from anon, authenticated;

grant select on public.registros to authenticated;
-- O cliente informa só a experiência e o caminho; Laço, autor, tipo e data vêm do servidor.
grant insert (experiencia_id, caminho) on public.registros to authenticated;
grant delete on public.registros to authenticated;

create policy registros_leitura on public.registros for select to authenticated
  using (laco_id = (select public.meu_laco_id()));

-- Registros existem a partir de Planejamento (memory.md); em Desejo, não.
create policy registros_criacao on public.registros for insert to authenticated
  with check (
    laco_id = (select public.meu_laco_id())
    and autor_id = (select public.meu_membro_id())
    and exists (
      select 1 from public.experiencias e
      where e.id = experiencia_id
        and e.laco_id = (select public.meu_laco_id())
        and e.estado in ('planejamento', 'vivendo', 'memoria')
    )
  );

-- Os dois podem excluir (ADR 003), em qualquer estado (uma experiência que voltou a Desejo mantém as fotos).
create policy registros_exclusao on public.registros for delete to authenticated
  using (laco_id = (select public.meu_laco_id()));

-- ---------------------------------------------------------------------------------------------
-- Storage: bucket privado, só imagens, até 15 MB por arquivo.
-- ---------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'experiencias', 'experiencias', false, 15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

create policy fotos_leitura on storage.objects for select to authenticated
  using (
    bucket_id = 'experiencias'
    and (storage.foldername(name))[1] = (select public.meu_laco_id())::text
  );

create policy fotos_envio on storage.objects for insert to authenticated
  with check (
    bucket_id = 'experiencias'
    and (storage.foldername(name))[1] = (select public.meu_laco_id())::text
    and exists (
      select 1 from public.experiencias e
      where e.id::text = (storage.foldername(name))[2]
        and e.laco_id = (select public.meu_laco_id())
        and e.estado in ('planejamento', 'vivendo', 'memoria')
    )
  );

-- Excluir arquivo: qualquer membro do Laço, em qualquer estado (ADR 020: arquivos antes das linhas).
create policy fotos_exclusao on storage.objects for delete to authenticated
  using (
    bucket_id = 'experiencias'
    and (storage.foldername(name))[1] = (select public.meu_laco_id())::text
  );
