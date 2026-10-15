import { act, fireEvent, screen } from 'expo-router/testing-library';

import * as laco from '@/services/laco';

import { abrir, esperar } from './apoio/abrir';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
jest.mock('@/services/laco');
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

const servico = jest.mocked(laco);
const OK = { ok: true as const };
const falha = (codigo: string, mensagem: string) => ({ ok: false as const, codigo, mensagem });

async function preencher(rotulo: string, valor: string) {
  await fireEvent.changeText(screen.getByLabelText(rotulo), valor);
}

// O toque e as promessas que ele dispara (serviços simulados) terminam dentro do mesmo `act`.
async function tocar(rotulo: string) {
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: rotulo }));
  });
  await esperar();
}

beforeEach(() => {
  reiniciarSessao();
  jest.resetAllMocks();
});

describe('criar um Laço', () => {
  async function ateOCodigo() {
    const aberto = await abrir('/entrada/criar-laco');
    await preencher('Seu nome', 'Ana');
    await tocar('Continuar');
    await preencher('Nome da outra pessoa', 'Bia');
    await tocar('Continuar');
    await preencher('Código do casal', 'nosso código');
    return aberto;
  }

  it('do começo ao Início, mostrando o código uma vez', async () => {
    servico.verificarCodigoDisponivel.mockResolvedValue(OK);
    servico.cadastrar.mockResolvedValue(OK);
    servico.criarLaco.mockResolvedValue(OK);
    const { tela } = await ateOCodigo();

    await tocar('Continuar');
    await preencher('Seu e-mail', 'ana@exemplo.com');
    await preencher('Crie uma senha', '12345678');
    await preencher('Confirme sua senha', '12345678');
    await tocar('Criar acesso');

    expect(await screen.findByText('O Laço de vocês começou.')).toBeTruthy();
    expect(screen.getByText('nosso código')).toBeTruthy();
    expect(servico.cadastrar).toHaveBeenCalledWith('ana@exemplo.com', '12345678');
    expect(servico.criarLaco).toHaveBeenCalledWith({
      nome: 'Ana',
      nomeCompanheiro: 'Bia',
      codigo: 'nosso código',
    });

    await act(async () => definirSessao({ proximoEstado: 'com-laco' }));
    await tocar('Entrar no Laço');
    expect(tela.getPathname()).toBe('/');
  });

  it('código em uso mostra a mensagem e não avança', async () => {
    servico.verificarCodigoDisponivel.mockResolvedValue(
      falha('palavra_em_uso', 'Esse código já está em uso. Escolha outro.')
    );
    await ateOCodigo();

    await tocar('Continuar');

    expect(screen.getByText('Esse código já está em uso. Escolha outro.')).toBeTruthy();
    expect(servico.cadastrar).not.toHaveBeenCalled();
  });

  it('senhas diferentes são barradas antes de chamar o servidor', async () => {
    servico.verificarCodigoDisponivel.mockResolvedValue(OK);
    await ateOCodigo();
    await tocar('Continuar');

    await preencher('Seu e-mail', 'ana@exemplo.com');
    await preencher('Crie uma senha', '12345678');
    await preencher('Confirme sua senha', '87654321');
    await tocar('Criar acesso');

    expect(screen.getByText('As senhas não são iguais.')).toBeTruthy();
    expect(servico.cadastrar).not.toHaveBeenCalled();
  });
});

