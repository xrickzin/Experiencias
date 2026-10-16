// Serviços da Fase 5 (finalizar, registrar memória, observações, impressões) contra um cliente do
// Supabase simulado. A regra de privacidade em si é do banco: supabase/tests/memoria.mjs.
import { finalizarExperiencia, registrarMemoria } from '@/services/experiencias';
import { legendarFoto } from '@/services/fotos';
import { escolherMomentoFavorito, listarImpressoes, salvarImpressao } from '@/services/impressoes';
import { criarObservacao, editarObservacao, listarObservacoes } from '@/services/observacoes';

type Resposta = { data: unknown; error: { code?: string; message?: string; name?: string } | null };

const mockChamadas: { metodo: string; args: unknown[] }[] = [];
let mockResposta: Resposta = { data: [], error: null };

function mockConstrutor() {
  const c: Record<string, unknown> = {};
  for (const metodo of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single']) {
    c[metodo] = (...args: unknown[]) => {
      mockChamadas.push({ metodo, args });
      return c;
    };
  }
  c.then = (resolve: (r: Resposta) => unknown, rejeitar: (e: unknown) => unknown) =>
    Promise.resolve(mockResposta).then(resolve, rejeitar);
  return c;
}

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: () => mockConstrutor(),
    rpc: (...args: unknown[]) => {
      mockChamadas.push({ metodo: 'rpc', args });
      return Promise.resolve(mockResposta);
    },
  },
}));

const enviado = (metodo: string) => mockChamadas.find((c) => c.metodo === metodo)?.args;
const filtros = () => mockChamadas.filter((c) => c.metodo === 'eq').map((c) => c.args);

beforeEach(() => {
  mockChamadas.length = 0;
  mockResposta = { data: [], error: null };
});

describe('finalizar', () => {
  it('com data: só o id; o servidor usa a data que já existe', async () => {
    mockResposta = { data: { ok: true }, error: null };
    expect(await finalizarExperiencia('e1', null)).toEqual({ ok: true });
    expect(enviado('rpc')).toEqual(['finalizar_experiencia', { p_experiencia: 'e1' }]);
  });

  it('sem data: manda a referência informada', async () => {
    mockResposta = { data: { ok: true }, error: null };
    await finalizarExperiencia('e1', { precisao: 'mes_ano', inicio: '2026-10-01', fim: null, horario: null });
    expect(enviado('rpc')).toEqual([
      'finalizar_experiencia',
      { p_experiencia: 'e1', p_precisao: 'mes_ano', p_inicio: '2026-10-01', p_fim: null, p_horario: null },
    ]);
  });

  it('o servidor pede a data: volta o código para a tela perguntar', async () => {
    mockResposta = { data: { ok: false, codigo: 'referencia_obrigatoria' }, error: null };
    expect(await finalizarExperiencia('e1', null)).toMatchObject({ ok: false, codigo: 'referencia_obrigatoria' });
  });

  it('experiência que não existe mais', async () => {
    mockResposta = { data: { ok: false, codigo: 'experiencia_inexistente' }, error: null };
    expect(await finalizarExperiencia('e1', null)).toMatchObject({ ok: false, codigo: 'desejo_inexistente' });
  });
});

describe('registrar uma memória', () => {
  it('cria já em Memória, com a referência', async () => {
    mockResposta = {
      data: {
        id: 'm1',
        titulo: 'Primeiro encontro',
        estado: 'memoria',
        referencia_precisao: 'mes_ano',
        referencia_inicio: '2019-03-01',
        criado_em: '2026-10-15T12:00:00Z',
      },
      error: null,
    };
    const r = await registrarMemoria({
      titulo: ' Primeiro encontro ',
      referencia: { precisao: 'mes_ano', inicio: '2019-03-01', fim: null, horario: null },
    });
    expect(enviado('insert')?.[0]).toMatchObject({ titulo: 'Primeiro encontro', estado: 'memoria', referencia_precisao: 'mes_ano' });
    expect(r).toMatchObject({ ok: true, memoria: { id: 'm1', estado: 'memoria' } });
  });

  it('sem data o banco recusa, com mensagem de memória', async () => {
    mockResposta = { data: null, error: { code: '23514', message: 'check' } };
    expect(await registrarMemoria({ titulo: 'x' })).toMatchObject({ ok: false, codigo: 'memoria_invalida' });
  });
});

