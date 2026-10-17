// Serviço de experiências contra um cliente do Supabase simulado: o que é enviado, o que volta e como
// os erros viram mensagens. O comportamento real do banco é coberto por supabase/tests/*.mjs.
import {
  atualizarExperiencia,
  criarDesejo,
  definirFotoDestaque,
  excluirExperiencia,
  listarExperiencias,
  mudarEstado,
} from '@/services/experiencias';

type Resposta = { data: unknown; error: { code?: string; message?: string; name?: string } | null };

const mockChamadas: { metodo: string; args: unknown[] }[] = [];
let mockResposta: Resposta = { data: [], error: null };
// Resposta própria de uma tabela; as demais usam `mockResposta`.
let mockPorTabela: Record<string, Resposta> = {};
let mockExcecao: Error | null = null;

// Construtor encadeável: registra cada chamada e, ao ser aguardado, devolve a resposta combinada.
function mockConstrutor(tabela: string) {
  const c: Record<string, unknown> = {};
  for (const metodo of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'single']) {
    c[metodo] = (...args: unknown[]) => {
      mockChamadas.push({ metodo, args });
      return c;
    };
  }
  c.then = (resolve: (r: Resposta) => unknown, rejeitar: (e: unknown) => unknown) =>
    (mockExcecao ? Promise.reject(mockExcecao) : Promise.resolve(mockPorTabela[tabela] ?? mockResposta)).then(
      resolve,
      rejeitar
    );
  return c;
}

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: (tabela: string) => mockConstrutor(tabela),
    rpc: (...args: unknown[]) => {
      mockChamadas.push({ metodo: 'rpc', args });
      return mockExcecao ? Promise.reject(mockExcecao) : Promise.resolve(mockResposta);
    },
  },
}));

const linha = (extra: Record<string, unknown> = {}) => ({
  id: 'd1',
  titulo: 'Ver o nascer do sol',
  estado: 'desejo',
  local: null,
  observacoes: null,
  referencia_precisao: 'sem_data',
  referencia_inicio: null,
  referencia_fim: null,
  referencia_horario: null,
  inicio_em: null,
  foto_destaque_id: null,
  foto_destaque: null,
  criado_em: '2026-10-15T12:00:00Z',
  atualizado_em: '2026-10-15T12:00:00Z',
  ...extra,
});

const enviado = (metodo: string) => mockChamadas.find((c) => c.metodo === metodo)?.args[0];
const filtros = () => mockChamadas.filter((c) => c.metodo === 'eq').map((c) => c.args);

beforeEach(() => {
  mockChamadas.length = 0;
  mockResposta = { data: [], error: null };
  mockPorTabela = {};
  mockExcecao = null;
});

describe('listarExperiencias', () => {
  it('traz todos os estados, do mais novo para o mais antigo, e converte as colunas', async () => {
    mockResposta = {
      data: [
        linha({
          estado: 'planejamento',
          local: 'Praia',
          referencia_precisao: 'data_horario',
          referencia_inicio: '2026-12-10',
          referencia_horario: '19:30:00',
          inicio_em: '2026-12-10T22:30:00+00:00',
        }),
      ],
      error: null,
    };
    const r = await listarExperiencias();

    expect(r).toEqual({
      ok: true,
      experiencias: [
        {
          id: 'd1',
          titulo: 'Ver o nascer do sol',
          estado: 'planejamento',
          local: 'Praia',
          observacoes: null,
          referencia: { precisao: 'data_horario', inicio: '2026-12-10', fim: null, horario: '19:30' },
          inicioEm: '2026-12-10T22:30:00+00:00',
          fotoDestaque: null,
          tamanho: null,
          categorias: [],
          roteiroAtivo: false,
          orcamentoAtivo: false,
          orcamentoCentavos: null,
          criadoEm: '2026-10-15T12:00:00Z',
          atualizadoEm: '2026-10-15T12:00:00Z',
        },
      ],
    });
    expect(filtros()).toEqual([]);
    expect(mockChamadas.find((c) => c.metodo === 'order')?.args).toEqual(['criado_em', { ascending: false }]);
  });

  it('falha de rede vira a mensagem de conexão', async () => {
    mockResposta = { data: null, error: { name: 'TypeError', message: 'Network request failed' } };
    expect(await listarExperiencias()).toMatchObject({ ok: false, codigo: 'rede' });
  });

  it('exceção do cliente também vira falha de rede', async () => {
    mockExcecao = new Error('boom');
    expect(await listarExperiencias()).toMatchObject({ ok: false, codigo: 'rede' });
  });

  it('erro do servidor vira uma falha genérica, sem detalhes', async () => {
    mockResposta = { data: null, error: { code: 'PGRST205', message: 'tabela interna x' } };
    const r = await listarExperiencias();
    expect(r).toMatchObject({ ok: false, codigo: 'desconhecido' });
    expect(JSON.stringify(r)).not.toContain('tabela interna x');
  });
});

