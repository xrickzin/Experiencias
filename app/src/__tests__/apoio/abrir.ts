import { act, renderRouter } from 'expo-router/testing-library';

// Caminho relativo à pasta de onde o Jest roda (app/).
const APP = 'src/app';

/** Abre o app real (as rotas de `src/app`) num endereço. */
export async function abrir(initialUrl: string) {
  const tela = await renderRouter(APP, { initialUrl });
  await esperar();
  return { tela };
}

/** O `renderRouter` liga temporizadores falsos; trocas de rota só se completam ao avançá-los. */
export async function esperar() {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
}
