-- Legenda nas fotos e momento escolhido para as observações (ADR 030; ajusta o 029).
--
-- 1. Foto ganha legenda opcional (até 300 caracteres), editável pelos dois. Observação não tem legenda.
-- 2. A observação pertence a um dia e período: usa o mesmo `capturada_em` das fotos (o momento a que
--    se refere), que agora pode ser escolhido e alterado. Sem ele, vale quando foi escrita.

alter table public.registros
  add column legenda text
    check (legenda is null or (tipo = 'foto' and char_length(btrim(legenda)) between 1 and 300));

grant update (legenda, capturada_em) on public.registros to authenticated;

-- Os dois editam qualquer registro do Laço (ADR 003). O que cada tipo aceita fica nas regras da tabela.
drop policy registros_edicao on public.registros;
create policy registros_edicao on public.registros for update to authenticated
  using (laco_id = (select public.meu_laco_id()))
  with check (laco_id = (select public.meu_laco_id()));