describe('entrar no Laço', () => {
  it('pessoa nova: e-mail, código, senha e confirmação até o Início', async () => {
    servico.consultarEmail.mockResolvedValue({ ok: true, existe: false });
    servico.verificarCodigoDeVinculo.mockResolvedValue(OK);
    servico.cadastrar.mockResolvedValue(OK);
    servico.vincularLaco.mockResolvedValue(OK);
    servico.buscarPerfil.mockResolvedValue({
      ok: true,
      perfil: {
        membro_id: 'm2',
        nome: 'Bia',
        laco_id: 'l1',
        companheiro_vinculado: true,
        companheiro_nome: 'Ana',
      },
    });
    const { tela } = await abrir('/entrada/entrar');

    await preencher('E-mail', 'bia@exemplo.com');
    await tocar('Continuar');
    await preencher('Código do casal', 'nosso código');
    await tocar('Continuar');
    await preencher('Crie uma senha', '12345678');
    await preencher('Confirme sua senha', '12345678');
    await tocar('Entrar no Laço');

    expect(await screen.findByText('Você entrou no Laço.')).toBeTruthy();
    expect(servico.vincularLaco).toHaveBeenCalledWith('nosso código');

    await act(async () => definirSessao({ proximoEstado: 'com-laco' }));
    await tocar('Ir para o Início');
    expect(tela.getPathname()).toBe('/');
  });

  it('código errado mostra resposta genérica', async () => {
    servico.consultarEmail.mockResolvedValue({ ok: true, existe: false });
    servico.verificarCodigoDeVinculo.mockResolvedValue(
      falha('nao_encontrado', 'Não encontramos um Laço com esse código.')
    );
    await abrir('/entrada/entrar');

    await preencher('E-mail', 'bia@exemplo.com');
    await tocar('Continuar');
    await preencher('Código do casal', 'errado');
    await tocar('Continuar');

    expect(screen.getByText('Não encontramos um Laço com esse código.')).toBeTruthy();
    expect(servico.cadastrar).not.toHaveBeenCalled();
  });

  it('e-mail cadastrado pede só a senha e mostra o erro de credenciais', async () => {
    servico.consultarEmail.mockResolvedValue({ ok: true, existe: true });
    servico.entrar.mockResolvedValue(
      falha('credenciais_invalidas', 'Não conseguimos validar seus dados de acesso.')
    );
    await abrir('/entrada/entrar');

    await preencher('E-mail', 'ana@exemplo.com');
    await tocar('Continuar');
    expect(screen.getByText('Vamos reencontrar vocês.')).toBeTruthy();
    expect(screen.queryByLabelText('Código do casal')).toBeNull();

    await preencher('Senha', 'senhaerrada');
    await tocar('Entrar');

    expect(screen.getByText('Não conseguimos validar seus dados de acesso.')).toBeTruthy();
  });
});

describe('recuperar a senha', () => {
  it('"Esqueci minha senha" leva o e-mail e mostra a confirmação neutra', async () => {
    servico.consultarEmail.mockResolvedValue({ ok: true, existe: true });
    servico.solicitarRecuperacaoDeSenha.mockResolvedValue(OK);
    const { tela } = await abrir('/entrada/entrar');

    await preencher('E-mail', 'ana@exemplo.com');
    await tocar('Continuar');
    await tocar('Esqueci minha senha');

    expect(tela.getPathname()).toBe('/entrada/esqueci-senha');
    expect(screen.getByLabelText('E-mail').props.value).toBe('ana@exemplo.com');

    await tocar('Enviar link');

    expect(screen.getByText('Confira seu e-mail.')).toBeTruthy();
    expect(servico.solicitarRecuperacaoDeSenha).toHaveBeenCalledWith('ana@exemplo.com');
  });

  it('link expirado oferece pedir outro', async () => {
    await abrir('/redefinir-senha?error=access_denied&error_code=otp_expired');

    expect(screen.getByText('Esse link não vale mais.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pedir outro link' })).toBeTruthy();
    expect(servico.abrirSessaoDeRecuperacao).not.toHaveBeenCalled();
  });

  it('link válido: troca o código, valida e salva a nova senha', async () => {
    servico.abrirSessaoDeRecuperacao.mockResolvedValue(OK);
    servico.definirNovaSenha.mockResolvedValue(OK);
    const { tela } = await abrir('/redefinir-senha?code=abc123&sb_flow_id=a1b2c3d4e5f6a7b8');

    expect(await screen.findByText('Escolha uma nova senha.')).toBeTruthy();
    expect(servico.abrirSessaoDeRecuperacao).toHaveBeenCalledTimes(1);
    expect(servico.abrirSessaoDeRecuperacao).toHaveBeenCalledWith('abc123', 'a1b2c3d4e5f6a7b8');

    await preencher('Nova senha', '1234');
    await tocar('Salvar nova senha');
    expect(screen.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeTruthy();
    expect(servico.definirNovaSenha).not.toHaveBeenCalled();

    await preencher('Nova senha', '12345678');
    await preencher('Confirme a nova senha', '12345678');
    await tocar('Salvar nova senha');

    expect(await screen.findByText('Senha atualizada.')).toBeTruthy();
    expect(servico.definirNovaSenha).toHaveBeenCalledWith('12345678');

    await act(async () => definirSessao({ proximoEstado: 'com-laco' }));
    await tocar('Continuar');
    expect(tela.getPathname()).toBe('/');
  });

  it('código recusado pelo servidor cai em "link inválido"', async () => {
    servico.abrirSessaoDeRecuperacao.mockResolvedValue(
      falha('link_invalido', 'Esse link não é mais válido. Peça um novo.')
    );
    await abrir('/redefinir-senha?code=abc123');

    expect(await screen.findByText('Esse link não vale mais.')).toBeTruthy();
  });
});
