// Fase 5 nas telas: o "+" com as duas formas de criar, registrar uma memória, finalizar (com e sem
// data), a aba Memória com a regra de privacidade, observações e o momento favorito.
import { act, fireEvent, screen } from 'expo-router/testing-library';

import * as servico from '@/services/experiencias';
import type { Experiencia } from '@/services/experiencias';
import * as fotos from '@/services/fotos';
import type { Foto } from '@/services/fotos';
import * as impressoes from '@/services/impressoes';
import type { Impressao } from '@/services/impressoes';
import { diaEPeriodo } from '@/services/agrupar-fotos';
import * as observacoes from '@/services/observacoes';

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

const exp = jest.mocked(servico);
const svc = jest.mocked(fotos);
const imp = jest.mocked(impressoes);
const obs = jest.mocked(observacoes);

const lista = (...itens: Experiencia[]) => exp.listarExperiencias.mockResolvedValue({ ok: true, experiencias: itens });
const comData = { referencia: { precisao: 'data' as const, inicio: '2026-10-12', fim: null, horario: null } };
const memoria = (extra: Partial<Experiencia> = {}) =>
  experiencia('1', 'Serra', { estado: 'memoria', ...comData, ...extra });
const foto = (id: string): Foto => ({
  id,
  caminho: `l1/1/${id}.jpg`,
  url: `https://assinada/${id}`,
  autorId: 'm1',
  capturadaEm: '2026-10-12T15:00:00Z',
  legenda: null,
  criadoEm: '2026-10-12T15:00:00Z',
});
const impressao = (membroId: string, texto: string | null, favorito: string | null = null): Impressao => ({
  membroId,
  texto,
  momentoFavorito: favorito ? { id: favorito, caminho: `l1/1/${favorito}.jpg` } : null,
});

async function tocar(rotulo: string) {
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: rotulo }));
  });
  await esperar();
}

async function aba(nome: string) {
  await act(async () => {
    await fireEvent.press(screen.getByRole('tab', { name: nome }));
  });
  await esperar();
}

async function escrever(rotulo: string, valor: string) {
  await act(async () => {
    await fireEvent.changeText(screen.getByLabelText(rotulo), valor);
  });
}

beforeEach(() => {
  reiniciarSessao();
  jest.resetAllMocks();
  definirSessao({
    estado: 'com-laco',
    usuarioId: 'u1',
    perfil: { membro_id: 'm1', nome: 'Ana', laco_id: 'l1', companheiro_vinculado: true, companheiro_nome: 'Bia' },
  });
  svc.listarFotos.mockResolvedValue({ ok: true, fotos: [] });
  svc.assinarCaminhos.mockResolvedValue(new Map());
  obs.listarObservacoes.mockResolvedValue({ ok: true, observacoes: [] });
  imp.listarImpressoes.mockResolvedValue({ ok: true, impressoes: [] });
  lista();
});

describe('criar pelo +', () => {
  it('oferece criar um desejo ou registrar uma memória', async () => {
    const { tela } = await abrir('/');
    await tocar('Criar experiência');

    expect(screen.getByText('O que vocês querem guardar?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Criar um desejo' })).toBeTruthy();
    await tocar('Registrar uma memória');

    expect(tela.getPathname()).toBe('/criar');
    expect(screen.getByText('O que vocês já viveram?')).toBeTruthy();
  });

  it('memória exige quando aconteceu e não oferece "Sem data"', async () => {
    await abrir('/criar?tipo=memoria');
    expect(screen.queryByRole('radio', { name: 'Sem data' })).toBeNull();
    await escrever('Título, obrigatório', 'Primeiro encontro');

    await tocar('Guardar memória');

    expect(screen.getByText('Escolham quando vocês viveram isso.')).toBeTruthy();
    expect(exp.registrarMemoria).not.toHaveBeenCalled();
  });

  it('memória com título e mês: guarda e abre a memória', async () => {
    const nova = memoria({ id: 'm9', titulo: 'Primeiro encontro' });
    exp.registrarMemoria.mockImplementation(async () => {
      lista(nova);
      return { ok: true, memoria: nova };
    });
    const { tela } = await abrir('/criar?tipo=memoria');
    await escrever('Título, obrigatório', 'Primeiro encontro');
    await act(async () => {
      await fireEvent.press(screen.getByRole('radio', { name: 'Mês' }));
    });
    await escrever('Mês e ano', '032019');

    await tocar('Guardar memória');

    expect(exp.registrarMemoria).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: 'Primeiro encontro',
        referencia: { precisao: 'mes_ano', inicio: '2019-03-01', fim: null, horario: null },
      })
    );
    expect(tela.getPathname()).toBe('/experiencia/m9');
  });
});

