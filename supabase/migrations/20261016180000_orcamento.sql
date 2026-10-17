-- Orçamento estimado (ADR 038, etapa 5; ADR 041): o casal liga "Orçamento" na experiência, como o
-- roteiro, e guarda um valor total para os dois, em centavos (até R$ 100.000,00).
alter table public.experiencias
  add column orcamento_ativo boolean not null default false,
  add column orcamento_centavos integer
    check (orcamento_centavos is null or orcamento_centavos between 0 and 10000000),
  -- Valor só com o orçamento ligado.
  add constraint experiencias_orcamento_ligado check (orcamento_centavos is null or orcamento_ativo);

grant insert (orcamento_ativo, orcamento_centavos) on public.experiencias to authenticated;
grant update (orcamento_ativo, orcamento_centavos) on public.experiencias to authenticated;

-- Desligar apaga o valor (o app pede confirmação antes), na mesma atualização.
create function public.apagar_orcamento_desligado() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.orcamento_ativo and not new.orcamento_ativo then
    new.orcamento_centavos := null;
  end if;
  return new;
end;
$$;

create trigger experiencias_orcamento_desligado
  before update of orcamento_ativo on public.experiencias
  for each row execute function public.apagar_orcamento_desligado();
