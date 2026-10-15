import { act, fireEvent, screen } from 'expo-router/testing-library';

import * as experiencias from '@/services/experiencias';

import { abrir, esperar } from './apoio/abrir';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
jest.mock('@/services/laco');
jest.mock('@/services/experiencias');
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

async function tocar(rotulo: string) {
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: rotulo }));
  });
  await esperar();
}

beforeEach(() => {
  reiniciarSessao();
  jest.mocked(experiencias.listarDesejos).mockResolvedValue({ ok: true, desejos: [] });
});

describe('sair da conta', () => {
  beforeEach(() => {
    definirSessao({
      estado: 'com-laco',
      usuarioId: 'u1',
      perfil: { membro_id: 'm1', nome: 'Ana', laco_id: 'l1', companheiro_vinculado: false, companheiro_nome: 'Bia' },
    });
  });

  it('Início, Ajustes, confirmar: termina na entrada', async () => {
    const { tela } = await abrir('/');
    await tocar('Ajustes');
    expect(tela.getPathname()).toBe('/ajustes');

    await tocar('Sair da conta');
    expect(screen.getByText('Sair da conta?')).toBeTruthy();
    await tocar('Sim, sair da conta');

    expect(tela.getPathname()).toBe('/entrada');
    expect(screen.getByText('Quero começar nosso Laço')).toBeTruthy();
  });

  it('cancelar a confirmação mantém a pessoa em Ajustes', async () => {
    const { tela } = await abrir('/ajustes');
    await tocar('Sair da conta');
    await tocar('Cancelar');

    expect(tela.getPathname()).toBe('/ajustes');
    expect(screen.queryByText('Sair da conta?')).toBeNull();
    expect(screen.getByRole('button', { name: 'Sair da conta' })).toBeTruthy();
  });
});
