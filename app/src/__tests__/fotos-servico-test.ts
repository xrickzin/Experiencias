// Serviço de fotos contra um Supabase simulado: ordem das operações (arquivo e registro), limpeza em
// caso de falha e conversões. O comportamento real do Storage está em supabase/tests/fotos.mjs.
import {
  base64ParaBytes,
  enviarFoto,
  excluirFoto,
  listarFotos,
  nomeDeArquivo,
  removerFotosDaExperiencia,
} from '@/services/fotos';

type Resposta = { data: unknown; error: { message?: string; statusCode?: string } | null };

const mockOrdem: string[] = [];
const mockRespostas: Record<string, Resposta> = {};
const responder = (chave: string, r: Resposta) => (mockRespostas[chave] = r);
const resposta = (chave: string) => mockRespostas[chave] ?? { data: null, error: null };

function mockTabela() {
  let operacao = 'select';
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'insert', 'delete', 'eq', 'order', 'single']) {
    c[m] = (...args: unknown[]) => {
      if (m === 'insert' || m === 'delete') operacao = m;
      if (m === 'insert') mockOrdem.push(`registro.insert:${JSON.stringify(args[0])}`);
      return c;
    };
  }
  c.then = (ok: (r: Resposta) => unknown) => {
    mockOrdem.push(`registro.${operacao}`);
    return Promise.resolve(resposta(`registro.${operacao}`)).then(ok);
  };
  return c;
}

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: () => mockTabela(),
    storage: {
      from: () => ({
        upload: async (caminho: string, _bytes: unknown, opcoes: { contentType: string; upsert: boolean }) => {
          mockOrdem.push(`arquivo.upload:${caminho}:${opcoes.contentType}:${opcoes.upsert}`);
          return resposta('arquivo.upload');
        },
        remove: async (caminhos: string[]) => {
          mockOrdem.push(`arquivo.remove:${caminhos.join(',')}`);
          return resposta('arquivo.remove');
        },
        createSignedUrl: async () => ({ data: { signedUrl: 'https://assinada/1' }, error: null }),
        createSignedUrls: async (caminhos: string[]) => ({
          data: caminhos.map((path) => ({ path, signedUrl: `https://assinada/${path}` })),
          error: null,
        }),
      }),
    },
  },
}));

const LACO = '11111111-1111-1111-1111-111111111111';
const EXP = '22222222-2222-2222-2222-222222222222';

beforeEach(() => {
  mockOrdem.length = 0;
  for (const k of Object.keys(mockRespostas)) delete mockRespostas[k];
});

describe('regras puras', () => {
  it('nome do arquivo: só caracteres seguros e extensão pelo tipo', () => {
    expect(nomeDeArquivo('image/png', 1_700_000_000_000, () => 0.5)).toMatch(/^[a-z0-9]+-[a-z0-9]+\.png$/);
    expect(nomeDeArquivo('image/jpeg')).toMatch(/\.jpg$/);
    expect(nomeDeArquivo('tipo/estranho')).toMatch(/\.jpg$/);
    expect(nomeDeArquivo('image/jpeg')).not.toBe(nomeDeArquivo('image/jpeg'));
  });

  it('base64 vira os mesmos bytes', () => {
    const bytes = base64ParaBytes(btoa(String.fromCharCode(0xff, 0xd8, 0x00, 0x7f, 0xff)));
    expect(Array.from(bytes)).toEqual([0xff, 0xd8, 0x00, 0x7f, 0xff]);
  });
});

