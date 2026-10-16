import { act, fireEvent, screen } from 'expo-router/testing-library';

import { abrir, esperar } from './apoio/abrir';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
jest.mock('@/services/laco');
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

async function mudarSessao(parcial: Parameters<typeof definirSessao>[0]) {
  await act(async () => definirSessao(parcial));
  await esperar();
}

beforeEach(() => reiniciarSessao());

describe('barra de abas', () => {
  it('abas com rótulo e estado de selecionada; tocar troca de aba', async () => {
    definirSessao({ estado: 'com-laco' });
    const { tela } = await abrir('/');
    const aba = (nome: string) => screen.getByRole('tab', { name: nome });
    expect(aba('Início').props.accessibilityState).toMatchObject({ selected: true });
    expect(aba('Desejos').props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getByRole('button', { name: 'Criar experiência' })).toBeTruthy();

    await act(async () => {
      await fireEvent.press(aba('Desejos'));
    });
    await esperar();
    expect(tela.getPathname()).toBe('/desejos');
    expect(aba('Desejos').props.accessibilityState).toMatchObject({ selected: true });
  });
});

describe('navegação conforme a sessão', () => {
  it('sem sessão, abre na entrada', async () => {
    const { tela } = await abrir('/');
    expect(tela.getPathname()).toBe('/entrada');
    expect(screen.getByText('Quero começar nosso Laço')).toBeTruthy();
  });

  it('com Laço, abre em Início', async () => {
    definirSessao({ estado: 'com-laco' });
    const { tela } = await abrir('/');
    expect(tela.getPathname()).toBe('/');
  });

  // Regressão: a tela de redefinir senha, declarada primeiro na pilha, virava o destino padrão.
  it('ao ganhar acesso, vai para Início e não para a tela de redefinir senha', async () => {
    const { tela } = await abrir('/entrada');
    expect(tela.getPathname()).toBe('/entrada');

    await mudarSessao({ estado: 'com-laco' });

    expect(tela.getPathname()).toBe('/');
    expect(screen.queryByText('Esse link não vale mais.')).toBeNull();
  });

  it('ao perder o acesso, volta para a entrada', async () => {
    definirSessao({ estado: 'com-laco' });
    const { tela } = await abrir('/');

    await mudarSessao({ estado: 'sem-sessao' });

    expect(tela.getPathname()).toBe('/entrada');
  });

  it('conta sem Laço é levada a continuar', async () => {
    definirSessao({ estado: 'sem-laco', usuarioId: 'u1' });
    const { tela } = await abrir('/');
    expect(tela.getPathname()).toBe('/entrada/continuar');
  });
});
