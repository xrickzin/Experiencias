-- Fase 4 (complemento): quando a foto foi tirada.
-- As fotos de uma experiência são agrupadas por dia e por período (madrugada, manhã, tarde, noite).
-- O momento certo é o da captura, não o do envio (fotos da galeria podem ser enviadas dias depois).
-- O aparelho lê a data da própria foto e manda só esse instante; sem ele, vale o momento do envio.

alter table public.registros
  add column if not exists capturada_em timestamptz
    check (capturada_em is null or (capturada_em > '1990-01-01' and capturada_em <= now() + interval '1 day'));

grant insert (capturada_em) on public.registros to authenticated;
