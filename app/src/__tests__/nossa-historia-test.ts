import type { Experiencia } from '@/services/experiencias';
import { agruparPorMes } from '@/services/nossa-historia';
import type { ReferenciaTemporal } from '@/services/referencia-temporal';

import { experiencia } from './apoio/experiencia';

const ref = (precisao: ReferenciaTemporal['precisao'], inicio: string, fim: string | null = null, horario: string | null = null) => ({
  precisao,
  inicio,
  fim,
  horario,
});
const memoria = (titulo: string, referencia: ReferenciaTemporal): Experiencia =>
  experiencia(titulo, titulo, { estado: 'memoria', referencia });
const resumo = (memorias: Experiencia[]) =>
  agruparPorMes(memorias).map((m) => ({
    rotulo: m.rotulo,
    comDia: m.comDia.map((e) => e.titulo),
    semDia: m.semDia.map((e) => e.titulo),
  }));

describe('Nossa História: agrupamento por mês', () => {
  it('meses do mais recente ao mais antigo; dentro do mês, ordem crescente', () => {
    expect(
      resumo([
        memoria('Teatro', ref('data', '2026-10-24')),
        memoria('Feira', ref('data', '2026-09-05')),
        memoria('Jantar', ref('data_horario', '2026-10-03', null, '20:00:00')),
        memoria('Almoço', ref('data_horario', '2026-10-03', null, '12:00:00')),
      ])
    ).toEqual([
      { rotulo: 'Outubro de 2026', comDia: ['Almoço', 'Jantar', 'Teatro'], semDia: [] },
      { rotulo: 'Setembro de 2026', comDia: ['Feira'], semDia: [] },
    ]);
  });

  it('período conta uma vez só, pelo mês de início, inclusive na virada do ano', () => {
    expect(
      resumo([
        memoria('Feriado', ref('periodo', '2026-10-28', '2026-11-02')),
        memoria('Réveillon', ref('periodo', '2026-12-30', '2027-01-03')),
      ])
    ).toEqual([
      { rotulo: 'Dezembro de 2026', comDia: ['Réveillon'], semDia: [] },
      { rotulo: 'Outubro de 2026', comDia: ['Feriado'], semDia: [] },
    ]);
  });

  it('memória só com mês/ano fica à parte no mês, sem entrar na ordem dos dias', () => {
    expect(
      resumo([
        memoria('Piquenique', ref('mes_ano', '2026-10-01')),
        memoria('Show', ref('data', '2026-10-01')),
        memoria('Acampamento', ref('mes_ano', '2026-10-01')),
        memoria('Só março', ref('mes_ano', '2019-03-01')),
      ])
    ).toEqual([
      { rotulo: 'Outubro de 2026', comDia: ['Show'], semDia: ['Acampamento', 'Piquenique'] },
      { rotulo: 'Março de 2019', comDia: [], semDia: ['Só março'] },
    ]);
  });

  it('sem memórias, nenhum mês', () => {
    expect(agruparPorMes([])).toEqual([]);
  });
});
