-- Detalhes travados na memória (ADR 042): o que foi vivido não se reescreve. Fotos, legendas,
-- observações do momento, destaque, favoritos e impressões continuam livres.

-- Na memória, os detalhes da experiência não mudam mais. Finalizar não é afetado: ali `old.estado`
-- ainda é `vivendo`.
create function public.recusar_detalhes_da_memoria() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.estado = 'memoria' and (
    new.titulo is distinct from old.titulo
    or new.local is distinct from old.local
    or new.observacoes is distinct from old.observacoes
    or new.tamanho is distinct from old.tamanho
    or new.referencia_precisao is distinct from old.referencia_precisao
    or new.referencia_inicio is distinct from old.referencia_inicio
    or new.referencia_fim is distinct from old.referencia_fim
    or new.referencia_horario is distinct from old.referencia_horario
    or new.roteiro_ativo is distinct from old.roteiro_ativo
    or new.orcamento_ativo is distinct from old.orcamento_ativo
    or new.orcamento_centavos is distinct from old.orcamento_centavos
  ) then
    raise exception 'memoria_travada';
  end if;
  return new;
end;
$$;

create trigger experiencias_memoria_travada before update on public.experiencias
  for each row execute function public.recusar_detalhes_da_memoria();

-- Experiência do próprio Laço que ainda não virou memória: onde links, reservas e roteiro mudam.
-- A exclusão da memória apaga tudo em cascata, e a cascata não passa pela RLS.
create function public.experiencia_editavel(p_experiencia uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.experiencias e
    where e.id = p_experiencia and e.laco_id = (select public.meu_laco_id()) and e.estado <> 'memoria'
  );
$$;

revoke all on function public.experiencia_editavel(uuid) from public, anon;
grant execute on function public.experiencia_editavel(uuid) to authenticated;

-- Links
drop policy links_criacao on public.links;
drop policy links_edicao on public.links;
drop policy links_exclusao on public.links;
create policy links_criacao on public.links for insert to authenticated
  with check (
    laco_id = (select public.meu_laco_id())
    and autor_id = (select public.meu_membro_id())
    and public.experiencia_editavel(experiencia_id)
  );
create policy links_edicao on public.links for update to authenticated
  using (laco_id = (select public.meu_laco_id()) and public.experiencia_editavel(experiencia_id))
  with check (laco_id = (select public.meu_laco_id()));
create policy links_exclusao on public.links for delete to authenticated
  using (laco_id = (select public.meu_laco_id()) and public.experiencia_editavel(experiencia_id));

-- Reservas
drop policy reservas_criacao on public.reservas;
drop policy reservas_edicao on public.reservas;
drop policy reservas_exclusao on public.reservas;
create policy reservas_criacao on public.reservas for insert to authenticated
  with check (
    laco_id = (select public.meu_laco_id())
    and autor_id = (select public.meu_membro_id())
    and public.experiencia_editavel(experiencia_id)
  );
create policy reservas_edicao on public.reservas for update to authenticated
  using (laco_id = (select public.meu_laco_id()) and public.experiencia_editavel(experiencia_id))
  with check (laco_id = (select public.meu_laco_id()));
create policy reservas_exclusao on public.reservas for delete to authenticated
  using (laco_id = (select public.meu_laco_id()) and public.experiencia_editavel(experiencia_id));

-- Roteiro (criar continua exigindo o roteiro ligado)
drop policy roteiro_criacao on public.roteiro;
drop policy roteiro_edicao on public.roteiro;
drop policy roteiro_exclusao on public.roteiro;
create policy roteiro_criacao on public.roteiro for insert to authenticated
  with check (
    laco_id = (select public.meu_laco_id())
    and autor_id = (select public.meu_membro_id())
    and public.experiencia_editavel(experiencia_id)
    and exists (select 1 from public.experiencias e where e.id = experiencia_id and e.roteiro_ativo)
  );
create policy roteiro_edicao on public.roteiro for update to authenticated
  using (laco_id = (select public.meu_laco_id()) and public.experiencia_editavel(experiencia_id))
  with check (laco_id = (select public.meu_laco_id()));
create policy roteiro_exclusao on public.roteiro for delete to authenticated
  using (laco_id = (select public.meu_laco_id()) and public.experiencia_editavel(experiencia_id));

-- Links dos itens do roteiro
drop policy roteiro_links_criacao on public.roteiro_links;
drop policy roteiro_links_exclusao on public.roteiro_links;
create policy roteiro_links_criacao on public.roteiro_links for insert to authenticated
  with check (
    laco_id = (select public.meu_laco_id())
    and exists (
      select 1 from public.roteiro r
      join public.links l on l.experiencia_id = r.experiencia_id
      where r.id = item_id and l.id = link_id and r.laco_id = (select public.meu_laco_id())
        and public.experiencia_editavel(r.experiencia_id)
    )
  );
create policy roteiro_links_exclusao on public.roteiro_links for delete to authenticated
  using (
    laco_id = (select public.meu_laco_id())
    and exists (select 1 from public.roteiro r where r.id = item_id and public.experiencia_editavel(r.experiencia_id))
  );
