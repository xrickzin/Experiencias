import * as ImagePicker from 'expo-image-picker';
import { act, fireEvent, screen } from 'expo-router/testing-library';

import * as servico from '@/services/experiencias';
import * as fotos from '@/services/fotos';
import * as impressoes from '@/services/impressoes';
import * as observacoes from '@/services/observacoes';
import type { Foto } from '@/services/fotos';

import { abrir, esperar } from './apoio/abrir';
import { experiencia } from './apoio/experiencia';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
jest.mock('@/services/laco');
jest.mock('@/services/experiencias');
// Links e reservas abrem vazios; têm testes próprios (links-test.tsx, reservas-test.tsx).
jest.mock('@/services/links', () => ({ ...jest.requireActual('@/services/links'), listarLinks: async () => ({ ok: true, links: [] }) }));
jest.mock('@/services/reservas', () => ({ ...jest.requireActual('@/services/reservas'), listarReservas: async () => ({ ok: true, reservas: [] }) }));
jest.mock('@/services/fotos');
jest.mock('@/services/observacoes');
jest.mock('@/services/impressoes');
jest.mock('expo-image-picker');
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

const exp = jest.mocked(servico);
const svc = jest.mocked(fotos);
const picker = jest.mocked(ImagePicker);

const foto = (id: string, capturadaEm: string | null = '2026-10-15T15:00:00Z'): Foto => ({
  id,
  caminho: `l1/1/${id}.jpg`,
  url: `https://assinada/${id}`,
  miniatura: null,
  autorId: 'm1',
  capturadaEm,
  legenda: null,
  criadoEm: '2026-10-15T20:00:00Z',
});
const asset = (n: number) =>
  ({ uri: `file://${n}.jpg`, base64: `QUJD${n}`, mimeType: 'image/jpeg', width: 1, height: 1 }) as ImagePicker.ImagePickerAsset;

async function tocar(rotulo: string) {
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: rotulo }));
  });
  await esperar();
}

async function aba(nome: 'Momentos' | 'Detalhes') {
  await act(async () => {
    await fireEvent.press(screen.getByRole('tab', { name: nome }));
  });
  await esperar();
}

async function abrirEm(estado: 'desejo' | 'planejamento' | 'vivendo') {
  exp.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [experiencia('1', 'Viagem', { estado })] });
  await abrir('/experiencia/1');
  await screen.findByText('Viagem', { exact: false }).catch(() => undefined);
  await esperar();
}

beforeEach(() => {
  reiniciarSessao();
  jest.resetAllMocks();
  jest.mocked(observacoes.listarObservacoes).mockResolvedValue({ ok: true, observacoes: [] });
  jest.mocked(impressoes.listarImpressoes).mockResolvedValue({ ok: true, impressoes: [] });
  definirSessao({
    estado: 'com-laco',
    usuarioId: 'u1',
    perfil: { membro_id: 'm1', nome: 'Ana', laco_id: 'l1', companheiro_vinculado: true, companheiro_nome: 'Bia' },
  });
  svc.listarFotos.mockResolvedValue({ ok: true, fotos: [] });
  svc.removerFotosDaExperiencia.mockResolvedValue({ ok: true });
});

describe('aba de fotos agrupada', () => {
  it('em Vivendo, as fotos são a aba principal, por dia e período', async () => {
    svc.listarFotos.mockResolvedValue({
      ok: true,
      fotos: [foto('a', '2026-03-10T11:00:00Z'), foto('b', '2026-03-10T23:00:00Z'), foto('c', '2026-03-09T15:00:00Z')],
    });
    await abrirEm('vivendo');

    expect(screen.getByRole('tab', { name: 'Momentos' }).props.accessibilityState.selected).toBe(true);
    expect(await screen.findByText('10 de março')).toBeTruthy();
    expect(screen.getByText('9 de março')).toBeTruthy();
    expect(screen.getByText('NOITE')).toBeTruthy(); // 20h em Brasília
    expect(screen.getAllByText('MANHÃ')).toHaveLength(1); // 08h
    expect(screen.getByText('TARDE')).toBeTruthy(); // 12h do dia 9
    expect(screen.getByRole('imagebutton', { name: 'Foto 1 de 3, 10 de março, noite' })).toBeTruthy();
    // Os campos de edição ficam na outra aba.
    expect(screen.queryByLabelText('Título, obrigatório')).toBeNull();

    await aba('Detalhes');
    expect(screen.getByLabelText('Título, obrigatório')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tirar foto' })).toBeNull();
  });

  it('galeria: manda o horário em que a foto foi tirada, lido do EXIF', async () => {
    picker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ ...asset(1), exif: { DateTimeOriginal: '2026:03:10 20:15:00', GPSLatitude: -23.5 } }],
    });
    svc.enviarFoto.mockResolvedValue({ ok: true, foto: foto('n') });
    await abrirEm('vivendo');

    await tocar('Escolher da galeria');

    // Só o instante vai ao servidor; localização e o resto do EXIF ficam no aparelho.
    expect(svc.enviarFoto).toHaveBeenCalledWith('l1', '1', {
      base64: 'QUJD1',
      mimeType: 'image/jpeg',
      capturadaEm: '2026-03-10T23:15:00.000Z',
      miniatura: null,
    });
  });
});

