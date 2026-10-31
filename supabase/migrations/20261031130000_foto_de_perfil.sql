-- Foto de perfil de cada pessoa do casal (ADR 043): aparece pequena, ao lado do nome, onde a autoria
-- importa (legenda da foto, assinatura da carta, bilhetes). Cada um troca só a própria.

-- O arquivo fica no Storage do Laço, em `<laço>/perfil/<pessoa>-<instante>.jpg`.
alter table public.membros add column foto_caminho text
  constraint membros_foto_no_proprio_lugar
    check (foto_caminho is null or foto_caminho like laco_id::text || '/perfil/' || id::text || '-%');

-- A política de edição de `membros` já limita à própria linha.
grant update (foto_caminho) on public.membros to authenticated;

-- O perfil passa a trazer a foto de cada um.
create or replace function public.meu_perfil() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'membro_id', m.id,
    'nome', m.nome,
    'laco_id', l.id,
    'foto_caminho', m.foto_caminho,
    'companheiro_vinculado', outro.id is not null,
    'companheiro_nome', coalesce(outro.nome, l.nome_companheiro_provisorio),
    'companheiro_foto_caminho', outro.foto_caminho
  )
  from public.membros m
  join public.lacos l on l.id = m.laco_id
  left join public.membros outro on outro.laco_id = m.laco_id and outro.id <> m.id
  where m.user_id = (select auth.uid())
$$;

-- Enviar a própria foto de perfil: só na pasta `perfil` do próprio Laço, com o próprio id no nome.
-- Ler e excluir já valem para todo o Laço (políticas `fotos_leitura` e `fotos_exclusao`).
create policy fotos_perfil_envio on storage.objects for insert to authenticated
  with check (
    bucket_id = 'experiencias'
    and (storage.foldername(name))[1] = (select public.meu_laco_id())::text
    and (storage.foldername(name))[2] = 'perfil'
    and storage.filename(name) like (select public.meu_membro_id())::text || '-%'
  );