describe('categorias e tamanho', () => {
  it('ao editar, tira as categorias que saíram, marca as novas e envia o tamanho', async () => {
    mockResposta = { data: [linha({ categorias: [{ categoria_id: 'a' }, { categoria_id: 'b' }] })], error: null };
    mockPorTabela.categorias = { data: [{ id: 'c' }], error: null };
    const r = await atualizarExperiencia('d1', { titulo: 'Filme', tamanho: 'noite', categorias: ['b', 'c'] });

    expect(r).toMatchObject({ ok: true, experiencia: { categorias: ['b', 'c'] } });
    expect(enviado('update')).toMatchObject({ tamanho: 'noite' });
    expect(mockChamadas.find((c) => c.metodo === 'in')?.args).toEqual(['categoria_id', ['a']]);
    const insercoes = mockChamadas.filter((c) => c.metodo === 'insert');
    expect(insercoes.at(-1)?.args[0]).toEqual([{ experiencia_id: 'd1', categoria_id: 'c' }]);
  });

  it('categoria excluída com o formulário aberto é ignorada, sem erro', async () => {
    mockResposta = { data: [linha({ categorias: [{ categoria_id: 'a' }] })], error: null };
    mockPorTabela.categorias = { data: [{ id: 'c' }], error: null }; // 'sumiu' já não existe
    const r = await atualizarExperiencia('d1', { titulo: 'Filme', categorias: ['a', 'sumiu', 'c'] });

    expect(r).toMatchObject({ ok: true, experiencia: { categorias: ['a', 'c'] } });
    const insercoes = mockChamadas.filter((c) => c.metodo === 'insert');
    expect(insercoes.at(-1)?.args[0]).toEqual([{ experiencia_id: 'd1', categoria_id: 'c' }]);
  });

  it('sem categorias no pedido, não mexe nas que já estão', async () => {
    mockResposta = { data: [linha({ categorias: [{ categoria_id: 'a' }] })], error: null };
    const r = await atualizarExperiencia('d1', { titulo: 'Filme' });

    expect(r).toMatchObject({ ok: true, experiencia: { categorias: ['a'] } });
    expect(mockChamadas.some((c) => c.metodo === 'delete')).toBe(false);
  });
});

describe('criarDesejo', () => {
  it('apara o título, converte texto vazio em nulo e manda "sem data" por padrão', async () => {
    mockResposta = { data: linha(), error: null };
    const r = await criarDesejo({ titulo: '  Ver o nascer do sol  ', local: '   ', observacoes: '' });

    expect(r.ok).toBe(true);
    expect(enviado('insert')).toEqual({
      titulo: 'Ver o nascer do sol',
      local: null,
      observacoes: null,
      referencia_precisao: 'sem_data',
      referencia_inicio: null,
      referencia_fim: null,
      referencia_horario: null,
      tamanho: null,
    });
  });

  it('envia a referência temporal e nunca o Laço, o estado ou campos calculados', async () => {
    mockResposta = { data: linha(), error: null };
    await criarDesejo({
      titulo: 'Viagem',
      referencia: { precisao: 'periodo', inicio: '2026-12-12', fim: '2026-12-15', horario: null },
    });

    const corpo = enviado('insert') as Record<string, unknown>;
    expect(corpo).toMatchObject({ referencia_precisao: 'periodo', referencia_inicio: '2026-12-12', referencia_fim: '2026-12-15' });
    for (const proibido of ['laco_id', 'estado', 'inicio_em', 'armado_em']) expect(corpo).not.toHaveProperty(proibido);
  });

  it('violação de limite do banco vira "dados inválidos"', async () => {
    mockResposta = { data: null, error: { code: '23514', message: 'check' } };
    expect(await criarDesejo({ titulo: 'x' })).toMatchObject({ ok: false, codigo: 'desejo_invalido' });
  });
});

