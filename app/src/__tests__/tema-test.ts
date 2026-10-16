import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

import { escolherTema, lerPreferenciaDeTema } from '@/services/tema';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
const loja = jest.mocked(SecureStore);

describe('tema escolhido em Ajustes', () => {
  beforeEach(() => jest.resetAllMocks());

  it('sem escolha guardada (ou valor estranho), é automático', async () => {
    loja.getItemAsync.mockResolvedValue(null);
    expect(await lerPreferenciaDeTema()).toBe('automatico');
    loja.getItemAsync.mockResolvedValue('roxo');
    expect(await lerPreferenciaDeTema()).toBe('automatico');
    loja.getItemAsync.mockRejectedValue(new Error('sem acesso'));
    expect(await lerPreferenciaDeTema()).toBe('automatico');
  });

  it('lê a escolha guardada', async () => {
    loja.getItemAsync.mockResolvedValue('escuro');
    expect(await lerPreferenciaDeTema()).toBe('escuro');
  });

  it('escolher aplica no app e guarda; automático devolve ao tema do sistema', async () => {
    const aplicar = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
    await escolherTema('escuro');
    expect(aplicar).toHaveBeenLastCalledWith('dark');
    expect(loja.setItemAsync).toHaveBeenLastCalledWith('laco.tema', 'escuro');

    await escolherTema('automatico');
    expect(aplicar).toHaveBeenLastCalledWith('unspecified');
    aplicar.mockRestore();
  });
});
