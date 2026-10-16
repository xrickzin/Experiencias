// Reservas da experiência (ADR 038, etapa 3): validação, ordem e exibição, e o fluxo na tela, incluindo
// quando a seção fica à vista pelo tamanho e quando vai para "Mais para planejar".
import { act, fireEvent, screen } from 'expo-router/testing-library';
import { Share } from 'react-native';

import * as categorias from '@/services/categorias';
import * as experiencias from '@/services/experiencias';
import type { Estado } from '@/services/experiencias';
import * as reservas from '@/services/reservas';
import { camposDe, descreverQuando, ordenarReservas, validarReserva, type Reserva } from '@/services/reservas';
import type { Tamanho } from '@/services/tamanho';

import { abrir, esperar } from './apoio/abrir';
import { experiencia } from './apoio/experiencia';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
jest.mock('@/services/experiencias');
jest.mock('@/services/categorias');
jest.mock('@/services/links', () => ({ ...jest.requireActual('@/services/links'), listarLinks: async () => ({ ok: true, links: [] }) }));
jest.mock('@/services/reservas', () => ({
  ...jest.requireActual('@/services/reservas'),
  listarReservas: jest.fn(),
  criarReserva: jest.fn(),
  editarReserva: jest.fn(),
  excluirReserva: jest.fn(),
}));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

const servico = jest.mocked(reservas);
const POUSADA: Reserva = {
  id: 'r1',
  tipo: 'hospedagem',
  nome: 'Pousada da serra',
  data: '2026-12-12',
  horario: '14:00',
  codigo: 'ABC123',
  url: null,
  criadoEm: '2026-10-16T12:00:00Z',
};
const vazios = camposDe(null);

describe('reserva digitada', () => {
  it('só tipo e nome bastam; o resto vira nulo', () => {
    expect(validarReserva({ ...vazios, tipo: 'mesa', nome: ' Jantar ' })).toEqual({
      tipo: 'mesa',
      nome: 'Jantar',
      data: null,
      horario: null,
      codigo: null,
      url: null,
    });
  });
  it('converte dia, horário e link', () => {
    expect(
      validarReserva({ ...vazios, nome: 'Show', data: '12/12/2026', horario: '21:30', codigo: ' XY9 ', endereco: 'ingresso.com/x' })
    ).toMatchObject({ data: '2026-12-12', horario: '21:30', codigo: 'XY9', url: 'https://ingresso.com/x' });
  });
  it('recusa o que não dá para guardar, com o motivo', () => {
    const codigo = (c: Partial<typeof vazios>) => (validarReserva({ ...vazios, nome: 'X', ...c }) as { codigo?: string }).codigo;
    expect(codigo({ nome: '  ' })).toBe('reserva_sem_nome');
    expect(codigo({ data: '31/02/2026' })).toBe('reserva_data_invalida');
    expect(codigo({ data: '12/12/2026', horario: '25:00' })).toBe('reserva_horario_invalido');
    expect(codigo({ horario: '20:00' })).toBe('reserva_horario_sem_dia');
    expect(codigo({ codigo: 'x'.repeat(61) })).toBe('reserva_codigo_longo');
    expect(codigo({ endereco: 'não é link' })).toBe('link_endereco_invalido');
  });
  it('ordena por dia e horário, as sem dia no fim; descreve o dia por extenso', () => {
    const semDia = { ...POUSADA, id: 's', data: null, horario: null };
    const antes = { ...POUSADA, id: 'a', data: '2026-12-11', horario: null };
    const tarde = { ...POUSADA, id: 't', horario: '18:00' };
    expect(ordenarReservas([semDia, tarde, POUSADA, antes]).map((r) => r.id)).toEqual(['a', 'r1', 't', 's']);
    expect(descreverQuando(POUSADA)).toBe('12 de dezembro de 2026, 14:00');
    expect(descreverQuando(semDia)).toBeNull();
  });
  it('a edição abre com o dia no formato digitado', () => {
    expect(camposDe(POUSADA)).toMatchObject({ data: '12/12/2026', horario: '14:00', codigo: 'ABC123', endereco: '' });
  });
});

