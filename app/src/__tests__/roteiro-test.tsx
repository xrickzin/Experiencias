// Roteiro por dia (ADR 038, etapa 4; ADR 040): ordem, posições ao guardar, arrastar e mover, validação,
// e o fluxo na tela: o botão no formulário, a guia, adicionar, mover, editar, excluir e desligar.
import { act, fireEvent, screen } from 'expo-router/testing-library';
import { Linking } from 'react-native';

import * as categorias from '@/services/categorias';
import * as experiencias from '@/services/experiencias';
import * as linksDaExperiencia from '@/services/links';
import type { Link } from '@/services/links';
import type { Estado, Experiencia } from '@/services/experiencias';
import type { Periodo } from '@/services/agrupar-fotos';
import { SEM_DATA } from '@/services/referencia-temporal';
import * as roteiro from '@/services/roteiro';
import {
  agruparRoteiro,
  camposDe,
  diasDaExperiencia,
  ordemAoGuardar,
  ordenarRoteiro,
  posicaoAoSoltar,
  posicaoUmPasso,
  rotuloDoDiaDoRoteiro,
  validarItem,
  type ItemDoRoteiro,
} from '@/services/roteiro';

import { abrir, esperar } from './apoio/abrir';
import { experiencia } from './apoio/experiencia';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
// As mensagens de falha de verdade, para conferir os motivos da validação.
jest.mock('@/services/laco', () => ({ ...jest.createMockFromModule<object>('@/services/laco'), falha: jest.requireActual('@/services/laco').falha }));
jest.mock('@/services/experiencias');
jest.mock('@/services/fotos');
jest.mock('@/services/impressoes', () => ({ ...jest.requireActual('@/services/impressoes'), listarImpressoes: async () => ({ ok: true, impressoes: [] }) }));
jest.mock('@/services/categorias');
jest.mock('@/services/links', () => ({ ...jest.requireActual('@/services/links'), listarLinks: jest.fn(), criarLink: jest.fn() }));
jest.mock('@/services/reservas', () => ({ ...jest.requireActual('@/services/reservas'), listarReservas: async () => ({ ok: true, reservas: [] }) }));
jest.mock('@/services/roteiro', () => ({
  ...jest.requireActual('@/services/roteiro'),
  listarRoteiro: jest.fn(),
  criarItem: jest.fn(),
  editarItem: jest.fn(),
  moverItem: jest.fn(),
  excluirItem: jest.fn(),
}));
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

const servico = jest.mocked(roteiro);
const exp = jest.mocked(experiencias);

let seq = 0;
const item = (dia: string, periodo: Periodo, ordem: number, extra: Partial<ItemDoRoteiro> = {}): ItemDoRoteiro => ({
  id: `i${++seq}`,
  dia,
  periodo,
  horario: null,
  texto: `Item ${seq}`,
  ordem,
  links: [],
  criadoEm: `2026-10-16T12:00:0${seq % 10}Z`,
  ...extra,
});