describe('observações', () => {
  it('lista só as observações da experiência', async () => {
    mockResposta = { data: [{ id: 'o1', texto: 'Mesa 4', autor_id: 'm2', capturada_em: null, criado_em: 'x' }], error: null };
    const r = await listarObservacoes('e1');
    expect(filtros()).toEqual([
      ['experiencia_id', 'e1'],
      ['tipo', 'observacao'],
    ]);
    expect(r).toEqual({ ok: true, observacoes: [{ id: 'o1', texto: 'Mesa 4', autorId: 'm2', capturadaEm: null, criadoEm: 'x' }] });
  });

  it('criar manda o tipo, o texto sem espaços nas pontas e o momento escolhido', async () => {
    mockResposta = { data: { id: 'o1', texto: 'Mesa 4', autor_id: 'm1', capturada_em: 'm', criado_em: 'x' }, error: null };
    await criarObservacao('e1', '  Mesa 4  ', '2026-10-14T12:00:00.000Z');
    expect(enviado('insert')?.[0]).toEqual({
      experiencia_id: 'e1',
      tipo: 'observacao',
      texto: 'Mesa 4',
      capturada_em: '2026-10-14T12:00:00.000Z',
    });
  });

  it('vazia ou longa demais nem vai ao servidor', async () => {
    expect(await criarObservacao('e1', '   ', 'm')).toMatchObject({ ok: false, codigo: 'observacao_invalida' });
    expect(await criarObservacao('e1', 'a'.repeat(2001), 'm')).toMatchObject({ ok: false, codigo: 'observacao_invalida' });
    expect(mockChamadas).toHaveLength(0);
  });

  it('editar algo que a outra pessoa excluiu', async () => {
    mockResposta = { data: [], error: null };
    expect(await editarObservacao('o1', 'novo', 'm')).toMatchObject({ ok: false, codigo: 'observacao_inexistente' });
    expect(enviado('update')?.[0]).toEqual({ texto: 'novo', capturada_em: 'm' });
  });
});

describe('legenda da foto', () => {
  it('guarda sem espaços nas pontas', async () => {
    mockResposta = { data: [{ legenda: 'Primeira noite' }], error: null };
    expect(await legendarFoto('f1', '  Primeira noite ')).toEqual({ ok: true, legenda: 'Primeira noite' });
    expect(enviado('update')?.[0]).toEqual({ legenda: 'Primeira noite' });
    expect(filtros()).toEqual([['id', 'f1']]);
  });

  it('vazia tira a legenda', async () => {
    mockResposta = { data: [{ legenda: null }], error: null };
    expect(await legendarFoto('f1', '   ')).toEqual({ ok: true, legenda: null });
    expect(enviado('update')?.[0]).toEqual({ legenda: null });
  });

  it('longa demais nem vai ao servidor', async () => {
    expect(await legendarFoto('f1', 'a'.repeat(301))).toMatchObject({ ok: false, codigo: 'legenda_longa' });
    expect(mockChamadas).toHaveLength(0);
  });

  it('foto que a outra pessoa excluiu', async () => {
    mockResposta = { data: [], error: null };
    expect(await legendarFoto('f1', 'x')).toMatchObject({ ok: false, codigo: 'foto_inexistente' });
  });
});

describe('impressões', () => {
  it('lista as linhas visíveis com a foto do favorito', async () => {
    mockResposta = {
      data: [
        { membro_id: 'm1', texto: null, momento_favorito_id: 'f1', momento_favorito: { caminho: 'l/e/a.jpg' } },
        { membro_id: 'm2', texto: 'Sem pressa.', momento_favorito_id: null, momento_favorito: null },
      ],
      error: null,
    };
    expect(await listarImpressoes('e1')).toEqual({
      ok: true,
      impressoes: [
        { membroId: 'm1', texto: null, momentoFavorito: { id: 'f1', caminho: 'l/e/a.jpg' } },
        { membroId: 'm2', texto: 'Sem pressa.', momentoFavorito: null },
      ],
    });
  });

  it('salvar e apagar (texto vazio) passam pela função do servidor', async () => {
    mockResposta = { data: { ok: true }, error: null };
    await salvarImpressao('e1', 'Foi bom.');
    await salvarImpressao('e1', '');
    expect(mockChamadas.map((c) => c.args)).toEqual([
      ['salvar_minha_impressao', { p_experiencia: 'e1', p_texto: 'Foi bom.' }],
      ['salvar_minha_impressao', { p_experiencia: 'e1', p_texto: '' }],
    ]);
  });

  it('impressão longa demais nem vai ao servidor', async () => {
    expect(await salvarImpressao('e1', 'a'.repeat(4001))).toMatchObject({ ok: false, codigo: 'impressao_longa' });
    expect(mockChamadas).toHaveLength(0);
  });

  it('favorito recusado tem mensagem própria', async () => {
    mockResposta = { data: { ok: false, codigo: 'favorito_invalido' }, error: null };
    expect(await escolherMomentoFavorito('e1', 'f9')).toMatchObject({
      ok: false,
      codigo: 'favorito_invalido',
      mensagem: expect.stringContaining('momento favorito'),
    });
  });
});
