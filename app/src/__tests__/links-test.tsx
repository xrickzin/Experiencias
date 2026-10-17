// Links da experiência (ADR 039): o que é guardado a partir do que foi colado, como aparece, e o
// fluxo na tela (adicionar, abrir, editar, excluir) e o "Abrir no mapa" do Local.
import { act, fireEvent, screen } from 'expo-router/testing-library';
import { Linking } from 'react-native';

import * as categorias from '@/services/categorias';
import * as experiencias from '@/services/experiencias';
import * as links from '@/services/links';
import { descreverEndereco, enderecoNoMapa, lerEndereco } from '@/services/links';

import { abrir, esperar } from './apoio/abrir';
import { experiencia } from './apoio/experiencia';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
jest.mock('@/services/laco');
jest.mock('@/services/experiencias');
jest.mock('@/services/categorias');
jest.mock('@/services/links', () => ({
  ...jest.requireActual('@/services/links'),
  listarLinks: jest.fn(),
  criarLink: jest.fn(),
  editarLink: jest.fn(),
  excluirLink: jest.fn(),
}));
jest.mock('@/services/reservas', () => ({ ...jest.requireActual('@/services/reservas'), listarReservas: async () => ({ ok: true, reservas: [] }) }));
jest.mock('@/services/roteiro', () => ({ ...jest.requireActual('@/services/roteiro'), listarRoteiro: async () => ({ ok: true, itens: [] }) }));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

const servico = jest.mocked(links);
const PEDRA = { id: 'l1', titulo: 'Pedra do Baú', url: 'https://maps.app.goo.gl/abc', criadoEm: '2026-10-16T12:00:00Z' };

describe('endereço colado', () => {
  it('fica só o link do "Compartilhar" do Google Maps', () => {
    expect(lerEndereco('Pedra do Baú\nhttps://maps.app.goo.gl/abc')).toBe('https://maps.app.goo.gl/abc');
  });
  it('sem http, entende como https; texto que não é endereço é recusado', () => {
    expect(lerEndereco(' pousada.com.br/quartos ')).toBe('https://pousada.com.br/quartos');
    expect(lerEndereco('javascript:alert(1)')).toBeNull();
    expect(lerEndereco('um restaurante bom')).toBeNull();
    expect(lerEndereco('')).toBeNull();
  });
  it('mostra "Google Maps" para lugares no mapa e o domínio para o resto', () => {
    expect(descreverEndereco('https://maps.app.goo.gl/abc')).toEqual({ dominio: 'Google Maps', mapa: true });
    expect(descreverEndereco('https://www.google.com/maps/place/x')).toEqual({ dominio: 'Google Maps', mapa: true });
    expect(descreverEndereco('https://www.google.com/search?q=x')).toEqual({ dominio: 'google.com', mapa: false });
    expect(descreverEndereco('https://www.ingresso.com/evento?id=1')).toEqual({ dominio: 'ingresso.com', mapa: false });
  });
  it('pesquisa do Local no mapa', () => {
    expect(enderecoNoMapa(' Campos do Jordão ')).toBe('https://www.google.com/maps/search/?api=1&query=Campos%20do%20Jord%C3%A3o');
  });
});

describe('links na tela', () => {
  let abrirUrl: jest.SpyInstance;

  beforeEach(() => {
    reiniciarSessao();
    jest.resetAllMocks();
    abrirUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    jest.mocked(categorias.listarCategorias).mockResolvedValue({ ok: true, categorias: [] });
    jest.mocked(experiencias.listarExperiencias).mockResolvedValue({
      ok: true,
      experiencias: [experiencia('1', 'Fim de semana na serra', { local: 'Campos do Jordão' })],
    });
    definirSessao({
      estado: 'com-laco',
      usuarioId: 'u1',
      perfil: { membro_id: 'm1', nome: 'Ana', laco_id: 'l1', companheiro_vinculado: true, companheiro_nome: 'Bia' },
    });
  });

  async function tocar(rotulo: string, papel: 'button' | 'link' = 'button') {
    await act(async () => {
      await fireEvent.press(screen.getByRole(papel, { name: rotulo }));
    });
    await esperar();
  }

  it('adicionar colando o "Compartilhar" do Maps: o nome vem junto; tocar abre o lugar', async () => {
    servico.listarLinks.mockResolvedValue({ ok: true, links: [] });
    servico.criarLink.mockResolvedValue({ ok: true, link: PEDRA });
    await abrir('/experiencia/1');
    expect(await screen.findByText(/Guardem o site do restaurante/)).toBeTruthy();

    await tocar('Adicionar link');
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Endereço'), 'Pedra do Baú\nhttps://maps.app.goo.gl/abc');
    });
    expect(screen.getByLabelText('Nome').props.value).toBe('Pedra do Baú');
    await tocar('Guardar link');

    expect(servico.criarLink).toHaveBeenCalledWith('1', 'Pedra do Baú', 'Pedra do Baú\nhttps://maps.app.goo.gl/abc');
    expect(screen.queryByTestId('editor-de-link')).toBeNull();
    await tocar('Pedra do Baú, Google Maps. Abrir no mapa', 'link');
    expect(abrirUrl).toHaveBeenCalledWith('https://maps.app.goo.gl/abc');
  });

  it('erro ao guardar aparece e o editor continua aberto', async () => {
    servico.listarLinks.mockResolvedValue({ ok: true, links: [] });
    servico.criarLink.mockResolvedValue({ ok: false, codigo: 'link_endereco_invalido', mensagem: 'Cole um endereço válido, como https://exemplo.com.' });
    await abrir('/experiencia/1');
    await tocar('Adicionar link');
    await tocar('Guardar link');
    expect(screen.getByText('Cole um endereço válido, como https://exemplo.com.')).toBeTruthy();
    expect(screen.getByTestId('editor-de-link')).toBeTruthy();
  });

  it('editar e excluir com confirmação', async () => {
    servico.listarLinks.mockResolvedValue({ ok: true, links: [PEDRA] });
    servico.editarLink.mockResolvedValue({ ok: true, link: { ...PEDRA, titulo: 'Pedra do Baú (trilha)' } });
    servico.excluirLink.mockResolvedValue({ ok: true });
    await abrir('/experiencia/1');
    await screen.findByRole('button', { name: 'Editar o link Pedra do Baú' });

    await tocar('Editar o link Pedra do Baú');
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Nome'), 'Pedra do Baú (trilha)');
    });
    await tocar('Guardar link');
    expect(servico.editarLink).toHaveBeenCalledWith('l1', 'Pedra do Baú (trilha)', PEDRA.url);

    await tocar('Editar o link Pedra do Baú (trilha)');
    await tocar('Excluir link');
    await tocar('Sim, excluir link');
    expect(servico.excluirLink).toHaveBeenCalledWith('l1');
    expect(screen.queryByRole('button', { name: /Editar o link/ })).toBeNull();
  });

  it('"Abrir no mapa" no Local pesquisa o texto no Google Maps', async () => {
    servico.listarLinks.mockResolvedValue({ ok: true, links: [] });
    await abrir('/experiencia/1');
    await screen.findByRole('button', { name: 'Abrir no mapa' });
    await tocar('Abrir no mapa');
    expect(abrirUrl).toHaveBeenCalledWith(enderecoNoMapa('Campos do Jordão'));
  });
});