describe('legenda da foto', () => {
  it('adicionar uma legenda na foto aberta', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a')] });
    svc.legendarFoto.mockResolvedValue({ ok: true, legenda: 'Primeira noite na serra' });
    await abrirEm('vivendo');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('imagebutton', { name: /^Foto 1 de 1/ }));
    });

    await tocar('Adicionar legenda');
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Legenda'), 'Primeira noite na serra');
    });
    await tocar('Guardar legenda');

    expect(svc.legendarFoto).toHaveBeenCalledWith('a', 'Primeira noite na serra');
    expect(screen.getByText('Primeira noite na serra')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Editar legenda' })).toBeTruthy();
    await tocar('Fechar');
    expect(screen.getByRole('imagebutton', { name: /legenda: Primeira noite na serra/ })).toBeTruthy();
  });

  it('editar já começa com a legenda atual; falha avisa e mantém a escrita', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [{ ...foto('a'), legenda: 'Antiga' }] });
    svc.legendarFoto.mockResolvedValue({ ok: false, codigo: 'rede', mensagem: 'Sem conexão.' });
    await abrirEm('vivendo');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('imagebutton', { name: /^Foto 1 de 1/ }));
    });
    expect(screen.getByText('Antiga')).toBeTruthy();

    await tocar('Editar legenda');
    expect(screen.getByLabelText('Legenda').props.value).toBe('Antiga');
    await tocar('Guardar legenda');

    expect(screen.getByText('Sem conexão.')).toBeTruthy();
    expect(screen.getByLabelText('Legenda')).toBeTruthy();
  });
});

describe('quando a foto foi tirada', () => {
  async function abrirFoto() {
    await abrirEm('vivendo');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('imagebutton', { name: /^Foto 1 de 1/ }));
    });
  }

  it('mostra quando foi tirada e corrige para outro dia e período', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a')] });
    svc.datarFoto.mockImplementation(async (_id, capturadaEm) => ({ ok: true, capturadaEm }));
    await abrirFoto();
    expect(screen.getByText(/^Tirada em: /)).toBeTruthy();

    await tocar('Alterar quando foi tirada');
    await act(async () => {
      await fireEvent.press(screen.getByRole('radio', { name: 'Outro dia' }));
    });
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Dia em que a foto foi tirada'), '10062022');
    });
    await act(async () => {
      await fireEvent.press(screen.getByRole('radio', { name: 'Noite' }));
    });
    await tocar('Guardar data');

    // Noite em Brasília é guardada no meio do período (21h = 00h UTC do dia seguinte).
    expect(svc.datarFoto).toHaveBeenCalledWith('a', '2022-06-11T00:00:00.000Z');
    expect(screen.getByText(/^Tirada em: .*2022 · Noite$/)).toBeTruthy();
  });

  it('dia no futuro não é aceito e não chama o servidor', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a')] });
    await abrirFoto();
    await tocar('Alterar quando foi tirada');
    await act(async () => {
      await fireEvent.press(screen.getByRole('radio', { name: 'Outro dia' }));
    });
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Dia em que a foto foi tirada'), '01012099');
    });
    await tocar('Guardar data');

    expect(screen.getByText('Escolham um dia que já aconteceu.')).toBeTruthy();
    expect(svc.datarFoto).not.toHaveBeenCalled();
  });
});

describe('salvar no celular ou compartilhar', () => {
  async function abrirFoto() {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a')] });
    await abrirEm('vivendo');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('imagebutton', { name: /^Foto 1 de 1/ }));
    });
  }

  it('salvar no celular confirma; falha explica o que conferir', async () => {
    svc.salvarFoto.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({
      ok: false,
      codigo: 'salvar',
      mensagem: 'Não foi possível salvar a foto no celular. Confira se o Laço pode acessar as fotos e tente de novo.',
    });
    await abrirFoto();

    await tocar('Salvar no celular');
    expect(svc.salvarFoto).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
    expect(screen.getByText('Foto salva no celular.')).toBeTruthy();

    await tocar('Salvar no celular');
    expect(screen.getByText(/Confira se o Laço pode acessar as fotos/)).toBeTruthy();
  });

  it('compartilhar abre as opções do aparelho; falha avisa', async () => {
    svc.compartilharFoto.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({
      ok: false,
      codigo: 'compartilhar',
      mensagem: 'Não foi possível preparar a foto para compartilhar. Tente de novo.',
    });
    await abrirFoto();

    await tocar('Compartilhar');
    expect(svc.compartilharFoto).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
    expect(screen.queryByText(/Não foi possível preparar/)).toBeNull();

    await tocar('Compartilhar');
    expect(screen.getByText('Não foi possível preparar a foto para compartilhar. Tente de novo.')).toBeTruthy();
  });
});