describe('finalizar', () => {
  async function abrirVivendo(extra: Partial<Experiencia> = {}) {
    lista(experiencia('1', 'Serra', { estado: 'vivendo', ...extra }));
    await abrir('/experiencia/1');
    await screen.findByText('Está acontecendo.');
    await aba('Detalhes');
    await tocar('Finalizar experiência');
  }

  it('com data: confirma e a tela vira a memória, já convidando a escrever', async () => {
    exp.finalizarExperiencia.mockImplementation(async () => {
      lista(memoria());
      return { ok: true };
    });
    await abrirVivendo(comData);
    expect(screen.getByText('Ela vira uma memória e não volta para Vivendo. Fotos e observações continuam com ela.')).toBeTruthy();

    await tocar('Finalizar');

    expect(exp.finalizarExperiencia).toHaveBeenCalledWith('1', null);
    expect(await screen.findByText('Essa experiência virou uma memória.')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Memória' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Como foi essa experiência para você?')).toBeTruthy();

    await tocar('Escrever depois');
    expect(screen.getByRole('button', { name: 'Escrever minha impressão' })).toBeTruthy();
    expect(imp.salvarImpressao).not.toHaveBeenCalled();
  });

  it('"Ainda não" não finaliza', async () => {
    await abrirVivendo(comData);
    await tocar('Ainda não');
    expect(exp.finalizarExperiencia).not.toHaveBeenCalled();
    expect(screen.getByText('Está acontecendo.')).toBeTruthy();
  });

  it('sem data: pergunta quando viveram antes de finalizar', async () => {
    exp.finalizarExperiencia.mockImplementation(async () => {
      lista(memoria());
      return { ok: true };
    });
    await abrirVivendo();
    await tocar('Finalizar');

    expect(screen.getByText('Quando vocês viveram isso?')).toBeTruthy();
    await tocar('Finalizar');
    expect(screen.getByText('Escolham quando vocês viveram isso.')).toBeTruthy();
    expect(exp.finalizarExperiencia).not.toHaveBeenCalled();

    // O pop-up fica por cima da aba Detalhes, que também tem "Quando": vale o último (o do pop-up).
    await act(async () => {
      await fireEvent.press(screen.getAllByRole('radio', { name: 'Dia' }).at(-1)!);
    });
    await act(async () => {
      await fireEvent.changeText(screen.getAllByLabelText('Data').at(-1)!, '12102026');
    });
    await tocar('Finalizar');

    expect(exp.finalizarExperiencia).toHaveBeenCalledWith('1', {
      precisao: 'data',
      inicio: '2026-10-12',
      fim: null,
      horario: null,
    });
    expect(await screen.findByText('Essa experiência virou uma memória.')).toBeTruthy();
  });

  it('falha: avisa e continua em Vivendo', async () => {
    exp.finalizarExperiencia.mockResolvedValue({ ok: false, codigo: 'rede', mensagem: 'Sem conexão.' });
    await abrirVivendo(comData);
    await tocar('Finalizar');

    expect(screen.getByText('Sem conexão.')).toBeTruthy();
    expect(screen.getByText('Está acontecendo.')).toBeTruthy();
  });
});