describe('atualizarExperiencia', () => {
  it('atualiza em qualquer estado e devolve o registro novo', async () => {
    mockResposta = { data: [linha({ titulo: 'Novo título', estado: 'vivendo' })], error: null };
    const r = await atualizarExperiencia('d1', { titulo: ' Novo título ', local: '', observacoes: 'Nota' });

    expect(r).toMatchObject({ ok: true, experiencia: { id: 'd1', titulo: 'Novo título', estado: 'vivendo' } });
    expect(enviado('update')).toMatchObject({ titulo: 'Novo título', local: null, observacoes: 'Nota' });
    expect(filtros()).toEqual([['id', 'd1']]);
  });

  it('nenhuma linha atualizada: a outra pessoa excluiu', async () => {
    mockResposta = { data: [], error: null };
    expect(await atualizarExperiencia('d1', { titulo: 'x' })).toMatchObject({ ok: false, codigo: 'desejo_inexistente' });
  });
});

describe('excluirExperiencia', () => {
  it('exclui por id, em qualquer estado', async () => {
    expect(await excluirExperiencia('d1')).toEqual({ ok: true });
    expect(mockChamadas.map((c) => c.metodo)).toContain('delete');
    expect(filtros()).toEqual([['id', 'd1']]);
  });

  it('falha de rede é informada', async () => {
    mockResposta = { data: null, error: { message: 'Failed to fetch' } };
    expect(await excluirExperiencia('d1')).toMatchObject({ ok: false, codigo: 'rede' });
  });
});

describe('foto de destaque', () => {
  it('a lista traz o destaque com o caminho do arquivo', async () => {
    mockResposta = { data: [linha({ foto_destaque_id: 'f1', foto_destaque: { caminho: 'l/e/a.jpg' } })], error: null };
    const r = await listarExperiencias();
    expect(r.ok && r.experiencias[0].fotoDestaque).toEqual({ id: 'f1', caminho: 'l/e/a.jpg' });
  });

  it('escolher manda só o id da foto e devolve a experiência atualizada', async () => {
    mockResposta = { data: [linha({ foto_destaque_id: 'f1', foto_destaque: { caminho: 'a.jpg' } })], error: null };
    const r = await definirFotoDestaque('d1', 'f1');
    expect(enviado('update')).toEqual({ foto_destaque_id: 'f1' });
    expect(filtros()).toEqual([['id', 'd1']]);
    expect(r).toMatchObject({ ok: true, experiencia: { fotoDestaque: { id: 'f1', caminho: 'a.jpg' } } });
  });

  it('tirar o destaque manda nulo', async () => {
    mockResposta = { data: [linha()], error: null };
    await definirFotoDestaque('d1', null);
    expect(enviado('update')).toEqual({ foto_destaque_id: null });
  });

  it('foto recusada pelo servidor tem mensagem própria', async () => {
    mockResposta = { data: null, error: { code: '23514', message: 'foto_destaque_invalida' } };
    expect(await definirFotoDestaque('d1', 'outra')).toMatchObject({ ok: false, codigo: 'destaque_invalido' });
  });
});

describe('mudarEstado', () => {
  it('chama a função do servidor com a experiência e o novo estado', async () => {
    mockResposta = { data: { ok: true, estado: 'planejamento' }, error: null };
    expect(await mudarEstado('d1', 'planejamento')).toEqual({ ok: true, estado: 'planejamento' });
    expect(mockChamadas.find((c) => c.metodo === 'rpc')?.args).toEqual([
      'mudar_estado',
      { p_experiencia: 'd1', p_estado: 'planejamento' },
    ]);
  });

  it('transição fora do ciclo volta como erro', async () => {
    mockResposta = { data: { ok: false, codigo: 'transicao_invalida' }, error: null };
    expect(await mudarEstado('d1', 'memoria')).toMatchObject({ ok: false, codigo: 'transicao_invalida' });
  });

  it('experiência que sumiu vira "não existe mais"', async () => {
    mockResposta = { data: { ok: false, codigo: 'experiencia_inexistente' }, error: null };
    expect(await mudarEstado('d1', 'planejamento')).toMatchObject({ ok: false, codigo: 'desejo_inexistente' });
  });

  it('sem rede', async () => {
    mockExcecao = new Error('offline');
    expect(await mudarEstado('d1', 'planejamento')).toMatchObject({ ok: false, codigo: 'rede' });
  });
});