describe('foto em tela cheia', () => {
  it('tocar na foto aberta mostra a tela cheia; o X volta para a foto', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a')] });
    await abrirEm('vivendo');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('imagebutton', { name: /^Foto 1 de 1/ }));
    });
    expect(screen.queryByTestId('foto-em-tela-cheia')).toBeNull();

    await act(async () => {
      await fireEvent.press(screen.getByRole('imagebutton', { name: 'Ver a foto em tela cheia' }));
    });
    expect(screen.getByTestId('foto-em-tela-cheia')).toBeTruthy();
    expect(screen.getByLabelText('Foto em tela cheia')).toBeTruthy();

    await tocar('Fechar tela cheia');
    expect(screen.queryByTestId('foto-em-tela-cheia')).toBeNull();
    expect(screen.getByTestId('foto-aberta')).toBeTruthy();
  });
});

describe('foto de destaque', () => {
  it('na foto aberta, "Usar como foto de destaque" marca a miniatura', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a'), foto('b', '2026-10-15T16:00:00Z')] });
    exp.definirFotoDestaque.mockResolvedValue({
      ok: true,
      experiencia: experiencia('1', 'Viagem', { estado: 'vivendo', fotoDestaque: { id: 'a', caminho: 'l1/1/a.jpg' } }),
    });
    await abrirEm('vivendo');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('imagebutton', { name: /^Foto 2 de 2/ }));
    });

    await tocar('Usar como foto de destaque');

    expect(exp.definirFotoDestaque).toHaveBeenCalledWith('1', 'a');
    expect(screen.getByText('Esta é a foto de destaque de Viagem.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tirar do destaque' })).toBeTruthy();
    await tocar('Fechar');
    expect(screen.getByRole('imagebutton', { name: /foto de destaque$/ })).toBeTruthy();
    expect(screen.getByText('DESTAQUE')).toBeTruthy();
  });

  it('"Tirar do destaque" manda nulo', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a')] });
    exp.listarExperiencias.mockResolvedValue({
      ok: true,
      experiencias: [experiencia('1', 'Viagem', { estado: 'vivendo', fotoDestaque: { id: 'a', caminho: 'l1/1/a.jpg' } })],
    });
    exp.definirFotoDestaque.mockResolvedValue({ ok: true, experiencia: experiencia('1', 'Viagem', { estado: 'vivendo' }) });
    await abrir('/experiencia/1');
    await esperar();
    await act(async () => {
      await fireEvent.press(await screen.findByRole('imagebutton', { name: /foto de destaque$/ }));
    });

    await tocar('Tirar do destaque');

    expect(exp.definirFotoDestaque).toHaveBeenCalledWith('1', null);
    expect(screen.getByRole('button', { name: 'Usar como foto de destaque' })).toBeTruthy();
  });

  it('falha ao escolher: avisa sem fechar a foto', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a')] });
    exp.definirFotoDestaque.mockResolvedValue({ ok: false, codigo: 'rede', mensagem: 'Sem conexão.' });
    await abrirEm('vivendo');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('imagebutton', { name: /^Foto 1 de 1/ }));
    });

    await tocar('Usar como foto de destaque');

    expect(screen.getByText('Sem conexão.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Usar como foto de destaque' })).toBeTruthy();
  });
});

