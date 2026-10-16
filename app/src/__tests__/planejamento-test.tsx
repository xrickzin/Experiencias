import { act, fireEvent, screen } from 'expo-router/testing-library';

import * as servico from '@/services/experiencias';
import * as fotos from '@/services/fotos';
import * as impressoes from '@/services/impressoes';
import * as observacoes from '@/services/observacoes';
import type { Experiencia } from '@/services/experiencias';

import { abrir, esperar } from './apoio/abrir';
import { experiencia } from './apoio/experiencia';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
jest.mock('@/services/laco');
jest.mock('@/services/experiencias');
jest.mock('@/services/fotos');
jest.mock('@/services/observacoes');
jest.mock('@/services/impressoes');
jest.mock('expo-image-picker');
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

const mock = jest.mocked(servico);
const lista = (...itens: Experiencia[]) => mock.listarExperiencias.mockResolvedValue({ ok: true, experiencias: itens });
const futuro = (dias: number) => new Date(Date.now() + dias * 86_400_000);
const diaFuturo = (dias: number): Pick<Experiencia, 'referencia' | 'inicioEm'> => {
  const d = futuro(dias);
  return {
    referencia: { precisao: 'data', inicio: d.toISOString().slice(0, 10), fim: null, horario: null },
    inicioEm: d.toISOString(),
  };
};

async function tocar(rotulo: string) {
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: rotulo }));
  });
  await esperar();
}

async function escolher(precisao: string) {
  await act(async () => {
    await fireEvent.press(screen.getByRole('radio', { name: precisao }));
  });
}

async function preencher(rotulo: string, valor: string) {
  await act(async () => {
    await fireEvent.changeText(screen.getByLabelText(rotulo), valor);
  });
}

beforeEach(() => {
  reiniciarSessao();
  jest.resetAllMocks();
  jest.mocked(observacoes.listarObservacoes).mockResolvedValue({ ok: true, observacoes: [] });
  jest.mocked(impressoes.listarImpressoes).mockResolvedValue({ ok: true, impressoes: [] });
  jest.mocked(fotos.listarFotos).mockResolvedValue({ ok: true, fotos: [] });
  jest.mocked(fotos.removerFotosDaExperiencia).mockResolvedValue({ ok: true });
  definirSessao({
    estado: 'com-laco',
    usuarioId: 'u1',
    perfil: { membro_id: 'm1', nome: 'Ana', laco_id: 'l1', companheiro_vinculado: true, companheiro_nome: 'Bia' },
  });
});

