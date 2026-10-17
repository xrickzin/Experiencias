// Orçamento estimado (ADR 038, etapa 5; ADR 041): máscara e formatação em reais, o card no fim de
// Detalhes e do criar, a guia Orçamento, guardar e tirar o valor, e desligar com confirmação.
import { act, fireEvent, screen } from 'expo-router/testing-library';

import * as categorias from '@/services/categorias';
import * as experiencias from '@/services/experiencias';
import type { Estado, Experiencia } from '@/services/experiencias';
import { formatarReais, lerReais, mascararReais } from '@/services/orcamento';
import { SEM_DATA } from '@/services/referencia-temporal';

import { abrir, esperar } from './apoio/abrir';
import { experiencia } from './apoio/experiencia';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
// As mensagens de falha de verdade, para conferir o aviso de valor alto.
jest.mock('@/services/laco', () => ({ ...jest.createMockFromModule<object>('@/services/laco'), falha: jest.requireActual('@/services/laco').falha }));
jest.mock('@/services/experiencias');
jest.mock('@/services/fotos');
jest.mock('@/services/categorias');
jest.mock('@/services/impressoes', () => ({ ...jest.requireActual('@/services/impressoes'), listarImpressoes: async () => ({ ok: true, impressoes: [] }) }));
jest.mock('@/services/links', () => ({ ...jest.requireActual('@/services/links'), listarLinks: async () => ({ ok: true, links: [] }) }));
jest.mock('@/services/reservas', () => ({ ...jest.requireActual('@/services/reservas'), listarReservas: async () => ({ ok: true, reservas: [] }) }));
jest.mock('@/services/roteiro', () => ({ ...jest.requireActual('@/services/roteiro'), listarRoteiro: async () => ({ ok: true, itens: [] }) }));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

const exp = jest.mocked(experiencias);

describe('valores em reais', () => {
  it('formata centavos com milhar e vírgula', () => {
    expect(formatarReais(0)).toBe('0,00');
    expect(formatarReais(5)).toBe('0,05');
    expect(formatarReais(120000)).toBe('1.200,00');
    expect(formatarReais(10000000)).toBe('100.000,00');
  });

  it('a máscara põe os dígitos pelos centavos e ignora o que não é número', () => {
    expect(mascararReais('')).toBe('');
    expect(mascararReais('1')).toBe('0,01');
    expect(mascararReais('1200')).toBe('12,00');
    expect(mascararReais('R$ 1.200,005')).toBe('12.000,05');
    expect(mascararReais('000')).toBe('0,00');
  });

  it('lê o texto mascarado em centavos; vazio é nulo', () => {
    expect(lerReais('1.200,00')).toBe(120000);
    expect(lerReais('0,00')).toBe(0);
    expect(lerReais('')).toBeNull();
  });
});

