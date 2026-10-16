import {
  agruparFotos,
  capturaDoExif,
  diaEPeriodo,
  instanteDoMomento,
  momentoDaFoto,
  periodoDaHora,
} from '@/services/agrupar-fotos';
import type { Foto } from '@/services/fotos';

const foto = (id: string, capturadaEm: string | null, criadoEm = '2026-10-15T20:00:00Z'): Foto => ({
  id,
  caminho: `${id}.jpg`,
  url: null,
  autorId: null,
  capturadaEm,
  legenda: null,
  criadoEm,
});

// 15/10/2026 às 15h em Brasília (18h UTC).
const AGORA = new Date('2026-10-15T18:00:00Z');

describe('períodos do dia (horário de Brasília)', () => {
  it.each([
    [0, 'madrugada'],
    [4, 'madrugada'],
    [5, 'manha'],
    [11, 'manha'],
    [12, 'tarde'],
    [17, 'tarde'],
    [18, 'noite'],
    [23, 'noite'],
  ] as const)('%ih → %s', (hora, periodo) => expect(periodoDaHora(hora)).toBe(periodo));
});

describe('agruparFotos', () => {
  it('usa o horário de Brasília (UTC−3) para o dia e o período', () => {
    // 02:30 UTC do dia 16 = 23:30 de 15/10 em Brasília: ainda é "noite" do dia 15.
    const grupos = agruparFotos([foto('a', '2026-10-16T02:30:00Z')], AGORA);
    expect(grupos).toEqual([{ dia: '2026-10-15', rotulo: 'Hoje', periodos: [{ periodo: 'noite', fotos: [expect.objectContaining({ id: 'a' })] }] }]);
  });

  it('separa por dia e por período, das mais recentes para as mais antigas', () => {
    const grupos = agruparFotos(
      [
        foto('manha15', '2026-10-15T11:00:00Z'), // 08h
        foto('tarde15', '2026-10-15T17:00:00Z'), // 14h
        foto('tarde15b', '2026-10-15T19:30:00Z'), // 16h30
        foto('noite14', '2026-10-15T00:30:00Z'), // 21h30 do dia 14
        foto('madrugada14', '2026-10-14T05:00:00Z'), // 02h do dia 14
        foto('setembro', '2026-09-03T15:00:00Z'), // 12h de 03/09
      ],
      AGORA
    );

    expect(grupos.map((g) => [g.rotulo, g.periodos.map((p) => [p.periodo, p.fotos.map((f) => f.id)])])).toEqual([
      ['Hoje', [['tarde', ['tarde15b', 'tarde15']], ['manha', ['manha15']]]],
      ['Ontem', [['noite', ['noite14']], ['madrugada', ['madrugada14']]]],
      ['3 de setembro', [['tarde', ['setembro']]]],
    ]);
  });

  it('sem data de captura, vale o momento do envio', () => {
    const f = foto('a', null, '2026-10-15T12:00:00Z');
    expect(momentoDaFoto(f)).toBe('2026-10-15T12:00:00Z');
    expect(agruparFotos([f], AGORA)[0].periodos[0].periodo).toBe('manha'); // 09h em Brasília
  });

  it('outro ano mostra o ano', () => {
    expect(agruparFotos([foto('a', '2025-12-31T15:00:00Z')], AGORA)[0].rotulo).toBe('31 de dezembro de 2025');
  });

  it('sem fotos, nenhum grupo', () => {
    expect(agruparFotos([], AGORA)).toEqual([]);
  });
});

describe('capturaDoExif', () => {
  it('lê DateTimeOriginal como horário de Brasília quando a foto não traz o fuso', () => {
    expect(capturaDoExif({ DateTimeOriginal: '2026:10:14 21:30:05' })).toBe('2026-10-15T00:30:05.000Z');
  });

  it('usa o fuso gravado na foto quando existe', () => {
    expect(capturaDoExif({ DateTimeOriginal: '2026:10:14 21:30:05', OffsetTimeOriginal: '+01:00' })).toBe(
      '2026-10-14T20:30:05.000Z'
    );
  });

  it('cai para DateTimeDigitized e DateTime', () => {
    expect(capturaDoExif({ DateTimeDigitized: '2026:01:02 10:00:00' })).toBe('2026-01-02T13:00:00.000Z');
    expect(capturaDoExif({ DateTime: '2026:01:02 10:00:00' })).toBe('2026-01-02T13:00:00.000Z');
  });

  it.each([
    ['sem EXIF', null],
    ['sem data', { Make: 'Câmera' }],
    ['formato estranho', { DateTimeOriginal: 'ontem à noite' }],
    ['relógio zerado', { DateTimeOriginal: '1970:01:01 00:00:00' }],
    ['no futuro', { DateTimeOriginal: '2099:01:01 00:00:00' }],
  ])('ignora: %s', (_nome, exif) => expect(capturaDoExif(exif as Record<string, unknown> | null)).toBeNull());
});

describe('momento escolhido para uma observação (Brasília)', () => {
  const agora = new Date('2026-10-15T18:30:00Z'); // 15h30 em Brasília: tarde

  it('dia e período de um instante', () => {
    expect(diaEPeriodo('2026-10-15T02:30:00Z')).toEqual({ dia: '2026-10-14', periodo: 'noite' }); // 23h30 do dia 14
    expect(diaEPeriodo('2026-10-15T12:00:00Z')).toEqual({ dia: '2026-10-15', periodo: 'manha' });
  });

  it('o momento atual guarda o instante de agora', () => {
    expect(instanteDoMomento('2026-10-15', 'tarde', agora)).toBe(agora.toISOString());
  });

  it('outro momento guarda uma hora no meio do período, que volta ao mesmo dia e período', () => {
    for (const periodo of ['madrugada', 'manha', 'tarde', 'noite'] as const) {
      const instante = instanteDoMomento('2026-10-14', periodo, agora);
      expect(diaEPeriodo(instante)).toEqual({ dia: '2026-10-14', periodo });
    }
    expect(instanteDoMomento('2026-10-14', 'manha', agora)).toBe('2026-10-14T12:00:00.000Z'); // 9h
  });
});
