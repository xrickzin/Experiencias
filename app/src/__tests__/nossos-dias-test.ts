import { combina, diaDe, fioDosLacos, semanasVividas } from '@/services/nossos-dias';

import { experiencia } from './apoio/experiencia';

const filme = experiencia('1', 'Duna 2 no sofá', {
  estado: 'memoria',
  categorias: ['c-filme'],
  referencia: { precisao: 'data', inicio: '2026-10-24', fim: null, horario: null },
});
const contexto = { nomes: new Map([['c-filme', 'Filme']]), impressoes: new Map([['1', ['Melhor domingo do mês']]]) };

describe('Nossos dias: busca', () => {
  it('acha pelo título, pelo tema, pelo mês e pela impressão, sem acento', () => {
    expect(combina(filme, 'sofa', contexto)).toBe(true);
    expect(combina(filme, 'filme', contexto)).toBe(true);
    expect(combina(filme, 'outubro', contexto)).toBe(true);
    expect(combina(filme, 'filme outubro 2026', contexto)).toBe(true);
    expect(combina(filme, 'outubro de 2026', contexto)).toBe(true);
    expect(combina(filme, 'filme de outubro', contexto)).toBe(true);
    expect(combina(filme, 'domingo', contexto)).toBe(true);
    expect(combina(filme, 'filme setembro', contexto)).toBe(false);
    expect(combina(filme, '   ', contexto)).toBe(true);
  });
});

describe('Nossos dias: calendário', () => {
  it('só as semanas com dia vivido; um dia só é uma semana', () => {
    // Novembro de 2026 começa num domingo.
    expect(semanasVividas(2026, 10, new Set([1]))).toEqual([[1, 2, 3, 4, 5, 6, 7]]);
    // Outubro de 2026 começa numa quinta: a primeira semana tem casas vazias.
    const outubro = semanasVividas(2026, 9, new Set([2, 31]));
    expect(outubro[0]).toEqual([null, null, null, null, 1, 2, 3]);
    expect(outubro.at(-1)).toEqual([25, 26, 27, 28, 29, 30, 31]);
    expect(outubro).toHaveLength(2);
  });

  it('o dia vem da data; só mês e ano não tem dia', () => {
    expect(diaDe(filme)).toBe(24);
    expect(diaDe({ ...filme, referencia: { precisao: 'mes_ano', inicio: '2026-10-01', fim: null, horario: null } })).toBeNull();
  });
});

describe('Nossos dias: os laços do calendário', () => {
  it('um dia é um laço com pontinhas; vários, um laço em cada dia ligados pelo fio', () => {
    const um = fioDosLacos([[50, 30]]);
    expect(um.startsWith('M')).toBe(true);
    // Um laço são quatro curvas; sem outro dia, nenhuma ligação.
    expect(um.match(/C/g)).toHaveLength(4);
    const tres = fioDosLacos([[25, 30], [75, 30], [25, 70]]);
    // Três laços (4 curvas cada) + a descida para a outra semana; a curva rasa na mesma semana.
    expect(tres.match(/C/g)).toHaveLength(4 * 3 + 1);
    expect(tres.match(/Q/g)).toHaveLength(1);
    expect(fioDosLacos([])).toBe('');
  });
});
