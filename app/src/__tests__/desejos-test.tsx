import { act, fireEvent, screen } from 'expo-router/testing-library';

import * as categoriasDoLaco from '@/services/categorias';
import * as experiencias from '@/services/experiencias';
import * as fotos from '@/services/fotos';
import { SEM_DATA } from '@/services/referencia-temporal';

import { abrir, esperar } from './apoio/abrir';
import { experiencia } from './apoio/experiencia';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
jest.mock('@/services/laco');
jest.mock('@/services/experiencias');
// Links e reservas abrem vazios; têm testes próprios (links-test.tsx, reservas-test.tsx).
jest.mock('@/services/links', () => ({ ...jest.requireActual('@/services/links'), listarLinks: async () => ({ ok: true, links: [] }) }));
jest.mock('@/services/reservas', () => ({ ...jest.requireActual('@/services/reservas'), listarReservas: async () => ({ ok: true, reservas: [] }) }));
jest.mock('@/services/roteiro', () => ({ ...jest.requireActual('@/services/roteiro'), listarRoteiro: async () => ({ ok: true, itens: [] }) }));
jest.mock('@/services/fotos');
jest.mock('@/services/categorias');
jest.mock('expo-image-picker');
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

const servico = jest.mocked(experiencias);
const cat = jest.mocked(categoriasDoLaco);
const FILME = { id: 'c-filme', nome: 'Filme' };
const VIAGEM = { id: 'c-viagem', nome: 'Viagem' };
const OK = { ok: true as const };
const falha = (codigo: string, mensagem: string) => ({ ok: false as const, codigo, mensagem });
const SEM_REDE = 'Não foi possível conectar. Verifique sua internet e tente de novo.';

const desejo = experiencia;

async function tocar(rotulo: string) {
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: rotulo }));
  });
  await esperar();
}

async function preencher(rotulo: string, valor: string) {
  await act(async () => {
    await fireEvent.changeText(screen.getByLabelText(rotulo), valor);
  });
}

beforeEach(() => {
  reiniciarSessao();
  jest.resetAllMocks();
  jest.mocked(fotos.listarFotos).mockResolvedValue({ ok: true, fotos: [] });
  jest.mocked(fotos.removerFotosDaExperiencia).mockResolvedValue({ ok: true });
  jest.mocked(categoriasDoLaco.listarCategorias).mockResolvedValue({ ok: true, categorias: [] });
  definirSessao({
    estado: 'com-laco',
    usuarioId: 'u1',
    perfil: { membro_id: 'm1', nome: 'Ana', laco_id: 'l1', companheiro_vinculado: true, companheiro_nome: 'Bia' },
  });
});

describe('lista de desejos', () => {
  it('mostra os desejos do servidor, com o local quando houver', async () => {
    servico.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [desejo('1', 'Ver o nascer do sol', { local: 'Praia' }), desejo('2', 'Fazer um piquenique')],
    });
    await abrir('/desejos');

    expect(await screen.findByText('Ver o nascer do sol')).toBeTruthy();
    expect(screen.getByText('Praia')).toBeTruthy();
    expect(screen.getByText('Fazer um piquenique')).toBeTruthy();
  });

  it('sem desejos, mostra o estado vazio', async () => {
    servico.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [] });
    await abrir('/desejos');
    expect(await screen.findByText('Nenhum desejo ainda')).toBeTruthy();
  });

  it('falha ao carregar: avisa e permite tentar de novo', async () => {
    servico.listarExperiencias
      .mockResolvedValueOnce(falha('rede', SEM_REDE))
      .mockResolvedValue({ ok: true, experiencias: [desejo('1', 'Ver o nascer do sol')] });
    await abrir('/desejos');

    expect(await screen.findByText('Não foi possível carregar')).toBeTruthy();
    expect(screen.getByText(SEM_REDE)).toBeTruthy();

    await tocar('Tentar de novo');
    expect(await screen.findByText('Ver o nascer do sol')).toBeTruthy();
  });
});

