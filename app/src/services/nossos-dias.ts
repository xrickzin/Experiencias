// Nossos dias (ADR 045): a busca e o calendário do caderninho. Sem tela aqui, só as contas.
import type { Experiencia } from '@/services/experiencias';
import { MESES } from '@/services/referencia-temporal';

export const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const LIGACAO = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'no', 'na', 'em']);

type Contexto = {
  /** Nome de cada categoria do Laço, pelo id. */
  nomes: Map<string, string>;
  /** Os textos de impressão que a pessoa pode ver, por memória (o banco já filtrou). */
  impressoes: Map<string, string[]>;
};

/**
 * Procura no título, no local, nas observações, nas impressões visíveis, no nome do tema e no mês
 * ("outubro", "outubro de 2026"), sem diferenciar acentos nem maiúsculas. Cada palavra precisa
 * aparecer em algum lugar: "filme outubro" acha os filmes de outubro.
 */
export function combina(m: Experiencia, termo: string, { nomes, impressoes }: Contexto) {
  // As palavras de ligação não contam: "outubro de 2026" é o próprio cabeçalho do mês.
  const palavras = normalizar(termo)
    .split(/\s+/)
    .filter((p) => p && !LIGACAO.has(p));
  if (!palavras.length) return true;
  const inicio = m.referencia.inicio;
  const mes = inicio ? `${MESES[Number(inicio.slice(5, 7)) - 1]} de ${inicio.slice(0, 4)}` : '';
  const texto = normalizar(
    [m.titulo, m.local, m.observacoes, mes, ...m.categorias.map((c) => nomes.get(c)), ...(impressoes.get(m.id) ?? [])]
      .filter(Boolean)
      .join(' ')
  );
  return palavras.every((p) => texto.includes(p));
}

export type SemanaDoMes = (number | null)[];

/**
 * As semanas do mês (domingo a sábado) que têm algum dia vivido. Um mês com um dia só mostra uma
 * semana, não o mês inteiro. `null` é casa vazia antes do dia 1 ou depois do último dia.
 */
export function semanasVividas(ano: number, mes: number, vividos: Set<number>): SemanaDoMes[] {
  const primeiro = new Date(ano, mes, 1).getDay();
  const total = new Date(ano, mes + 1, 0).getDate();
  const casas: (number | null)[] = [...Array(primeiro).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (casas.length % 7) casas.push(null);
  const semanas: SemanaDoMes[] = [];
  for (let i = 0; i < casas.length; i += 7) {
    const semana = casas.slice(i, i + 7);
    if (semana.some((d) => d !== null && vividos.has(d))) semanas.push(semana);
  }
  return semanas;
}

/** O dia do mês em que a memória começou, ou nulo quando só há mês e ano. */
export const diaDe = (m: Experiencia) =>
  m.referencia.precisao === 'mes_ano' || !m.referencia.inicio ? null : Number(m.referencia.inicio.slice(8, 10));

export const DIAS_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/**
 * O fio do calendário dando um laço em cada dia vivido, como o laço das abas (o fio sobe, dá a
 * volta e cruza a própria passagem), em escala `s`. `pontos` são as bases dos laços, na ordem dos
 * dias. Um dia só: o laço com duas pontinhas, sem fio. Vários: o fio laça um dia e parte para o
 * próximo; chegando a um dia pela direita, o laço é dado espelhado (entra pela direita, sai pela
 * esquerda), e assim o fio serpenteia sem cruzar os números.
 */
export function fioDosLacos(pontos: [number, number][], s = 0.7): string {
  if (!pontos.length) return '';
  const r = (n: number) => +n.toFixed(1);
  // As medidas do laço das abas (components/abas.tsx), centradas no dia; `lado` -1 espelha.
  const entrada = (cx: number, lado: number) => r(cx + lado * (14 - 23) * s);
  const saida = (cx: number, lado: number) => r(cx + lado * (42 - 23) * s);
  const laco = (cx: number, base: number, lado: number) => {
    const x = (dx: number) => r(cx + lado * (dx - 23) * s);
    const y = (dy: number) => r(base - dy * s);
    return (
      ` C${x(18)} ${base} ${x(20)} ${y(2)} ${x(23)} ${y(4)}` +
      ` C${x(28)} ${y(8)} ${x(29)} ${y(15)} ${x(23)} ${y(15)}` +
      ` C${x(17)} ${y(15)} ${x(17)} ${y(8)} ${x(25)} ${y(3)}` +
      ` C${x(30)} ${base} ${x(34)} ${base} ${x(42)} ${base}`
    );
  };
  const PONTA = 6; // as pontinhas antes do primeiro laço e depois do último
  const [x0, y0] = pontos[0];
  let lado = 1;
  let d = `M${entrada(x0, 1) - PONTA} ${y0} L${entrada(x0, 1)} ${y0}` + laco(x0, y0, 1);
  for (let i = 1; i < pontos.length; i++) {
    const [ax, ay] = pontos[i - 1];
    const [bx, by] = pontos[i];
    const de = saida(ax, lado);
    if (ay === by) {
      // Na mesma semana, o próximo dia fica à direita: uma curva rasa por baixo, e o laço de sempre.
      const ate = entrada(bx, 1);
      d += ` Q${r((de + ate) / 2)} ${ay + 5} ${ate} ${by}`;
      lado = 1;
    } else {
      // Para outra semana: o laço seguinte começa do lado em que o fio já está, e a curva desce
      // pela lateral, longe do número.
      const novo = de > bx ? -1 : 1;
      const ate = entrada(bx, novo);
      d += ` C${r(de + lado * 16)} ${ay}, ${r(ate - novo * 16)} ${by}, ${ate} ${by}`;
      lado = novo;
    }
    d += laco(bx, by, lado);
  }
  const [xn, yn] = pontos[pontos.length - 1];
  return `${d} L${r(saida(xn, lado) + lado * PONTA)} ${yn}`;
}