describe('a memória e a privacidade', () => {
  async function abrirMemoria(lidas: Impressao[]) {
    imp.listarImpressoes.mockResolvedValue({ ok: true, impressoes: lidas });
    lista(memoria());
    await abrir('/experiencia/1');
    await screen.findByText('Já faz parte da história de vocês.');
    await esperar();
  }
  const AVISO = 'A impressão e o momento favorito de Bia serão revelados quando você registrar a sua impressão.';

  it('sem a minha impressão: aviso neutro, sem dizer se Bia escreveu', async () => {
    await abrirMemoria([impressao('m1', null, 'a')]);

    expect(screen.getByText(AVISO)).toBeTruthy();
    expect(screen.queryByText(/ainda não registrou/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Escrever minha impressão' })).toBeTruthy();
  });

  it('com a minha impressão: vejo a de Bia e o favorito dela', async () => {
    await abrirMemoria([impressao('m1', 'Quero lembrar do silêncio.'), impressao('m2', 'Sem pressa.', 'b')]);

    expect(screen.queryByText(AVISO)).toBeNull();
    expect(screen.getByText('“Quero lembrar do silêncio.”')).toBeTruthy();
    expect(screen.getByText('Impressão de Bia')).toBeTruthy();
    expect(screen.getByText('“Sem pressa.”')).toBeTruthy();
    expect(screen.getByText('Momento favorito de Bia')).toBeTruthy();
    expect(screen.getByText('Você ainda não escolheu. Abra uma foto na aba Momentos para escolher.')).toBeTruthy();
  });

  it('com a minha e sem nada de Bia: só aí diz que ela ainda não registrou', async () => {
    await abrirMemoria([impressao('m1', 'Foi bom.')]);

    expect(screen.getByText('Bia ainda não registrou a impressão.')).toBeTruthy();
    expect(screen.getByText('Bia ainda não escolheu um momento favorito.')).toBeTruthy();
  });

  it('escrever a impressão chama o servidor e relê (a regra decide o que aparece)', async () => {
    imp.salvarImpressao.mockResolvedValue({ ok: true });
    await abrirMemoria([]);
    await tocar('Escrever minha impressão');
    await tocar('Guardar minha impressão');
    expect(screen.getByText('Escreva sua impressão antes de guardar, ou deixe para depois.')).toBeTruthy();

    imp.listarImpressoes.mockResolvedValue({ ok: true, impressoes: [impressao('m1', 'Foi bom.'), impressao('m2', 'Sem pressa.')] });
    await escrever('Como foi essa experiência para você?', 'Foi bom.');
    await tocar('Guardar minha impressão');

    expect(imp.salvarImpressao).toHaveBeenCalledWith('1', 'Foi bom.');
    expect(await screen.findByText('“Sem pressa.”')).toBeTruthy();
  });

  it('apagar a própria impressão confirma e explica o efeito', async () => {
    imp.salvarImpressao.mockResolvedValue({ ok: true });
    await abrirMemoria([impressao('m1', 'Foi bom.'), impressao('m2', 'Sem pressa.')]);
    await tocar('Apagar minha impressão');

    expect(
      screen.getByText(
        'A impressão de Bia continua guardada. Enquanto você não escrever outra, a impressão e o momento favorito de Bia ficam ocultos para você.'
      )
    ).toBeTruthy();
    imp.listarImpressoes.mockResolvedValue({ ok: true, impressoes: [impressao('m1', null)] });
    await tocar('Sim, apagar minha impressão');

    expect(imp.salvarImpressao).toHaveBeenCalledWith('1', '');
    expect(await screen.findByText(AVISO)).toBeTruthy();
  });

  it('sem a outra pessoa vinculada, não há bloco dela', async () => {
    definirSessao({
      estado: 'com-laco',
      usuarioId: 'u1',
      perfil: { membro_id: 'm1', nome: 'Ana', laco_id: 'l1', companheiro_vinculado: false, companheiro_nome: 'Bia' },
    });
    await abrirMemoria([]);
    expect(screen.queryByText(AVISO)).toBeNull();
  });

  it('memória não volta de estado e pode ser excluída', async () => {
    await abrirMemoria([]);
    await aba('Detalhes');
    expect(screen.queryByRole('button', { name: /Voltar para|Começar/ })).toBeNull();
    expect(screen.queryByRole('radio', { name: 'Sem data' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Excluir memória' })).toBeTruthy();
  });
});

describe('momentos: observações e momento favorito', () => {
  async function abrirEditor() {
    lista(experiencia('1', 'Serra', { estado: 'vivendo' }));
    await abrir('/experiencia/1');
    await esperar();
    await tocar('Escrever observação do momento');
  }
  const marcar = async (nome: string) => {
    await act(async () => {
      await fireEvent.press(screen.getByRole('radio', { name: nome }));
    });
  };
  const escolhida = (nome: string) => screen.getByRole('radio', { name: nome }).props.accessibilityState.checked;

  it('escrever uma observação: por padrão é do momento atual, e a tela diz onde vai aparecer', async () => {
    const agora = new Date().toISOString();
    obs.criarObservacao.mockResolvedValue({
      ok: true,
      observacao: { id: 'o1', texto: 'Mesa 4, às 20h.', autorId: 'm1', capturadaEm: agora, criadoEm: agora },
    });
    await abrirEditor();

    expect(screen.getByText('Observação do momento')).toBeTruthy();
    expect(screen.getByText(/fica guardada no dia e no período escolhidos/)).toBeTruthy();
    expect(escolhida('Hoje')).toBe(true);
    expect(screen.getByText(/^Vai aparecer em: Hoje · /)).toBeTruthy();
    await escrever('Observação', 'Mesa 4, às 20h.');
    await tocar('Guardar observação');

    const [, texto, momento] = obs.criarObservacao.mock.calls[0];
    expect(texto).toBe('Mesa 4, às 20h.');
    expect(diaEPeriodo(momento)).toEqual(diaEPeriodo(new Date().toISOString()));
    expect(screen.getByRole('button', { name: /^Observação de hoje, .*, de Ana: Mesa 4, às 20h\.\. Editar$/ })).toBeTruthy();
  });

  it('escolher ontem de manhã guarda nesse dia e período', async () => {
    obs.criarObservacao.mockResolvedValue({
      ok: true,
      observacao: { id: 'o1', texto: 'Café', autorId: 'm1', capturadaEm: null, criadoEm: new Date().toISOString() },
    });
    await abrirEditor();
    await marcar('Ontem');
    await marcar('Manhã');
    expect(screen.getByText('Vai aparecer em: Ontem · Manhã')).toBeTruthy();
    await escrever('Observação', 'Café');
    await tocar('Guardar observação');

    const ontem = diaEPeriodo(new Date(Date.now() - 86_400_000).toISOString()).dia;
    expect(diaEPeriodo(obs.criarObservacao.mock.calls[0][2])).toEqual({ dia: ontem, periodo: 'manha' });
  });

  it('outro dia: digitado, nunca no futuro', async () => {
    await abrirEditor();
    await marcar('Outro dia');
    await escrever('Dia do momento', `0101${new Date().getFullYear() + 1}`);
    await escrever('Observação', 'Futuro');
    await tocar('Guardar observação');
    expect(screen.getByText('Escolham um dia que já aconteceu.')).toBeTruthy();

    await escrever('Dia do momento', '12102026');
    expect(screen.getByText(/^Vai aparecer em: 12 de outubro/)).toBeTruthy();
    expect(obs.criarObservacao).not.toHaveBeenCalled();
  });

  it('a observação de Bia aparece com o nome dela; editar e excluir', async () => {
    const minha = { id: 'o1', texto: 'Mesa 4.', autorId: 'm2', capturadaEm: null, criadoEm: '2026-10-12T15:00:00Z' };
    obs.listarObservacoes.mockResolvedValue({ ok: true, observacoes: [minha] });
    obs.editarObservacao.mockResolvedValue({ ok: true, observacao: { ...minha, texto: 'Mesa 5.' } });
    obs.excluirObservacao.mockResolvedValue({ ok: true });
    lista(experiencia('1', 'Serra', { estado: 'vivendo' }));
    await abrir('/experiencia/1');
    await esperar();

    expect(screen.getByText('Bia')).toBeTruthy();
    const abrirObservacao = async (texto: string) => {
      await act(async () => {
        await fireEvent.press(screen.getByRole('button', { name: new RegExp(`de Bia: ${texto}`) }));
      });
    };
    await abrirObservacao('Mesa 4');
    // A edição começa no momento da observação (12/10/2026, tarde).
    expect(escolhida('Outro dia')).toBe(true);
    expect(screen.getByLabelText('Dia do momento').props.value).toBe('12/10/2026');
    expect(escolhida('Tarde')).toBe(true);
    await escrever('Observação', 'Mesa 5.');
    await tocar('Guardar observação');
    expect(obs.editarObservacao).toHaveBeenCalledWith('o1', 'Mesa 5.', '2026-10-12T18:00:00.000Z');
    expect(screen.getByText('Mesa 5.')).toBeTruthy();

    await abrirObservacao('Mesa 5');
    await tocar('Excluir observação');
    await tocar('Sim, excluir observação');
    expect(obs.excluirObservacao).toHaveBeenCalledWith('o1');
    expect(await screen.findByText(/Nenhum momento ainda/)).toBeTruthy();
  });

  it('em Vivendo não há momento favorito (só na memória)', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a')] });
    lista(experiencia('1', 'Serra', { estado: 'vivendo' }));
    await abrir('/experiencia/1');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('imagebutton', { name: /^Foto 1 de 1/ }));
    });
    expect(screen.queryByRole('button', { name: /momento favorito/ })).toBeNull();
  });

  it('na memória, escolher a foto como meu momento favorito', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a')] });
    imp.escolherMomentoFavorito.mockResolvedValue({ ok: true });
    lista(memoria());
    await abrir('/experiencia/1');
    await screen.findByText('Já faz parte da história de vocês.');
    await aba('Momentos');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('imagebutton', { name: /^Foto 1 de 1/ }));
    });

    imp.listarImpressoes.mockResolvedValue({ ok: true, impressoes: [impressao('m1', null, 'a')] });
    await tocar('Escolher como meu momento favorito');

    expect(imp.escolherMomentoFavorito).toHaveBeenCalledWith('1', 'a');
    expect(screen.getByRole('button', { name: 'Deixar de ser meu momento favorito' })).toBeTruthy();
    await tocar('Fechar');
    expect(screen.getByRole('imagebutton', { name: /seu momento favorito$/ })).toBeTruthy();
  });
});

describe('Nossa História', () => {
  it('sem memórias, convida a registrar uma', async () => {
    lista(experiencia('d1', 'Desejo'));
    await abrir('/nossa-historia');
    expect(await screen.findByText('Ainda não há memórias')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Registrar uma memória' })).toBeTruthy();
  });

  it('lista as memórias, da mais recente para a mais antiga', async () => {
    lista(
      memoria({ id: 'a', titulo: 'Antiga', referencia: { precisao: 'mes_ano', inicio: '2019-03-01', fim: null, horario: null } }),
      memoria({ id: 'b', titulo: 'Recente' }),
      experiencia('v', 'Vivendo agora', { estado: 'vivendo' })
    );
    await abrir('/nossa-historia');
    await screen.findByText('Recente');

    const titulos = screen.getAllByRole('button').map((b) => b.props.accessibilityLabel).filter((l) => /Antiga|Recente|Vivendo/.test(l ?? ''));
    expect(titulos).toEqual(['Recente, 12/10/2026', 'Antiga, março de 2019']);
  });
});
