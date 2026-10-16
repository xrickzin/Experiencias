// Geometria do fio vermelho que se entrelaça em ícones e palavras (barra de abas, marcos de fase).
// O caminho é uma lista de curvas; cada trecho passa por trás ou pela frente do que está no meio.
// A parte visível (entre a cauda e a ponta) é desenhada com o traço tracejado do SVG.

export type Ponto = [number, number];
/** Curva de Bézier cúbica: início, dois controles, fim. */
export type Segmento = [Ponto, Ponto, Ponto, Ponto];
/** Um trecho do fio e de que lado ele passa. */
export type Trecho = { s: Segmento; frente: boolean };

export const FIO = 2.5; // espessura do fio
export const CORTE = FIO + 2; // a borda cor de papel que faz o fio de cima passar sobre o de baixo

export const atras = (s: Segmento): Trecho => ({ s, frente: false });
export const frente = (s: Segmento): Trecho => ({ s, frente: true });

export const mover = (t: Trecho[], dx: number, dy: number): Trecho[] =>
  t.map(({ s, frente: f }) => ({ s: s.map(([x, y]) => [x + dx, y + dy]) as Segmento, frente: f }));
export const inverter = (t: Trecho[]): Trecho[] =>
  [...t].reverse().map(({ s: [a, b, c, d], frente: f }) => ({ s: [d, c, b, a], frente: f }));
export const desenhar = (t: Trecho[]) =>
  t.length
    ? `M${t[0].s[0].join(' ')} ` + t.map(({ s: [, b, c, d] }) => `C${b.join(' ')} ${c.join(' ')} ${d.join(' ')}`).join(' ')
    : '';

/** Comprimento aproximado (amostrando a curva), para o traço que se desenha. */
export function comprimento([a, b, c, d]: Segmento) {
  let total = 0;
  let antes = a;
  for (let i = 1; i <= 24; i++) {
    const t = i / 24;
    const u = 1 - t;
    const p: Ponto = [
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
    ];
    total += Math.hypot(p[0] - antes[0], p[1] - antes[1]);
    antes = p;
  }
  return total;
}

export type Fio = {
  trechos: Trecho[];
  comprimentos: number[];
  /** Onde cada trecho começa, medido ao longo do caminho. */
  acumulado: number[];
  total: number;
  /** A parte visível do caminho, entre a cauda e a ponta. */
  cauda: number;
  ponta: number;
};

export function medir(trechos: Trecho[]) {
  const comprimentos = trechos.map((t) => comprimento(t.s));
  const acumulado = comprimentos.map((_, i) => comprimentos.slice(0, i).reduce((a, b) => a + b, 0));
  const total = comprimentos.reduce((a, b) => a + b, 0);
  return { trechos, comprimentos, acumulado, total };
}

/** O fio inteiro, já desenhado. */
export const parado = (trechos: Trecho[]): Fio => {
  const m = medir(trechos);
  return { ...m, cauda: 0, ponta: m.total };
};

/** Traço da camada de trás: o caminho inteiro, mostrando só entre a cauda e a ponta. */
export const tracoDeTras = (fio: Fio) => ({
  d: desenhar(fio.trechos),
  strokeDasharray: [Math.max(0, fio.ponta - fio.cauda), fio.total + 1],
  strokeDashoffset: -fio.cauda,
});

/** Os trechos da frente, cada um com a parte que está visível agora (para a camada de cima). */
export const partesDaFrente = (fio: Fio) =>
  fio.trechos.flatMap(({ s, frente: f }, i) => {
    if (!f) return [];
    const inicio = fio.acumulado[i];
    const fim = inicio + fio.comprimentos[i];
    const de = Math.max(fio.cauda, inicio);
    const ate = Math.min(fio.ponta, fim);
    if (ate <= de) return [];
    return [{ i, d: desenhar([{ s, frente: f }]), strokeDasharray: [ate - de, fim - inicio + 1], strokeDashoffset: -(de - inicio) }];
  });