describe('fotos na experiência', () => {
  it('em Desejo não há fotos (registros só a partir de Planejamento)', async () => {
    await abrirEm('desejo');
    expect(screen.queryByRole('tab', { name: 'Momentos' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tirar foto' })).toBeNull();
  });

  it('em Planejamento os momentos ficam na aba "Momentos", depois dos detalhes', async () => {
    await abrirEm('planejamento');
    expect(screen.getByRole('tab', { name: 'Detalhes' }).props.accessibilityState.selected).toBe(true);
    expect(screen.queryByRole('button', { name: 'Tirar foto' })).toBeNull();

    await aba('Momentos');
    expect(await screen.findByText(/Nenhum momento ainda/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tirar foto' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Escolher da galeria' })).toBeTruthy();
  });

  it('mostra as fotos guardadas', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a'), foto('b')] });
    await abrirEm('vivendo');
    expect(await screen.findByRole('imagebutton', { name: /^Foto 1 de 2/ })).toBeTruthy();
    expect(screen.getByRole('imagebutton', { name: /^Foto 2 de 2/ })).toBeTruthy();
  });

  it('câmera sem permissão: explica e não abre', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as ImagePicker.CameraPermissionResponse);
    await abrirEm('vivendo');

    await tocar('Tirar foto');

    expect(screen.getByText('Sem acesso à câmera. Libere o acesso nas configurações do aparelho.')).toBeTruthy();
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('câmera: guarda a foto tirada no Laço e na experiência', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as ImagePicker.CameraPermissionResponse);
    picker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [asset(1)] });
    svc.enviarFoto.mockResolvedValue({ ok: true, foto: foto('nova') });
    await abrirEm('vivendo');

    await tocar('Tirar foto');

    expect(svc.enviarFoto).toHaveBeenCalledWith('l1', '1', expect.objectContaining({ base64: 'QUJD1', mimeType: 'image/jpeg' }));
    // Foto da câmera sem hora no EXIF: vale o momento em que foi tirada (agora).
    expect(svc.enviarFoto.mock.calls[0][2].capturadaEm).toEqual(expect.any(String));
    expect(await screen.findByRole('imagebutton', { name: /^Foto 1 de 1/ })).toBeTruthy();
  });

  it('cancelar a câmera não envia nada', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as ImagePicker.CameraPermissionResponse);
    picker.launchCameraAsync.mockResolvedValue({ canceled: true, assets: null });
    await abrirEm('planejamento');
    await aba('Momentos');

    await tocar('Tirar foto');
    expect(svc.enviarFoto).not.toHaveBeenCalled();
  });

  it('galeria com várias: envia uma a uma; se uma falhar, diz quantas entraram', async () => {
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [asset(1), asset(2), asset(3)] });
    svc.enviarFoto
      .mockResolvedValueOnce({ ok: true, foto: foto('a') })
      .mockResolvedValueOnce({ ok: false, codigo: 'rede', mensagem: 'Sem conexão.' });
    await abrirEm('planejamento');
    await aba('Momentos');

    await tocar('Escolher da galeria');

    expect(picker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsMultipleSelection: true, base64: true })
    );
    expect(svc.enviarFoto).toHaveBeenCalledTimes(2);
    expect(screen.getByText('1 de 3 fotos foram guardadas. Sem conexão.')).toBeTruthy();
    expect(screen.getByRole('imagebutton', { name: /^Foto 1 de 1/ })).toBeTruthy();
  });

  it('abrir uma foto e excluí-la pelo pop-up', async () => {
    svc.listarFotos.mockResolvedValue({ ok: true, fotos: [foto('a')] });
    svc.excluirFoto.mockResolvedValue({ ok: true });
    await abrirEm('vivendo');
    await act(async () => {
      await fireEvent.press(await screen.findByRole('imagebutton', { name: /^Foto 1 de 1/ }));
    });

    await tocar('Excluir foto');
    expect(screen.getByText('Excluir esta foto?')).toBeTruthy();
    await tocar('Sim, excluir foto');

    expect(svc.excluirFoto).toHaveBeenCalledWith(expect.objectContaining(foto('a')));
    expect(await screen.findByText(/Nenhum momento ainda/)).toBeTruthy();
  });

  it('excluir a experiência apaga as fotos antes; se falhar, nada é excluído', async () => {
    svc.removerFotosDaExperiencia.mockResolvedValue({
      ok: false,
      codigo: 'fotos_nao_removidas',
      mensagem: 'Não foi possível apagar as fotos desta experiência. Nada foi excluído; tente de novo.',
    });
    await abrirEm('planejamento');

    await tocar('Excluir experiência');
    await tocar('Sim, excluir experiência');

    expect(svc.removerFotosDaExperiencia).toHaveBeenCalledWith('1');
    expect(exp.excluirExperiencia).not.toHaveBeenCalled();
    expect(screen.getByText('Não foi possível apagar as fotos desta experiência. Nada foi excluído; tente de novo.')).toBeTruthy();
  });

  it('excluir a experiência com as fotos removidas segue para a exclusão', async () => {
    exp.excluirExperiencia.mockResolvedValue({ ok: true });
    const { tela } = await (async () => {
      exp.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [experiencia('1', 'Viagem', { estado: 'vivendo' })] });
      const aberto = await abrir('/experiencia/1');
      await esperar();
      return aberto;
    })();

    await aba('Detalhes');
    await tocar('Excluir experiência');
    await tocar('Sim, excluir experiência');

    expect(svc.removerFotosDaExperiencia).toHaveBeenCalledWith('1');
    expect(exp.excluirExperiencia).toHaveBeenCalledWith('1');
    expect(tela.getPathname()).toBe('/');
  });
});