describe('reservas na tela', () => {
  beforeEach(() => {
    reiniciarSessao();
    jest.resetAllMocks();
    jest.mocked(categorias.listarCategorias).mockResolvedValue({ ok: true, categorias: [] });
    definirSessao({
      estado: 'com-laco',
      usuarioId: 'u1',
      perfil: { membro_id: 'm1', nome: 'Ana', laco_id: 'l1', companheiro_vinculado: true, companheiro_nome: 'Bia' },
    });
  });

  async function abrirExperiencia(estado: Estado, tamanho: Tamanho | null, lista: Reserva[] = []) {
    servico.listarReservas.mockResolvedValue({ ok: true, reservas: lista });
    jest.mocked(experiencias.listarExperiencias).mockResolvedValue({
      ok: true,
      experiencias: [experiencia('1', 'Fim de semana na serra', { estado, tamanho })],
    });
    await abrir('/experiencia/1');
    // Em Vivendo, a aba principal é a dos momentos: as seções ficam em Detalhes.
    if (estado === 'vivendo') {
      await act(async () => {
        await fireEvent.press(await screen.findByText('Detalhes'));
      });
    }
    await screen.findByText('Links');
    await esperar();
  }

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

  it('numa noite, as reservas ficam em "Mais para planejar" e abrem com um toque', async () => {
    await abrirExperiencia('planejamento', 'noite');
    expect(screen.queryByRole('header', { name: 'Reservas' })).toBeNull();
    expect(screen.getByText('Mais para planejar')).toBeTruthy();

    await tocar('Reservas');
    expect(screen.getByRole('header', { name: 'Reservas' })).toBeTruthy();
    expect(screen.queryByText('Mais para planejar')).toBeNull();
  });

  it('num fim de semana, já ficam à vista; guardar uma reserva mostra o código e copia pela tela de compartilhar', async () => {
    const compartilhar = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    servico.criarReserva.mockResolvedValue({ ok: true, reserva: POUSADA });
    await abrirExperiencia('planejamento', 'fim_de_semana');
    expect(screen.queryByText('Mais para planejar')).toBeNull();

    await tocar('Adicionar reserva');
    await act(async () => {
      await fireEvent.press(screen.getByRole('radio', { name: 'Hospedagem' }));
    });
    await preencher('Nome, obrigatório', 'Pousada da serra');
    await preencher('Data', '12122026');
    await preencher('Horário', '1400');
    await preencher('Código de confirmação', 'ABC123');
    await tocar('Guardar reserva');

    expect(servico.criarReserva).toHaveBeenCalledWith('1', {
      tipo: 'hospedagem',
      nome: 'Pousada da serra',
      data: '12/12/2026',
      horario: '14:00',
      codigo: 'ABC123',
      endereco: '',
    });
    expect(screen.getByText('Pousada da serra')).toBeTruthy();
    expect(screen.getByText('12 de dezembro de 2026, 14:00')).toBeTruthy();
    await tocar('Copiar o código de Pousada da serra');
    expect(compartilhar).toHaveBeenCalledWith({ message: 'ABC123' });
  });

  it('erro ao guardar aparece e o editor continua aberto', async () => {
    servico.criarReserva.mockResolvedValue({ ok: false, codigo: 'reserva_horario_sem_dia', mensagem: 'Para pôr um horário, informe também o dia.' });
    await abrirExperiencia('vivendo', 'dia');
    await tocar('Adicionar reserva');
    await tocar('Guardar reserva');
    expect(screen.getByText('Para pôr um horário, informe também o dia.')).toBeTruthy();
    expect(screen.getByTestId('editor-de-reserva')).toBeTruthy();
  });

  it('editar e excluir com confirmação', async () => {
    servico.editarReserva.mockResolvedValue({ ok: true, reserva: { ...POUSADA, nome: 'Pousada' } });
    servico.excluirReserva.mockResolvedValue({ ok: true });
    await abrirExperiencia('planejamento', 'viagem', [POUSADA]);

    await tocar('Editar a reserva Pousada da serra');
    expect(screen.getByLabelText('Data').props.value).toBe('12/12/2026');
    await preencher('Nome, obrigatório', 'Pousada');
    await tocar('Guardar reserva');
    expect(servico.editarReserva).toHaveBeenCalledWith('r1', expect.objectContaining({ nome: 'Pousada', data: '12/12/2026' }));

    await tocar('Editar a reserva Pousada');
    await tocar('Excluir reserva');
    await tocar('Sim, excluir reserva');
    expect(servico.excluirReserva).toHaveBeenCalledWith('r1');
    expect(screen.queryByText('Pousada')).toBeNull();
  });

  it('em Desejo não há reservas; uma reserva já guardada aparece em qualquer estado', async () => {
    await abrirExperiencia('desejo', 'viagem');
    expect(screen.queryByRole('header', { name: 'Reservas' })).toBeNull();
    expect(screen.queryByText('Mais para planejar')).toBeNull();
  });

  it('com conteúdo, a seção aparece mesmo em Desejo e sem tamanho', async () => {
    await abrirExperiencia('desejo', null, [POUSADA]);
    expect(screen.getByRole('header', { name: 'Reservas' })).toBeTruthy();
    expect(screen.getByText('Pousada da serra')).toBeTruthy();
  });
});
