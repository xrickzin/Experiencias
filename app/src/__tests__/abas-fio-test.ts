import { fioComAbertura } from '@/components/abas';

// Os pontos onde o fio passa (o fim de cada trecho), para conferir a abertura do laço.
const pontos = (d: string) => [...d.matchAll(/(?:Q[\d.-]+ [\d.-]+ |[ML])([\d.-]+) /g)].map((m) => Number(m[1]));

describe('fio das abas: a abertura onde o laço dá a volta', () => {
  it('a onda para na entrada do laço e recomeça na saída, sem nada no meio', () => {
    // Laço começando em 20: entra em 34 e sai em 62.
    const xs = pontos(fioComAbertura(100, 20));
    expect(xs).toContain(34);
    expect(xs).toContain(62);
    expect(xs.filter((x) => x > 34 && x < 62)).toEqual([]);
    expect(Math.max(...xs)).toBeGreaterThanOrEqual(100);
  });

  it('com a entrada caindo na fronteira de uma onda, a caneta recomeça no lugar certo', () => {
    const d = fioComAbertura(100, 2); // entra em 16, sai em 44
    expect(d).toContain('M44 17');
    expect(pontos(d).filter((x) => x > 16 && x < 44)).toEqual([]);
  });

  it('laço fora da tela: o fio passa inteiro', () => {
    expect(fioComAbertura(64, -112).slice(1)).not.toMatch(/[ML]/);
  });
});
