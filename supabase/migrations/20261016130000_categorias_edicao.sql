-- Renomear categorias (ADR 038). Excluir já era permitido; o nome continua único por Laço.
grant update (nome) on public.categorias to authenticated;

create policy categorias_edicao on public.categorias for update to authenticated
  using (laco_id = (select public.meu_laco_id()))
  with check (laco_id = (select public.meu_laco_id()));
