import { organizarInicio } from '@/services/inicio';
import {
  camposDaReferencia,
  descreverReferencia,
  lerReferencia,
  mascararData,
  mascararHorario,
  mascararMesAno,
  SEM_DATA,
  type CamposDaReferencia,
} from '@/services/referencia-temporal';

import { experiencia } from './apoio/experiencia';

const campos = (parcial: Partial<CamposDaReferencia>): CamposDaReferencia => ({
  precisao: 'sem_data',
  data: '',
  dataFim: '',
  mesAno: '',
  horario: '',
  ...parcial,
});

describe('máscaras', () => {
  it.each([
    ['1', '1'],
    ['1210', '12/10'],
    ['12102026', '12/10/2026'],
    ['12/10/2026', '12/10/2026'],
    ['12a10b2026999', '12/10/2026'],
  ])('data %j → %j', (entrada, saida) => expect(mascararData(entrada)).toBe(saida));

  it('mês e ano', () => {
    expect(mascararMesAno('102026')).toBe('10/2026');
    expect(mascararMesAno('10')).toBe('10');
  });

  it('horário', () => {
    expect(mascararHorario('1930')).toBe('19:30');
    expect(mascararHorario('7')).toBe('7');
  });
});

describe('lerReferencia', () => {
  it('sem data', () => {
    expect(lerReferencia(campos({ precisao: 'sem_data', data: '12/10/2026' }))).toEqual({ ok: true, referencia: SEM_DATA });
  });

  it('mês: guarda o primeiro dia do mês', () => {
    expect(lerReferencia(campos({ precisao: 'mes_ano', mesAno: '10/2026' }))).toEqual({
      ok: true,
      referencia: { precisao: 'mes_ano', inicio: '2026-10-01', fim: null, horario: null },
    });
  });

  it('dia', () => {
    expect(lerReferencia(campos({ precisao: 'data', data: '12/10/2026' }))).toMatchObject({
      ok: true,
      referencia: { precisao: 'data', inicio: '2026-10-12' },
    });
  });

  it('dia e horário', () => {
    expect(lerReferencia(campos({ precisao: 'data_horario', data: '12/10/2026', horario: '19:30' }))).toEqual({
      ok: true,
      referencia: { precisao: 'data_horario', inicio: '2026-10-12', fim: null, horario: '19:30' },
    });
  });

  it('período', () => {
    expect(lerReferencia(campos({ precisao: 'periodo', data: '12/10/2026', dataFim: '15/10/2026' }))).toEqual({
      ok: true,
      referencia: { precisao: 'periodo', inicio: '2026-10-12', fim: '2026-10-15', horario: null },
    });
  });

  it('período de um dia só vale', () => {
    expect(lerReferencia(campos({ precisao: 'periodo', data: '12/10/2026', dataFim: '12/10/2026' })).ok).toBe(true);
  });

  it('29 de fevereiro só em ano bissexto', () => {
    expect(lerReferencia(campos({ precisao: 'data', data: '29/02/2028' })).ok).toBe(true);
    expect(lerReferencia(campos({ precisao: 'data', data: '29/02/2027' })).ok).toBe(false);
  });

  it.each([
    ['dia incompleto', { precisao: 'data', data: '12/10' }],
    ['31 de abril', { precisao: 'data', data: '31/04/2026' }],
    ['mês 13', { precisao: 'data', data: '12/13/2026' }],
    ['ano fora do intervalo', { precisao: 'data', data: '12/10/1800' }],
    ['mês vazio', { precisao: 'mes_ano', mesAno: '' }],
    ['mês 00', { precisao: 'mes_ano', mesAno: '00/2026' }],
    ['horário 24:00', { precisao: 'data_horario', data: '12/10/2026', horario: '24:00' }],
    ['horário sem minutos', { precisao: 'data_horario', data: '12/10/2026', horario: '19' }],
    ['período sem fim', { precisao: 'periodo', data: '12/10/2026' }],
  ] as const)('recusa: %s', (_nome, parcial) => {
    const r = lerReferencia(campos(parcial));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toMatch(/\w/);
  });

  it('período com fim antes do começo tem mensagem própria', () => {
    expect(lerReferencia(campos({ precisao: 'periodo', data: '15/10/2026', dataFim: '12/10/2026' }))).toEqual({
      ok: false,
      erro: 'O fim do período não pode ser antes do começo.',
    });
  });
});