describe('regras do roteiro', () => {
  it('ordena por dia, período na ordem do dia e a ordem do casal', () => {
    const noite = item('2026-12-12', 'noite', 0);
    const manha2 = item('2026-12-12', 'manha', 2);
    const manha1 = item('2026-12-12', 'manha', 1);
    const outroDia = item('2026-12-11', 'noite', 9);
    expect(ordenarRoteiro([noite, manha2, outroDia, manha1]).map((i) => i.id)).toEqual([outroDia.id, manha1.id, manha2.id, noite.id]);
  });

  it('os dias da experiência: o dia marcado, cada dia do período, nada sem dia ou com período longo demais', () => {
    expect(diasDaExperiencia({ precisao: 'periodo', inicio: '2026-12-31', fim: '2027-01-02', horario: null })).toEqual([
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
    expect(diasDaExperiencia({ precisao: 'data_horario', inicio: '2026-12-12', fim: null, horario: '19:00' })).toEqual(['2026-12-12']);
    expect(diasDaExperiencia({ precisao: 'mes_ano', inicio: '2026-12-01', fim: null, horario: null })).toEqual([]);
    expect(diasDaExperiencia(SEM_DATA)).toEqual([]);
    expect(diasDaExperiencia({ precisao: 'periodo', inicio: '2026-12-01', fim: '2027-02-01', horario: null })).toEqual([]);
  });

  it('rótulos do dia: dia da semana, hoje e amanhã', () => {
    const agora = new Date('2026-12-12T15:00:00Z'); // sábado em Brasília
    expect(rotuloDoDiaDoRoteiro('2026-12-12', agora)).toBe('Hoje, sábado');
    expect(rotuloDoDiaDoRoteiro('2026-12-13', agora)).toBe('Amanhã, domingo');
    expect(rotuloDoDiaDoRoteiro('2026-12-18', agora)).toBe('sexta, 18 de dezembro');
  });

  it('agrupa os dias da experiência (mesmo vazios) e os dias com itens fora dela', () => {
    const fora = item('2026-12-20', 'tarde', 0);
    const dias = agruparRoteiro([fora, item('2026-12-12', 'noite', 0)], ['2026-12-12', '2026-12-13'], new Date('2026-10-16T12:00:00Z'));
    expect(dias.map((d) => [d.dia, d.numero, d.itens.length])).toEqual([
      ['2026-12-12', 1, 1],
      ['2026-12-13', 2, 0],
      ['2026-12-20', null, 1],
    ]);
    expect(dias[0].periodos.map((p) => p.periodo)).toEqual(['noite']);
  });

  it('ao guardar, o horário sugere a posição; sem horário, vai para o fim do período', () => {
    const cafe = item('2026-12-12', 'manha', 0, { horario: '08:00' });
    const trilha = item('2026-12-12', 'manha', 1, { horario: '10:00' });
    const solto = item('2026-12-12', 'manha', 2);
    const outros = [cafe, trilha, solto, item('2026-12-12', 'tarde', 0)];
    expect(ordemAoGuardar([], '2026-12-12', 'manha', null)).toBe(0);
    expect(ordemAoGuardar(outros, '2026-12-12', 'manha', null)).toBe(3);
    expect(ordemAoGuardar(outros, '2026-12-12', 'manha', '09:00')).toBe(0.5);
    expect(ordemAoGuardar(outros, '2026-12-12', 'manha', '07:00')).toBe(-1);
    // Depois do último com horário, antes do que não tem.
    expect(ordemAoGuardar(outros, '2026-12-12', 'manha', '11:00')).toBe(1.5);
  });

  it('soltar noutro período muda o período e tira o horário que não cabe', () => {
    const a = item('2026-12-12', 'manha', 0, { horario: '09:00' });
    const b = item('2026-12-12', 'tarde', 0);
    const c = item('2026-12-12', 'tarde', 1);
    expect(posicaoAoSoltar(a, [b, c], 1, 'tarde')).toEqual({ periodo: 'tarde', ordem: 0.5, horario: null });
    expect(posicaoAoSoltar(a, [b, c], 0, 'manha')).toEqual({ periodo: 'manha', ordem: 0, horario: '09:00' });
  });

  it('um passo: troca com o vizinho do mesmo período; na borda, só troca de período', () => {
    const m1 = item('2026-12-12', 'manha', 0);
    const m2 = item('2026-12-12', 'manha', 1);
    const t1 = item('2026-12-12', 'tarde', 0);
    const dia = [m1, m2, t1];
    expect(posicaoUmPasso(dia, m2.id, -1)).toEqual({ periodo: 'manha', ordem: -1, horario: null });
    expect(posicaoUmPasso(dia, m2.id, 1)).toEqual({ periodo: 'tarde', ordem: -1, horario: null });
    expect(posicaoUmPasso(dia, t1.id, -1)).toEqual({ periodo: 'manha', ordem: 2, horario: null });
    expect(posicaoUmPasso(dia, m1.id, -1)).toBeNull();
    expect(posicaoUmPasso(dia, t1.id, 1)).toBeNull();
  });

  it('valida o que foi digitado', () => {
    const base = { ...camposDe(null, '2026-12-12'), texto: ' Trilha ' };
    expect(validarItem(base)).toEqual({ dia: '2026-12-12', periodo: 'manha', horario: null, texto: 'Trilha' });
    expect(validarItem({ ...base, texto: ' ' })).toMatchObject({ codigo: 'roteiro_sem_texto' });
    expect(validarItem({ ...base, texto: 'x'.repeat(201) })).toMatchObject({ codigo: 'roteiro_texto_longo' });
    expect(validarItem({ ...base, dia: '31/02/2026' })).toMatchObject({ codigo: 'roteiro_dia_invalido' });
    expect(validarItem({ ...base, horario: '25:00' })).toMatchObject({ codigo: 'roteiro_horario_invalido' });
    expect(validarItem({ ...base, horario: '14:00' })).toMatchObject({ codigo: 'roteiro_horario_fora_do_periodo' });
  });
});

describe('roteiro na tela', () => {
  const PERIODO = { precisao: 'periodo' as const, inicio: '2026-12-12', fim: '2026-12-13', horario: null };
  const CAFE = item('2026-12-12', 'manha', 0, { id: 'cafe', texto: 'Café na pousada', horario: '08:00' });
  const TRILHA = item('2026-12-12', 'manha', 1, { id: 'trilha', texto: 'Trilha da pedra' });

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

  async function abrirExperiencia(extra: Partial<Experiencia>, itens: ItemDoRoteiro[] = [], links: Link[] = []) {
    servico.listarRoteiro.mockResolvedValue({ ok: true, itens });
    jest.mocked(linksDaExperiencia.listarLinks).mockResolvedValue({ ok: true, links });
    const e = experiencia('1', 'Fim de semana na serra', { estado: 'planejamento' as Estado, referencia: PERIODO, ...extra });
    exp.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [e] });
    await abrir('/experiencia/1');
    await esperar();
    return e;
  }

  async function tocar(rotulo: string, papel: 'button' | 'tab' | 'radio' | 'checkbox' | 'link' = 'button') {
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

  it('o card no fim de Detalhes explica com um exemplo, sugere pelo tamanho e liga na hora', async () => {
    const e = await abrirExperiencia({ referencia: SEM_DATA, tamanho: 'fim_de_semana' });
    exp.definirRoteiro.mockResolvedValue({ ok: true, experiencia: { ...e, roteiroAtivo: true } });
    expect(nomesDasAbas()).toEqual(['Detalhes', 'Momentos']);
    expect(screen.getByRole('header', { name: 'Roteiro por dia' })).toBeTruthy();
    expect(screen.getByText('Combina com um fim de semana.')).toBeTruthy();
    expect(screen.getByText('Por exemplo, um sábado')).toBeTruthy();

    await tocar('Usar roteiro');
    expect(exp.definirRoteiro).toHaveBeenCalledWith('1', true);
    expect(exp.atualizarExperiencia).not.toHaveBeenCalled();
    expect(nomesDasAbas()).toEqual(['Detalhes', 'Roteiro', 'Momentos']);
    expect(screen.getByText('Ligado · ainda sem itens')).toBeTruthy();

    await tocar('Abrir o roteiro');
    expect(screen.getByText('Para ver cada dia aqui, escolham as datas em Detalhes. Enquanto isso, dá para adicionar itens em qualquer data.')).toBeTruthy();
  });

  it('num período, a duração vem das datas: aparece sem botões e vai junto ao salvar', async () => {
    const e = await abrirExperiencia({ tamanho: null });
    exp.atualizarExperiencia.mockResolvedValue({ ok: true, experiencia: { ...e, tamanho: 'fim_de_semana' } });
    // 12 a 14/12/2026: sábado a segunda.
    expect(screen.getByLabelText('Duração: Fim de semana, calculada pelas datas.')).toBeTruthy();
    expect(screen.getByText('Calculada pelas datas')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Não sei ainda' })).toBeNull();
    expect(screen.getByText('Combina com um fim de semana.')).toBeTruthy();
    await tocar('Salvar');
    expect(exp.atualizarExperiencia).toHaveBeenCalledWith('1', expect.objectContaining({ tamanho: 'fim_de_semana' }));
  });

  it('sem período, o casal escolhe a duração', async () => {
    await abrirExperiencia({ referencia: SEM_DATA });
    expect(screen.getByRole('radio', { name: 'Não sei ainda' }).props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.queryByText('Calculada pelas datas')).toBeNull();
  });

  it('sem duração que combine, o card não sugere nada', async () => {
    await abrirExperiencia({ referencia: SEM_DATA, tamanho: 'noite' });
    expect(screen.getByRole('button', { name: 'Usar roteiro' })).toBeTruthy();
    expect(screen.queryByText(/Combina com/)).toBeNull();
  });

  it('ao criar, o card vale junto com "Adicionar desejo"', async () => {
    exp.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [] });
    exp.criarDesejo.mockResolvedValue({ ok: true, desejo: experiencia('9', 'Serra', { roteiroAtivo: true }) });
    await abrir('/criar');
    await tocar('Usar roteiro');
    expect(screen.getByText('Vai junto com o desejo')).toBeTruthy();
    await preencher('Título, obrigatório', 'Serra');
    await tocar('Adicionar desejo');
    expect(exp.criarDesejo).toHaveBeenCalledWith(expect.objectContaining({ titulo: 'Serra', roteiroAtivo: true }));
  });

  it('a guia mostra os dias da experiência; adicionar num dia já vem com ele, e o horário escolhe o período', async () => {
    const novo = item('2026-12-13', 'tarde', 0, { id: 'novo', texto: 'Cachoeira', horario: '14:00' });
    servico.criarItem.mockResolvedValue({ ok: true, item: novo });
    await abrirExperiencia({ roteiroAtivo: true });
    await tocar('Roteiro', 'tab');

    expect(screen.getByText('2 dias')).toBeTruthy();
    expect(screen.getByText('DIA 1')).toBeTruthy();
    expect(screen.getAllByText('Dia livre, por enquanto.')).toHaveLength(2);

    await tocar('Adicionar ao roteiro em Dia 2');
    expect(screen.getByRole('radio', { name: 'Dom, 13/12' }).props.accessibilityState).toMatchObject({ checked: true });
    await preencher('O que vão fazer, obrigatório', 'Cachoeira');
    await preencher('Horário', '1400');
    expect(screen.getByRole('radio', { name: 'Tarde' }).props.accessibilityState).toMatchObject({ checked: true });
    await tocar('Guardar no roteiro');

    expect(servico.criarItem).toHaveBeenCalledWith('1', { dia: '13/12/2026', periodo: 'tarde', horario: '14:00', texto: 'Cachoeira', links: [] }, []);
    expect(screen.getByText('Cachoeira')).toBeTruthy();
    expect(screen.getByText('TARDE')).toBeTruthy();
  });

  it('trocar o período para um que não combina tira o horário', async () => {
    await abrirExperiencia({ roteiroAtivo: true });
    await tocar('Roteiro', 'tab');
    await tocar('Adicionar ao roteiro');
    await preencher('Horário', '0900');
    await tocar('Noite', 'radio');
    expect(screen.getByLabelText('Horário').props.value).toBe('');
  });

  it('"Mover para baixo" (leitor de tela) muda a ordem na hora e grava', async () => {
    servico.moverItem.mockResolvedValue({ ok: true, item: { ...CAFE, ordem: 2 } });
    await abrirExperiencia({ roteiroAtivo: true }, [CAFE, TRILHA]);
    await tocar('Roteiro', 'tab');

    await act(async () => {
      fireEvent(screen.getByRole('button', { name: '08:00, Café na pousada, manhã' }), 'accessibilityAction', {
        nativeEvent: { actionName: 'descer' },
      });
    });
    expect(servico.moverItem).toHaveBeenCalledWith('cafe', { periodo: 'manha', ordem: 2, horario: '08:00' });
    const ordem = screen.getAllByRole('button').map((b) => b.props.accessibilityLabel).filter((l) => /Café|Trilha/.test(l ?? ''));
    expect(ordem).toEqual(['Trilha da pedra, manhã', '08:00, Café na pousada, manhã']);
  });

  it('se o servidor recusar a nova ordem, volta como estava e avisa', async () => {
    servico.moverItem.mockResolvedValue({ ok: false, codigo: 'roteiro_nao_movido', mensagem: 'Não foi possível mudar a ordem do roteiro. Tente de novo.' });
    await abrirExperiencia({ roteiroAtivo: true }, [CAFE, TRILHA]);
    await tocar('Roteiro', 'tab');
    await act(async () => {
      fireEvent(screen.getByRole('button', { name: 'Trilha da pedra, manhã' }), 'accessibilityAction', { nativeEvent: { actionName: 'subir' } });
    });
    await esperar();
    expect(screen.getByText('Não foi possível mudar a ordem do roteiro. Tente de novo.')).toBeTruthy();
    const ordem = screen.getAllByRole('button').map((b) => b.props.accessibilityLabel).filter((l) => /Café|Trilha/.test(l ?? ''));
    expect(ordem).toEqual(['08:00, Café na pousada, manhã', 'Trilha da pedra, manhã']);
  });

  it('editar e excluir com confirmação', async () => {
    servico.editarItem.mockResolvedValue({ ok: true, item: { ...TRILHA, texto: 'Trilha longa' } });
    servico.excluirItem.mockResolvedValue({ ok: true });
    await abrirExperiencia({ roteiroAtivo: true }, [CAFE, TRILHA]);
    await tocar('Roteiro', 'tab');

    await tocar('Trilha da pedra, manhã');
    expect(screen.getByLabelText('O que vão fazer, obrigatório').props.value).toBe('Trilha da pedra');
    await preencher('O que vão fazer, obrigatório', 'Trilha longa');
    await tocar('Guardar no roteiro');
    expect(servico.editarItem).toHaveBeenCalledWith(TRILHA, expect.objectContaining({ texto: 'Trilha longa', dia: '12/12/2026' }), [CAFE, TRILHA]);

    await tocar('Trilha longa, manhã');
    await tocar('Excluir do roteiro');
    await tocar('Sim, tirar do roteiro');
    expect(servico.excluirItem).toHaveBeenCalledWith('trilha');
    expect(screen.queryByText('Trilha longa')).toBeNull();
  });

  it('marcar um link da experiência no item; o link aparece no item e abre', async () => {
    const INGRESSO: Link = { id: 'l1', titulo: 'Ingresso', url: 'https://museu.com', criadoEm: '2026-10-16T12:00:00Z' };
    const abrirUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    servico.editarItem.mockResolvedValue({ ok: true, item: { ...TRILHA, links: ['l1'] } });
    await abrirExperiencia({ roteiroAtivo: true }, [CAFE, TRILHA], [INGRESSO]);
    await tocar('Roteiro', 'tab');

    await tocar('Trilha da pedra, manhã');
    await tocar('Ingresso', 'checkbox');
    await tocar('Guardar no roteiro');
    expect(servico.editarItem).toHaveBeenCalledWith(TRILHA, expect.objectContaining({ links: ['l1'] }), [CAFE, TRILHA]);

    await tocar('Abrir Ingresso, de Trilha da pedra', 'link');
    expect(abrirUrl).toHaveBeenCalledWith('https://museu.com');
  });

  it('criar um link pelo item: já entra marcado', async () => {
    const MAPA: Link = { id: 'l2', titulo: 'Mapa', url: 'https://maps.google.com/x', criadoEm: '2026-10-16T12:00:00Z' };
    jest.mocked(linksDaExperiencia.criarLink).mockResolvedValue({ ok: true, link: MAPA });
    servico.criarItem.mockResolvedValue({ ok: true, item: item('2026-12-12', 'manha', 0, { texto: 'Museu', links: ['l2'] }) });
    await abrirExperiencia({ roteiroAtivo: true });
    await tocar('Roteiro', 'tab');
    await tocar('Adicionar ao roteiro');
    expect(screen.getByText('Ingresso, cardápio, mapa: o link criado aqui também fica em Links, nos detalhes.')).toBeTruthy();

    await preencher('O que vão fazer, obrigatório', 'Museu');
    await tocar('+ Novo link', 'checkbox');
    await preencher('Nome do link, obrigatório', 'Mapa');
    await preencher('Endereço, obrigatório', 'maps.google.com/x');
    await tocar('Criar link');
    expect(linksDaExperiencia.criarLink).toHaveBeenCalledWith('1', 'Mapa', 'maps.google.com/x');
    expect(screen.getByRole('checkbox', { name: 'Mapa' }).props.accessibilityState).toMatchObject({ checked: true });
    await tocar('Guardar no roteiro');
    expect(servico.criarItem).toHaveBeenCalledWith('1', expect.objectContaining({ texto: 'Museu', links: ['l2'] }), []);
  });

  it('desligar com itens pede confirmação, diz quantos saem e liga na hora', async () => {
    const e = await abrirExperiencia({ roteiroAtivo: true }, [CAFE, TRILHA]);
    exp.definirRoteiro.mockResolvedValue({ ok: true, experiencia: { ...e, roteiroAtivo: false } });
    expect(screen.getByText('Ligado · 2 itens em 1 dia')).toBeTruthy();

    await tocar('Desligar o roteiro');
    expect(exp.definirRoteiro).not.toHaveBeenCalled();
    expect(screen.getByText('Os 2 itens do roteiro serão excluídos, para os dois. Não dá para desfazer.')).toBeTruthy();

    servico.listarRoteiro.mockResolvedValue({ ok: true, itens: [] });
    await tocar('Sim, desligar e excluir');
    expect(exp.definirRoteiro).toHaveBeenCalledWith('1', false);
    expect(nomesDasAbas()).toEqual(['Detalhes', 'Momentos']);
    expect(screen.getByRole('button', { name: 'Usar roteiro' })).toBeTruthy();
  });

  it('desligar sem itens não pede confirmação', async () => {
    const e = await abrirExperiencia({ roteiroAtivo: true });
    exp.definirRoteiro.mockResolvedValue({ ok: true, experiencia: { ...e, roteiroAtivo: false } });
    await tocar('Desligar o roteiro');
    expect(exp.definirRoteiro).toHaveBeenCalledWith('1', false);
  });

  it('em Desejo, o roteiro ligado cria as guias; na Memória, a guia só aparece com itens', async () => {
    await abrirExperiencia({ estado: 'desejo', roteiroAtivo: true });
    expect(nomesDasAbas()).toEqual(['Detalhes', 'Roteiro']);
  });

  it('na Memória sem itens, não há guia Roteiro nem o card', async () => {
    await abrirExperiencia({ estado: 'memoria', roteiroAtivo: true });
    expect(nomesDasAbas()).toEqual(['Memória', 'Momentos', 'Detalhes']);
    await tocar('Detalhes', 'tab');
    expect(screen.queryByRole('header', { name: 'Roteiro por dia' })).toBeNull();
  });

  it('na Memória com itens, a guia aparece depois dos momentos', async () => {
    await abrirExperiencia({ estado: 'memoria', roteiroAtivo: true }, [CAFE]);
    expect(nomesDasAbas()).toEqual(['Memória', 'Momentos', 'Roteiro', 'Detalhes']);
  });
});
