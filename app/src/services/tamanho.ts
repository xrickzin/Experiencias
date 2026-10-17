/** Quanto a experiência pede (ADR 038). Opcional. */
export type Tamanho = 'noite' | 'dia' | 'fim_de_semana' | 'viagem';

export const TAMANHOS: { valor: Tamanho; rotulo: string }[] = [
  { valor: 'noite', rotulo: 'Uma noite' },
  { valor: 'dia', rotulo: 'Um dia' },
  { valor: 'fim_de_semana', rotulo: 'Fim de semana' },
  { valor: 'viagem', rotulo: 'Vários dias' },
];

/** Reservas ficam à vista a partir de um dia; numa noite ou sem tamanho, em "Mais para planejar" (ADR 038). */
export const sugereReservas = (t: Tamanho | null) => t === 'dia' || t === 'fim_de_semana' || t === 'viagem';

/** Fim de semana e vários dias ligam "Organizar por roteiro" ao escolher o tamanho; dá para desligar (ADR 040). */
export const sugereRoteiro = (t: Tamanho | null) => t === 'fim_de_semana' || t === 'viagem';

// Sexta, sábado, domingo e segunda (um fim de semana com feriado); sábado ou domingo precisa estar dentro.
const SEXTA_A_SEGUNDA = [5, 6, 0, 1];
const FIM_DE_SEMANA = [6, 0];

/**
 * A duração que as datas já dizem (ADR 038): só num período. Um dia → "Um dia"; 2 ou 3 dias, todos
 * entre sexta e segunda e com sábado ou domingo → "Fim de semana"; o resto → "Vários dias". Num dia só,
 * as datas não distinguem uma noite de um dia: nulo, e o casal escolhe.
 */
export function tamanhoPelasDatas(r: { precisao: string; inicio: string | null; fim: string | null }): Tamanho | null {
  if (r.precisao !== 'periodo' || !r.inicio || !r.fim) return null;
  const emUtc = (dia: string) => {
    const [ano, mes, d] = dia.split('-').map(Number);
    return Date.UTC(ano, mes - 1, d);
  };
  const inicio = emUtc(r.inicio);
  const dias = Math.round((emUtc(r.fim) - inicio) / 86_400_000) + 1;
  if (dias <= 1) return 'dia';
  if (dias > 3) return 'viagem';
  const semana = Array.from({ length: dias }, (_, i) => new Date(inicio + i * 86_400_000).getUTCDay());
  const fimDeSemana = semana.every((d) => SEXTA_A_SEGUNDA.includes(d)) && semana.some((d) => FIM_DE_SEMANA.includes(d));
  return fimDeSemana ? 'fim_de_semana' : 'viagem';
}
