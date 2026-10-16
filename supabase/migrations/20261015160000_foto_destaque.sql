-- Foto de destaque da experiência (ADR 012, 020 e 028).
-- Compartilhada e escolhida manualmente por qualquer um dos dois, entre as fotos da própria experiência.
-- Pode ser escolhida a partir de Planejamento e Vivendo (ADR 028) e aparece no Início e em Nossa História.
-- Não confundir com o momento favorito, que é individual e privado (Fase 5).

alter table public.experiencias
  -- Excluir a foto limpa o destaque, sem substituta automática (ADR 020).
  add column foto_destaque_id uuid references public.registros (id) on delete set null;

-- O destaque precisa ser uma foto desta mesma experiência.
create function public.experiencias_validar_destaque() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.foto_destaque_id is not null and not exists (
    select 1 from public.registros r
    where r.id = new.foto_destaque_id and r.experiencia_id = new.id and r.tipo = 'foto'
  ) then
    raise exception 'foto_destaque_invalida' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger experiencias_validar_destaque before insert or update of foto_destaque_id on public.experiencias
for each row execute function public.experiencias_validar_destaque();

revoke all on function public.experiencias_validar_destaque() from public, anon, authenticated;

grant update (foto_destaque_id) on public.experiencias to authenticated;