describe('orçamento na tela', () => {
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

  async function abrirExperiencia(extra: Partial<Experiencia>) {
    const e = experiencia('1', 'Serra', { estado: 'planejamento' as Estado, ...extra });
    exp.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [e] });
    await abrir('/experiencia/1');
    await esperar();
    return e;
  }

  async function tocar(rotulo: string, papel: 'button' | 'tab' = 'button') {
    await act(async () => {
      await fireEvent.press(screen.getByRole(papel, { name: rotulo }));
    });
    await esperar();
  }

  async function preencher(rotulo: string, valor: string) {
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText(rotulo), valor);
    });
  }

  const nomesDasAbas = () => screen.queryAllByRole('tab').map((t) => t.props.accessibilityLabel);

  it('o card sugere a partir de "Um dia" e liga na hora; a guia entra depois do roteiro', async () => {
    const e = await abrirExperiencia({ tamanho: 'dia', roteiroAtivo: true });
    exp.definirOrcamentoAtivo.mockResolvedValue({ ok: true, experiencia: { ...e, orcamentoAtivo: true } });
    expect(screen.getByRole('header', { name: 'Orçamento' })).toBeTruthy();
    expect(screen.getByText('Combina com um dia inteiro.')).toBeTruthy();
    expect(screen.getByText('Por exemplo, um fim de semana na serra')).toBeTruthy();

    await tocar('Usar orçamento');
    expect(exp.definirOrcamentoAtivo).toHaveBeenCalledWith('1', true);
    expect(nomesDasAbas()).toEqual(['Detalhes', 'Roteiro', 'Orçamento', 'Momentos']);
    expect(screen.getByText('Ligado · ainda sem valor')).toBeTruthy();
  });

  it('numa noite, o card não sugere nada', async () => {
    await abrirExperiencia({ tamanho: 'noite' });
    expect(screen.getByRole('button', { name: 'Usar orçamento' })).toBeTruthy();
    expect(screen.queryByText(/Combina com/)).toBeNull();
  });

  it('definir o valor com a máscara; mostra em reais na guia e no card', async () => {
    const e = await abrirExperiencia({ orcamentoAtivo: true });
    exp.definirOrcamento.mockResolvedValue({ ok: true, experiencia: { ...e, orcamentoCentavos: 120000 } });
    await tocar('Orçamento', 'tab');
    expect(screen.getByText('Quanto vocês pensam em gastar, somando tudo? Um valor aproximado já ajuda a combinar.')).toBeTruthy();

    await tocar('Definir valor');
    await preencher('Valor estimado (R$)', '120000');
    expect(screen.getByLabelText('Valor estimado (R$)').props.value).toBe('1.200,00');
    await tocar('Guardar valor');
    expect(exp.definirOrcamento).toHaveBeenCalledWith('1', 120000);
    expect(screen.getByLabelText('Orçamento: 1.200,00 reais, estimativa para os dois.')).toBeTruthy();

    await tocar('Detalhes', 'tab');
    expect(screen.getByText('Ligado · R$ 1.200,00')).toBeTruthy();
  });

  it('acima de R$ 100.000,00 avisa sem chamar o servidor; "Tirar o valor" limpa', async () => {
    const e = await abrirExperiencia({ orcamentoAtivo: true, orcamentoCentavos: 50000 });
    exp.definirOrcamento.mockResolvedValue({ ok: true, experiencia: { ...e, orcamentoCentavos: null } });
    await tocar('Orçamento', 'tab');
    await tocar('Mudar valor');
    await preencher('Valor estimado (R$)', '10000001');
    await tocar('Guardar valor');
    expect(screen.getByText('O orçamento pode ir até R$ 100.000,00.')).toBeTruthy();
    expect(exp.definirOrcamento).not.toHaveBeenCalled();

    await tocar('Tirar o valor');
    expect(exp.definirOrcamento).toHaveBeenCalledWith('1', null);
  });

  it('desligar com valor pede confirmação e diz quanto se apaga', async () => {
    const e = await abrirExperiencia({ orcamentoAtivo: true, orcamentoCentavos: 120000 });
    exp.definirOrcamentoAtivo.mockResolvedValue({ ok: true, experiencia: { ...e, orcamentoAtivo: false, orcamentoCentavos: null } });
    await tocar('Desligar o orçamento');
    expect(exp.definirOrcamentoAtivo).not.toHaveBeenCalled();
    expect(screen.getByText('O orçamento de R$ 1.200,00 será apagado, para os dois.')).toBeTruthy();

    await tocar('Sim, desligar e apagar');
    expect(exp.definirOrcamentoAtivo).toHaveBeenCalledWith('1', false);
    expect(nomesDasAbas()).toEqual(['Detalhes', 'Momentos']);
  });

  it('desligar sem valor não pede confirmação', async () => {
    const e = await abrirExperiencia({ orcamentoAtivo: true });
    exp.definirOrcamentoAtivo.mockResolvedValue({ ok: true, experiencia: { ...e, orcamentoAtivo: false } });
    await tocar('Desligar o orçamento');
    expect(exp.definirOrcamentoAtivo).toHaveBeenCalledWith('1', false);
  });

  it('na Memória, a guia só aparece com valor, e não há card', async () => {
    await abrirExperiencia({ estado: 'memoria', orcamentoAtivo: true, referencia: SEM_DATA });
    expect(nomesDasAbas()).toEqual(['Memória', 'Momentos', 'Detalhes']);
    await tocar('Detalhes', 'tab');
    expect(screen.queryByRole('header', { name: 'Orçamento' })).toBeNull();
  });

  it('na Memória com valor, a guia aparece', async () => {
    await abrirExperiencia({ estado: 'memoria', orcamentoAtivo: true, orcamentoCentavos: 30000 });
    expect(nomesDasAbas()).toEqual(['Memória', 'Momentos', 'Orçamento', 'Detalhes']);
  });

  it('ao criar, o card vale junto com "Adicionar desejo"', async () => {
    exp.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [] });
    exp.criarDesejo.mockResolvedValue({ ok: true, desejo: experiencia('9', 'Serra', { orcamentoAtivo: true }) });
    await abrir('/criar');
    await tocar('Usar orçamento');
    await preencher('Título, obrigatório', 'Serra');
    await tocar('Adicionar desejo');
    expect(exp.criarDesejo).toHaveBeenCalledWith(expect.objectContaining({ orcamentoAtivo: true, roteiroAtivo: false }));
  });
});