describe('transições na experiência', () => {
  it('Desejo → Planejamento: chama o servidor e a tela passa a ser de planejamento', async () => {
    lista(experiencia('1', 'Viagem'));
    mock.mudarEstado.mockResolvedValue({ ok: true, estado: 'planejamento' });
    await abrir('/experiencia/1');
    await screen.findByText('Ainda é só uma ideia por enquanto.');

    await tocar('Começar planejamento');

    expect(mock.mudarEstado).toHaveBeenCalledWith('1', 'planejamento');
    expect(await screen.findByText('Vamos começar a dar forma a isso.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Começar a viver' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Voltar para desejo' })).toBeTruthy();
  });

  it('Planejamento → Vivendo e de volta', async () => {
    lista(experiencia('1', 'Viagem', { estado: 'planejamento' }));
    mock.mudarEstado.mockImplementation(async (_id, estado) => ({ ok: true, estado }));
    await abrir('/experiencia/1');
    await screen.findByText('Vamos começar a dar forma a isso.');

    await tocar('Começar a viver');
    expect(await screen.findByText('Está acontecendo.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Começar a viver' })).toBeNull();
    // Vivendo abre nas fotos; voltar para o planejamento fica na aba de detalhes.
    expect(screen.getByRole('tab', { name: 'Momentos' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('button', { name: 'Tirar foto' })).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByRole('tab', { name: 'Detalhes' }));
    });

    await tocar('Voltar para planejamento');
    expect(await screen.findByText('Vamos começar a dar forma a isso.')).toBeTruthy();
    expect(mock.mudarEstado.mock.calls).toEqual([
      ['1', 'vivendo'],
      ['1', 'planejamento'],
    ]);
  });

  it('Vivendo não oferece voltar direto para desejo', async () => {
    lista(experiencia('1', 'Viagem', { estado: 'vivendo' }));
    await abrir('/experiencia/1');
    await screen.findByText('Está acontecendo.');
    await act(async () => {
      await fireEvent.press(screen.getByRole('tab', { name: 'Detalhes' }));
    });

    expect(screen.queryByRole('button', { name: 'Voltar para desejo' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Finalizar experiência' })).toBeTruthy();
  });

  it('falha na transição: avisa e mantém o estado', async () => {
    lista(experiencia('1', 'Viagem'));
    mock.mudarEstado.mockResolvedValue({ ok: false, codigo: 'rede', mensagem: 'Sem conexão.' });
    await abrir('/experiencia/1');
    await screen.findByText('Ainda é só uma ideia por enquanto.');

    await tocar('Começar planejamento');

    expect(screen.getByText('Sem conexão.')).toBeTruthy();
    expect(screen.getByText('Ainda é só uma ideia por enquanto.')).toBeTruthy();
  });
});

describe('referência temporal na tela', () => {
  it('escolher "Dia", digitar a data com máscara e salvar', async () => {
    lista(experiencia('1', 'Viagem', { estado: 'planejamento' }));
    mock.atualizarExperiencia.mockImplementation(async (id, campos) => ({
      ok: true,
      experiencia: experiencia(id, campos.titulo, { estado: 'planejamento', referencia: campos.referencia }),
    }));
    await abrir('/experiencia/1');
    await screen.findByText('Vamos começar a dar forma a isso.');

    await escolher('Dia');
    await preencher('Data', '12122026');
    expect(screen.getByLabelText('Data').props.value).toBe('12/12/2026');
    await tocar('Salvar');

    expect(mock.atualizarExperiencia).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        referencia: { precisao: 'data', inicio: '2026-12-12', fim: null, horario: null },
      })
    );
    expect(await screen.findByText('Salvo.')).toBeTruthy();
  });

  it('data inválida não chama o servidor e explica o formato', async () => {
    lista(experiencia('1', 'Viagem', { estado: 'planejamento' }));
    await abrir('/experiencia/1');
    await screen.findByText('Vamos começar a dar forma a isso.');

    await escolher('Período');
    await preencher('Começo', '15102026');
    await preencher('Fim', '12102026');
    await tocar('Salvar');

    expect(screen.getByText('O fim do período não pode ser antes do começo.')).toBeTruthy();
    expect(mock.atualizarExperiencia).not.toHaveBeenCalled();
  });

  it('a precisão escolhida aparece marcada, não só pela cor', async () => {
    lista(experiencia('1', 'Viagem', { referencia: { precisao: 'mes_ano', inicio: '2026-11-01', fim: null, horario: null } }));
    await abrir('/experiencia/1');
    await screen.findByText('Ainda é só uma ideia por enquanto.');

    expect(screen.getByRole('radio', { name: 'Mês' }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByLabelText('Mês e ano').props.value).toBe('11/2026');
  });

  it('criar um desejo já com o mês pretendido', async () => {
    lista();
    mock.criarDesejo.mockImplementation(async (campos) => ({ ok: true, desejo: experiencia('9', campos.titulo) }));
    await abrir('/criar');

    await preencher('Título, obrigatório', 'Campos do Jordão');
    await escolher('Mês');
    await preencher('Mês e ano', '072027');
    await tocar('Adicionar desejo');

    expect(mock.criarDesejo).toHaveBeenCalledWith(
      expect.objectContaining({ referencia: { precisao: 'mes_ano', inicio: '2027-07-01', fim: null, horario: null } })
    );
  });
});

describe('cartão de Vivendo no Início', () => {
  it('com foto de destaque, mostra a foto', async () => {
    jest.mocked(fotos.assinarCaminhos).mockResolvedValue(new Map([['l1/v1/a.jpg', 'https://assinada/a']]));
    lista(experiencia('v1', 'Fim de semana', { estado: 'vivendo', fotoDestaque: { id: 'a', caminho: 'l1/v1/a.jpg' } }));
    await abrir('/');

    expect(await screen.findByTestId('cartao-vivendo-foto')).toBeTruthy();
    expect(screen.getByLabelText('Foto de destaque de Fim de semana')).toBeTruthy();
    expect(fotos.assinarCaminhos).toHaveBeenCalledWith(['l1/v1/a.jpg']);
  });

  it('sem foto de destaque, mostra o substituto convidando a escolher', async () => {
    lista(experiencia('v1', 'Fim de semana', { estado: 'vivendo' }));
    await abrir('/');

    expect(await screen.findByTestId('cartao-vivendo-substituto')).toBeTruthy();
    expect(screen.getByText('Escolham uma foto de destaque para este momento.')).toBeTruthy();
    expect(fotos.assinarCaminhos).not.toHaveBeenCalled();
  });

  it('se a URL não puder ser gerada, fica o substituto (nunca vazio)', async () => {
    jest.mocked(fotos.assinarCaminhos).mockResolvedValue(new Map());
    lista(experiencia('v1', 'Fim de semana', { estado: 'vivendo', fotoDestaque: { id: 'a', caminho: 'l1/v1/a.jpg' } }));
    await abrir('/');

    expect(await screen.findByTestId('cartao-vivendo-substituto')).toBeTruthy();
  });

  it('tocar no cartão abre a experiência', async () => {
    lista(experiencia('v1', 'Fim de semana', { estado: 'vivendo' }));
    const { tela } = await abrir('/');

    await tocar('Fim de semana. Continuar experiência');

    expect(tela.getPathname()).toBe('/experiencia/v1');
  });
});

describe('Início', () => {
  it('sem nada em andamento, convida a criar', async () => {
    lista(experiencia('d1', 'Desejo'));
    await abrir('/');
    expect(await screen.findByText('O que vocês querem viver?')).toBeTruthy();
    expect(screen.getByText('1 desejo para viver juntos.')).toBeTruthy();
  });

  it('mostra Vivendo em destaque, as próximas e o que está em preparação', async () => {
    lista(
      experiencia('v1', 'Fim de semana na serra', { estado: 'vivendo', local: 'Campos do Jordão' }),
      experiencia('p1', 'Jantar', { estado: 'planejamento', ...diaFuturo(3) }),
      experiencia('p2', 'Teatro', { estado: 'planejamento' }),
      experiencia('d1', 'Piquenique')
    );
    await abrir('/');

    expect(await screen.findByText('VIVENDO AGORA')).toBeTruthy();
    expect(screen.getByText('Fim de semana na serra')).toBeTruthy();
    expect(screen.getByText('Continuar experiência →')).toBeTruthy();
    expect(screen.getByText('NOSSO PRÓXIMO MOMENTO')).toBeTruthy();
    expect(screen.getByText('Jantar')).toBeTruthy();
    expect(screen.getByText('ESTAMOS PREPARANDO')).toBeTruthy();
    expect(screen.getByText('Teatro')).toBeTruthy();
    // Desejos não são listados em Início, só contados.
    expect(screen.queryByText('Piquenique')).toBeNull();
    expect(screen.queryByText('O que vocês querem viver?')).toBeNull();
  });

  it('mais próximas que o limite: "Ver todos" abre a lista completa', async () => {
    lista(
      ...[1, 2, 3, 4].map((n) => experiencia(`p${n}`, `Próxima ${n}`, { estado: 'planejamento', ...diaFuturo(n) }))
    );
    const { tela } = await abrir('/');
    await screen.findByText('Próxima 1');
    expect(screen.queryByText('Próxima 4')).toBeNull();

    await tocar('Ver todos');

    expect(tela.getPathname()).toBe('/lista/proximas');
    expect(await screen.findByText('Próxima 4')).toBeTruthy();
  });

  it('tocar numa experiência de Início abre a experiência', async () => {
    lista(experiencia('p1', 'Teatro', { estado: 'planejamento' }));
    const { tela } = await abrir('/');
    await screen.findByText('Teatro');

    await tocar('Teatro');

    expect(tela.getPathname()).toBe('/experiencia/p1');
  });
});