describe('camposDaReferencia (do banco para a tela)', () => {
  it.each([
    [{ precisao: 'mes_ano', inicio: '2026-10-01', fim: null, horario: null }, { mesAno: '10/2026', data: '' }],
    [{ precisao: 'data', inicio: '2026-10-12', fim: null, horario: null }, { data: '12/10/2026' }],
    [{ precisao: 'data_horario', inicio: '2026-10-12', fim: null, horario: '19:30' }, { data: '12/10/2026', horario: '19:30' }],
    [{ precisao: 'periodo', inicio: '2026-10-12', fim: '2026-10-15', horario: null }, { data: '12/10/2026', dataFim: '15/10/2026' }],
  ] as const)('%j', (referencia, esperado) => {
    const c = camposDaReferencia(referencia);
    expect(c).toMatchObject({ precisao: referencia.precisao, ...esperado });
    // Ida e volta: o que a tela mostra é lido de novo como o mesmo valor.
    expect(lerReferencia(c)).toEqual({ ok: true, referencia });
  });
});

describe('descreverReferencia', () => {
  it.each([
    [SEM_DATA, null],
    [{ precisao: 'mes_ano', inicio: '2026-10-01', fim: null, horario: null }, 'outubro de 2026'],
    [{ precisao: 'data', inicio: '2026-10-12', fim: null, horario: null }, '12/10/2026'],
    [{ precisao: 'data_horario', inicio: '2026-10-12', fim: null, horario: '19:30' }, '12/10/2026, 19:30'],
    [{ precisao: 'periodo', inicio: '2026-10-12', fim: '2026-10-15', horario: null }, '12 a 15 de outubro de 2026'],
    [{ precisao: 'periodo', inicio: '2026-10-28', fim: '2026-11-02', horario: null }, '28 de outubro a 2 de novembro de 2026'],
    [{ precisao: 'periodo', inicio: '2026-12-28', fim: '2027-01-02', horario: null }, '28/12/2026 a 02/01/2027'],
  ] as const)('%j → %j', (referencia, texto) => expect(descreverReferencia(referencia)).toBe(texto));
});

describe('organizarInicio', () => {
  const agora = new Date('2026-10-15T12:00:00Z');
  const dia = (iso: string) => ({ precisao: 'data' as const, inicio: iso, fim: null, horario: null });

  it('separa vivendo, próximas e o que está em preparação; desejos só contam', () => {
    const r = organizarInicio(
      [
        experiencia('d1', 'Desejo'),
        experiencia('d2', 'Outro desejo'),
        experiencia('v1', 'Vivendo', { estado: 'vivendo' }),
        experiencia('p1', 'Próxima longe', { estado: 'planejamento', referencia: dia('2026-12-20'), inicioEm: '2026-12-20T03:00:00Z' }),
        experiencia('p2', 'Próxima perto', { estado: 'planejamento', referencia: dia('2026-10-20'), inicioEm: '2026-10-20T03:00:00Z' }),
        experiencia('p3', 'Sem data', { estado: 'planejamento', atualizadoEm: '2026-10-10T00:00:00Z' }),
        experiencia('p4', 'Só o mês', {
          estado: 'planejamento',
          referencia: { precisao: 'mes_ano', inicio: '2026-11-01', fim: null, horario: null },
          atualizadoEm: '2026-10-14T00:00:00Z',
        }),
        experiencia('p5', 'Data que já passou', {
          estado: 'planejamento',
          referencia: dia('2026-10-01'),
          inicioEm: '2026-10-01T03:00:00Z',
          atualizadoEm: '2026-10-12T00:00:00Z',
        }),
      ],
      agora
    );

    expect(r.vivendo.map((e) => e.id)).toEqual(['v1']);
    expect(r.proximas.map((e) => e.id)).toEqual(['p2', 'p1']);
    // Sem instante futuro: a atualizada mais recentemente primeiro; data passada fica aqui, sem alerta.
    expect(r.planejamentos.map((e) => e.id)).toEqual(['p4', 'p5', 'p3']);
    expect(r.todosOsPlanejamentos).toHaveLength(5);
    expect(r.totalDeDesejos).toBe(2);
  });

  it('Vivendo: pela referência disponível; sem ela, a atualizada mais recentemente', () => {
    const r = organizarInicio(
      [
        experiencia('a', 'Sem data antiga', { estado: 'vivendo', atualizadoEm: '2026-10-01T00:00:00Z' }),
        experiencia('b', 'Com data depois', { estado: 'vivendo', referencia: dia('2026-10-14') }),
        experiencia('c', 'Com data antes', { estado: 'vivendo', referencia: dia('2026-10-10') }),
        experiencia('d', 'Sem data recente', { estado: 'vivendo', atualizadoEm: '2026-10-14T00:00:00Z' }),
      ],
      agora
    );
    expect(r.vivendo.map((e) => e.id)).toEqual(['c', 'b', 'd', 'a']);
  });

  it('sem nada em andamento, todas as listas ficam vazias', () => {
    const r = organizarInicio([experiencia('d1', 'Desejo')], agora);
    expect([r.vivendo, r.proximas, r.planejamentos]).toEqual([[], [], []]);
  });
});
