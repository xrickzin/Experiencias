// Orçamento estimado (ADR 038, etapa 5; ADR 041): um total do casal, guardado em centavos. Regras
// puras de máscara e formatação, sem `Intl` (o suporte a pt-BR no Android é irregular).

/** R$ 100.000,00, o mesmo limite do banco. */
export const LIMITE_DO_ORCAMENTO = 10_000_000;

/** 120000 → "1.200,00". */
export function formatarReais(centavos: number): string {
  const inteiro = Math.floor(centavos / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${inteiro},${String(centavos % 100).padStart(2, '0')}`;
}

/**
 * Máscara do campo: os dígitos entram pelos centavos, como nos apps de banco ("1200" → "12,00",
 * "120000" → "1.200,00"). Vazio fica vazio; dígitos além do limite são ignorados.
 */
export function mascararReais(texto: string): string {
  const digitos = texto.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 10);
  if (!digitos) return '';
  return formatarReais(Number(digitos));
}

/** "1.200,00" → 120000; vazio → nulo. */
export function lerReais(texto: string): number | null {
  const digitos = texto.replace(/\D/g, '');
  return digitos ? Number(digitos) : null;
}
