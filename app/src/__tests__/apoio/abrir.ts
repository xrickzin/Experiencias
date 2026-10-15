import { act, renderRouter } from 'expo-router/testing-library';

// Caminho relativo à pasta de onde o Jest roda (app/).
const APP = 'src/app';

/**
 * Abre o app real (as rotas de `src/app`) num endereço. No SDK 57 o `renderRouter` devolve a promessa
 * do `render` (RNTL 14) com `getPathname` pendurado nela; o resultado já resolvido não o tem,
 * por isso ele volta embrulhado.
 */
export async function abrir(initialUrl: string) {
  const tela = renderRouter(APP, { initialUrl });
  await tela;
  await esperar();
  return { tela };
}

/** O `renderRouter` liga temporizadores falsos; trocas de rota só se completam ao avançá-los. */
export async function esperar() {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
}