describe('criar desejo', () => {
  it('salva no servidor e volta para a lista com o novo desejo', async () => {
    const criado = desejo('9', 'Ver o nascer do sol');
    servico.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [] });
    servico.criarDesejo.mockImplementation(async () => {
      // Como o servidor: depois de criar, a lista passa a trazer o novo desejo.
      servico.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [criado] });
      return { ok: true, desejo: criado };
    });
    const { tela } = await abrir('/criar');

    await preencher('Título, obrigatório', '  Ver o nascer do sol  ');
    await preencher('Local', 'Praia');
    await preencher('Observações', 'Levar café');
    await tocar('Adicionar desejo');

    expect(servico.criarDesejo).toHaveBeenCalledWith({
      titulo: '  Ver o nascer do sol  ',
      local: 'Praia',
      observacoes: 'Levar café',
      referencia: SEM_DATA,
      tamanho: null,
      categorias: [],
      roteiroAtivo: false,
      orcamentoAtivo: false,
    });
    expect(tela.getPathname()).toBe('/desejos');
    expect(await screen.findByText('Ver o nascer do sol')).toBeTruthy();
  });

  it('título vazio não chama o servidor', async () => {
    servico.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [] });
    const { tela } = await abrir('/criar');

    await preencher('Título, obrigatório', '   ');
    await tocar('Adicionar desejo');

    expect(screen.getByText('Escreva um título para continuar.')).toBeTruthy();
    expect(servico.criarDesejo).not.toHaveBeenCalled();
    expect(tela.getPathname()).toBe('/criar');
  });

  it('falha ao salvar: não diz que salvou e deixa tentar de novo', async () => {
    servico.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [] });
    servico.criarDesejo.mockResolvedValue(falha('rede', SEM_REDE));
    const { tela } = await abrir('/criar');

    await preencher('Título, obrigatório', 'Ver o nascer do sol');
    await tocar('Adicionar desejo');

    expect(screen.getByText(SEM_REDE)).toBeTruthy();
    expect(tela.getPathname()).toBe('/criar');
    expect(screen.getByRole('button', { name: 'Adicionar desejo' })).toBeTruthy();
  });
});

describe('editar e excluir', () => {
  beforeEach(() => {
    servico.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [desejo('1', 'Ver o nascer do sol', { local: 'Praia', observacoes: 'Levar café' })],
    });
  });

  async function abrirODesejo() {
    const aberto = await abrir('/desejos');
    await screen.findByText('Ver o nascer do sol');
    await tocar('Ver o nascer do sol, Praia');
    return aberto;
  }

  it('abre o desejo preenchido e salva as mudanças', async () => {
    servico.atualizarExperiencia.mockResolvedValue({
      ok: true,
      experiencia: desejo('1', 'Ver o nascer do sol juntos', { local: 'Praia', observacoes: 'Levar café' }),
    });
    await abrirODesejo();

    expect(screen.getByLabelText('Título, obrigatório').props.value).toBe('Ver o nascer do sol');
    expect(screen.getByLabelText('Local').props.value).toBe('Praia');
    expect(screen.getByLabelText('Observações').props.value).toBe('Levar café');

    await preencher('Título, obrigatório', 'Ver o nascer do sol juntos');
    await tocar('Salvar');

    expect(servico.atualizarExperiencia).toHaveBeenCalledWith('1', {
      titulo: 'Ver o nascer do sol juntos',
      local: 'Praia',
      observacoes: 'Levar café',
      referencia: SEM_DATA,
      tamanho: null,
      categorias: [],
    });
    expect(await screen.findByText('Salvo.')).toBeTruthy();
  });

  it('título vazio na edição não chama o servidor', async () => {
    await abrirODesejo();

    await preencher('Título, obrigatório', '');
    await tocar('Salvar');

    expect(screen.getByText('Escreva um título para continuar.')).toBeTruthy();
    expect(servico.atualizarExperiencia).not.toHaveBeenCalled();
  });

  it('excluir pede confirmação e depois volta para a lista', async () => {
    servico.excluirExperiencia.mockImplementation(async () => {
      servico.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [] });
      return OK;
    });
    const { tela } = await abrirODesejo();

    await tocar('Excluir desejo');
    expect(screen.getByText('Excluir este desejo?')).toBeTruthy();
    expect(screen.getByText(/definitiva e vale para os dois/)).toBeTruthy();
    expect(servico.excluirExperiencia).not.toHaveBeenCalled();

    await tocar('Sim, excluir desejo');

    expect(servico.excluirExperiencia).toHaveBeenCalledWith('1');
    expect(tela.getPathname()).toBe('/desejos');
    expect(await screen.findByText('Nenhum desejo ainda')).toBeTruthy();
  });

  it('cancelar a confirmação mantém o desejo', async () => {
    await abrirODesejo();

    await tocar('Excluir desejo');
    await tocar('Cancelar');

    expect(screen.queryByText('Excluir este desejo?')).toBeNull();
    expect(servico.excluirExperiencia).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Excluir desejo' })).toBeTruthy();
  });

  it('falha ao excluir: avisa e mantém o desejo', async () => {
    servico.excluirExperiencia.mockResolvedValue(falha('rede', SEM_REDE));
    const { tela } = await abrirODesejo();

    await tocar('Excluir desejo');
    await tocar('Sim, excluir desejo');

    expect(screen.getByText(SEM_REDE)).toBeTruthy();
    expect(screen.getByText('Excluir este desejo?')).toBeTruthy();
    expect(tela.getPathname()).toBe('/experiencia/1');
  });

  it('a outra pessoa já excluiu: volta para a lista', async () => {
    servico.atualizarExperiencia.mockResolvedValue(falha('desejo_inexistente', 'Esse desejo não existe mais.'));
    const { tela } = await abrirODesejo();

    await preencher('Título, obrigatório', 'Outro título');
    await tocar('Salvar');

    expect(tela.getPathname()).toBe('/desejos');
  });
});

