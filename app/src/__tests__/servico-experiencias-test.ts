import {
  atualizarDesejo,
  criarDesejo,
  excluirDesejo,
  listarDesejos,
} from '@/services/experiencias';

// Serviço de desejos contra um cliente do Supabase simulado: o que é enviado, o que volta e como os
// erros viram mensagens. O comportamento real do banco é coberto por supabase/tests/experiencias.mjs.

type Resposta = { data: unknown; error: { code?: string; message?: string; name?: string } | null };

const mockChamadas: { metodo: string; args: unknown[] }[] = [];
let mockResposta: Resposta = { data: [], error: null };
let mockExcecao: Error | null = null;

// Construtor encadeável: registra cada chamada e, ao ser aguardado, devolve a resposta combinada.
function mockConstrutor() {
  const c: Record<string, unknown> = {};
  for (const metodo of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single']) {
    c[metodo] = (...args: unknown[]) => {
      mockChamadas.push({ metodo, args });
      return c;
    };
  }
  c.then = (resolve: (r: Resposta) => unknown, rejeitar: (e: unknown) => unknown) =>
    (mockExcecao ? Promise.reject(mockExcecao) : Promise.resolve(mockResposta)).then(resolve, rejeitar);
  return c;
}

jest.mock('@/services/supabase', () => ({
  supabase: { from: () => mockConstrutor() },
}));

const linha = (extra: Record<string, unknown> = {}) => ({
  id: 'd1',
  titulo: 'Ver o nascer do sol',
  local: null,
  observacoes: null,
  criado_em: '2026-10-15T12:00:00Z',
  ...extra,
});

const enviado = (metodo: string) => mockChamadas.find((c) => c.metodo === metodo)?.args[0];

beforeEach(() => {
  mockChamadas.length = 0;
  mockResposta = { data: [], error: null };
  mockExcecao = null;
});

describe('listarDesejos', () => {
  it('pede só desejos, do mais novo para o mais antigo, e converte as colunas', async () => {
    mockResposta = { data: [linha({ local: 'Praia' })], error: null };
    const r = await listarDesejos();

    expect(r).toEqual({
      ok: true,
      desejos: [
        { id: 'd1', titulo: 'Ver o nascer do sol', local: 'Praia', observacoes: null, criadoEm: '2026-10-15T12:00:00Z' },
      ],
    });
    expect(mockChamadas.find((c) => c.metodo === 'eq')?.args).toEqual(['estado', 'desejo']);
    expect(mockChamadas.find((c) => c.metodo === 'order')?.args).toEqual(['criado_em', { ascending: false }]);
  });

  it('falha de rede vira a mensagem de conexão', async () => {
    mockResposta = { data: null, error: { name: 'TypeError', message: 'Network request failed' } };
    const r = await listarDesejos();
    expect(r).toMatchObject({ ok: false, codigo: 'rede' });
  });

  it('exceção do cliente também vira falha de rede', async () => {
    mockExcecao = new Error('boom');
    const r = await listarDesejos();
    expect(r).toMatchObject({ ok: false, codigo: 'rede' });
  });

  it('erro do servidor vira uma falha genérica, sem detalhes', async () => {
    mockResposta = { data: null, error: { code: 'PGRST205', message: 'tabela interna x' } };
    const r = await listarDesejos();
    expect(r).toMatchObject({ ok: false, codigo: 'desconhecido' });
    expect(JSON.stringify(r)).not.toContain('tabela interna x');
  });
});

describe('criarDesejo', () => {
  it('apara o título e converte texto vazio em nulo', async () => {
    mockResposta = { data: linha(), error: null };
    const r = await criarDesejo({ titulo: '  Ver o nascer do sol  ', local: '   ', observacoes: '' });

    expect(r.ok).toBe(true);
    expect(enviado('insert')).toEqual({ titulo: 'Ver o nascer do sol', local: null, observacoes: null });
  });

  it('envia local e observações preenchidos, sem o Laço nem o estado', async () => {
    mockResposta = { data: linha({ local: 'Praia', observacoes: 'Levar café' }), error: null };
    await criarDesejo({ titulo: 'Ver o nascer do sol', local: ' Praia ', observacoes: ' Levar café ' });

    const corpo = enviado('insert') as Record<string, unknown>;
    expect(corpo).toEqual({ titulo: 'Ver o nascer do sol', local: 'Praia', observacoes: 'Levar café' });
    expect(corpo).not.toHaveProperty('laco_id');
    expect(corpo).not.toHaveProperty('estado');
  });

  it('violação de limite do banco vira "dados inválidos"', async () => {
    mockResposta = { data: null, error: { code: '23514', message: 'check' } };
    const r = await criarDesejo({ titulo: 'x' });
    expect(r).toMatchObject({ ok: false, codigo: 'desejo_invalido' });
  });
});

describe('atualizarDesejo', () => {
  it('só atualiza desejos e devolve o registro novo', async () => {
    mockResposta = { data: [linha({ titulo: 'Novo título' })], error: null };
    const r = await atualizarDesejo('d1', { titulo: ' Novo título ', local: '', observacoes: 'Nota' });

    expect(r).toMatchObject({ ok: true, desejo: { id: 'd1', titulo: 'Novo título' } });
    expect(enviado('update')).toEqual({ titulo: 'Novo título', local: null, observacoes: 'Nota' });
    expect(mockChamadas.filter((c) => c.metodo === 'eq').map((c) => c.args)).toEqual([
      ['id', 'd1'],
      ['estado', 'desejo'],
    ]);
  });

  it('nenhuma linha atualizada: a outra pessoa excluiu', async () => {
    mockResposta = { data: [], error: null };
    const r = await atualizarDesejo('d1', { titulo: 'x' });
    expect(r).toMatchObject({ ok: false, codigo: 'desejo_inexistente' });
  });
});

describe('excluirDesejo', () => {
  it('exclui por id e só no estado desejo', async () => {
    const r = await excluirDesejo('d1');
    expect(r).toEqual({ ok: true });
    expect(mockChamadas.map((c) => c.metodo)).toContain('delete');
    expect(mockChamadas.filter((c) => c.metodo === 'eq').map((c) => c.args)).toEqual([
      ['id', 'd1'],
      ['estado', 'desejo'],
    ]);
  });

  it('excluir algo que já não existe conta como feito', async () => {
    mockResposta = { data: [], error: null };
    expect(await excluirDesejo('inexistente')).toEqual({ ok: true });
  });

  it('falha de rede é informada', async () => {
    mockResposta = { data: null, error: { message: 'Failed to fetch' } };
    expect(await excluirDesejo('d1')).toMatchObject({ ok: false, codigo: 'rede' });
  });
});
