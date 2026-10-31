-- Quem escreveu a legenda de uma foto (ADR 043): o retrato dessa pessoa aparece ao lado da legenda,
-- e o de quem guardou a foto, no canto. Gravado pelo servidor; o app não escolhe o autor.

alter table public.registros
  add column legenda_autor_id uuid references public.membros (id) on delete set null;

-- Escrever ou trocar a legenda grava quem fez; tirar a legenda limpa o autor.
create function public.gravar_autor_da_legenda() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.legenda is null then
    new.legenda_autor_id := null;
  elsif new.legenda is distinct from old.legenda then
    new.legenda_autor_id := (select public.meu_membro_id());
  else
    new.legenda_autor_id := old.legenda_autor_id;
  end if;
  return new;
end;
$$;

create trigger registros_autor_da_legenda before update of legenda on public.registros
  for each row execute function public.gravar_autor_da_legenda();