describe('categorias e tamanho', () => {
  beforeEach(() => {
    cat.listarCategorias.mockResolvedValue({ ok: true, categorias: [FILME, VIAGEM] });
  });

  async function tocarEm(papel: 'radio' | 'checkbox', nome: string) {
    await act(async () => {
      await fireEvent.press(screen.getByRole(papel, { name: nome }));
    });
  }

  it('filtra os desejos por categoria e por tamanho, com só o que está em uso', async () => {
    servico.listarExperiencias.mockResolvedValue({
      ok: true,
      experiencias: [
        experiencia('1', 'Sessão de cinema', { categorias: [FILME.id], tamanho: 'noite' }),
        experiencia('2', 'Lisboa', { categorias: [VIAGEM.id], tamanho: 'viagem' }),
        experiencia('3', 'Sem nada'),
      ],
    });
    await abrir('/desejos');
    await screen.findByText('Sessão de cinema');
    expect(screen.queryByRole('radio', { name: 'Um dia' })).toBeNull(); // nenhum desejo de um dia

    await tocarEm('radio', 'Filme');
    expect(screen.getByText('Sessão de cinema')).toBeTruthy();
    expect(screen.queryByText('Lisboa')).toBeNull();
    expect(screen.queryByText('Sem nada')).toBeNull();

    await tocarEm('radio', 'Viagem');
    expect(screen.getByText('Lisboa')).toBeTruthy();
    await tocarEm('radio', 'Uma noite');
    expect(screen.getByText('Nenhum desejo com esse filtro.')).toBeTruthy();
  });

  it('criar um desejo com tamanho, categoria marcada e categoria nova', async () => {
    servico.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [] });
    servico.criarDesejo.mockImplementation(async (campos) => ({
      ok: true,
      desejo: experiencia('9', campos.titulo, { categorias: campos.categorias ?? [] }),
    }));
    cat.criarCategoria.mockResolvedValue({ ok: true, categoria: { id: 'c-nerd', nome: 'Coisas nerds' } });
    await abrir('/criar');
    await act(async () => {
      await fireEvent.changeText(await screen.findByLabelText('Título, obrigatório'), 'Maratona de Star Wars');
    });
    await tocarEm('radio', 'Uma noite');
    await tocarEm('checkbox', 'Filme');
    await tocarEm('checkbox', '+ Nova categoria');
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Nome da categoria'), 'Coisas nerds');
    });
    await act(async () => {
      await fireEvent.press(screen.getByRole('button', { name: 'Criar categoria' }));
    });
    expect(cat.criarCategoria).toHaveBeenCalledWith('Coisas nerds');
    expect(screen.getByRole('checkbox', { name: 'Coisas nerds' }).props.accessibilityState).toMatchObject({ checked: true });

    await act(async () => {
      await fireEvent.press(screen.getByRole('button', { name: 'Adicionar desejo' }));
    });
    expect(servico.criarDesejo).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'Maratona de Star Wars', tamanho: 'noite', categorias: [FILME.id, 'c-nerd'] })
    );
  });
});