describe('enviarFoto', () => {
  it('envia o arquivo na pasta do Laço e da experiência, sem sobrescrever, e depois cria o registro', async () => {
    responder('registro.insert', {
      data: { id: 'r1', caminho: `${LACO}/${EXP}/x.jpg`, autor_id: 'm1', criado_em: '2026-10-15T12:00:00Z' },
      error: null,
    });
    const r = await enviarFoto(LACO, EXP, { base64: btoa('foto'), mimeType: 'image/jpeg' });

    expect(r).toMatchObject({ ok: true, foto: { id: 'r1', url: 'https://assinada/1' } });
    expect(mockOrdem[0]).toMatch(new RegExp(`^arquivo\\.upload:${LACO}/${EXP}/[a-z0-9-]+\\.jpg:image/jpeg:false$`));
    expect(mockOrdem[1]).toMatch(/^registro\.insert:/);
    const corpo = JSON.parse(mockOrdem[1].replace('registro.insert:', ''));
    expect(Object.keys(corpo).sort()).toEqual(['caminho', 'experiencia_id']);
  });

  it('tipo desconhecido é enviado como JPEG', async () => {
    responder('registro.insert', { data: { id: 'r1', caminho: 'c', autor_id: null, criado_em: 'x' }, error: null });
    await enviarFoto(LACO, EXP, { base64: 'AA==', mimeType: 'video/mp4' });
    expect(mockOrdem[0]).toMatch(/\.jpg:image\/jpeg:false$/);
  });

  it('se o registro falhar, apaga o arquivo enviado e não diz que guardou', async () => {
    responder('registro.insert', { data: null, error: { message: 'permission denied' } });
    const r = await enviarFoto(LACO, EXP, { base64: 'AA==', mimeType: 'image/jpeg' });

    expect(r).toMatchObject({ ok: false, codigo: 'foto_nao_enviada' });
    const enviado = mockOrdem[0].split(':')[1];
    const remocao = mockOrdem.findIndex((o) => o.startsWith('arquivo.remove:'));
    expect(remocao).toBeGreaterThan(mockOrdem.indexOf('registro.insert'));
    expect(mockOrdem[remocao]).toBe(`arquivo.remove:${enviado}`);
  });

  it('arquivo grande demais tem mensagem própria e nenhum registro', async () => {
    responder('arquivo.upload', { data: null, error: { statusCode: '413', message: 'Payload too large' } });
    const r = await enviarFoto(LACO, EXP, { base64: 'AA==', mimeType: 'image/jpeg' });
    expect(r).toMatchObject({ ok: false, codigo: 'foto_grande' });
    expect(mockOrdem.some((o) => o.startsWith('registro.'))).toBe(false);
  });
});

describe('excluirFoto', () => {
  it('apaga o arquivo e só depois o registro', async () => {
    const r = await excluirFoto({ id: 'r1', caminho: `${LACO}/${EXP}/x.jpg` });
    expect(r).toEqual({ ok: true });
    expect(mockOrdem).toEqual([`arquivo.remove:${LACO}/${EXP}/x.jpg`, 'registro.delete']);
  });

  it('se o arquivo não sair, o registro fica e a falha é informada', async () => {
    responder('arquivo.remove', { data: null, error: { message: 'erro' } });
    const r = await excluirFoto({ id: 'r1', caminho: 'c' });
    expect(r).toMatchObject({ ok: false, codigo: 'foto_nao_removida' });
    expect(mockOrdem).not.toContain('registro.delete');
  });
});

describe('removerFotosDaExperiencia', () => {
  it('sem fotos, não toca no Storage', async () => {
    responder('registro.select', { data: [], error: null });
    expect(await removerFotosDaExperiencia(EXP)).toEqual({ ok: true });
    expect(mockOrdem.some((o) => o.startsWith('arquivo.'))).toBe(false);
  });

  it('apaga todos os arquivos da experiência de uma vez', async () => {
    responder('registro.select', { data: [{ caminho: 'a.jpg' }, { caminho: 'b.jpg' }], error: null });
    expect(await removerFotosDaExperiencia(EXP)).toEqual({ ok: true });
    expect(mockOrdem).toContain('arquivo.remove:a.jpg,b.jpg');
  });

  it('falha no Storage impede seguir com a exclusão', async () => {
    responder('registro.select', { data: [{ caminho: 'a.jpg' }], error: null });
    responder('arquivo.remove', { data: null, error: { message: 'erro' } });
    expect(await removerFotosDaExperiencia(EXP)).toMatchObject({ ok: false, codigo: 'fotos_nao_removidas' });
  });
});

describe('listarFotos', () => {
  it('traz os registros com URL assinada', async () => {
    responder('registro.select', {
      data: [{ id: 'r1', caminho: 'a.jpg', autor_id: 'm1', criado_em: '2026-10-15T12:00:00Z' }],
      error: null,
    });
    expect(await listarFotos(EXP)).toEqual({
      ok: true,
      fotos: [{ id: 'r1', caminho: 'a.jpg', url: 'https://assinada/a.jpg', autorId: 'm1', criadoEm: '2026-10-15T12:00:00Z' }],
    });
  });
});
