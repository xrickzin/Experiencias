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
