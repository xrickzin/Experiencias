import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

/** Tema escolhido em Ajustes (ADR 037). "automatico" segue o tema do celular. */
export type PreferenciaDeTema = 'automatico' | 'claro' | 'escuro';

const CHAVE = 'laco.tema';
const ESQUEMA = { automatico: 'unspecified', claro: 'light', escuro: 'dark' } as const;

/** Faz o app inteiro usar o tema escolhido (as telas leem pelo `useColorScheme`). */
export function aplicarTema(preferencia: PreferenciaDeTema) {
  Appearance.setColorScheme(ESQUEMA[preferencia]);
}

/** A escolha guardada neste aparelho; sem escolha (ou se não der para ler), automático. */
export async function lerPreferenciaDeTema(): Promise<PreferenciaDeTema> {
  try {
    const valor = await SecureStore.getItemAsync(CHAVE);
    return valor === 'claro' || valor === 'escuro' ? valor : 'automatico';
  } catch {
    return 'automatico';
  }
}

/** Aplica já e guarda para as próximas aberturas. Se não der para guardar, vale até fechar o app. */
export async function escolherTema(preferencia: PreferenciaDeTema) {
  aplicarTema(preferencia);
  try {
    await SecureStore.setItemAsync(CHAVE, preferencia);
  } catch {
    // Sem guardar, o tema vale nesta abertura; na próxima, volta ao automático.
  }
}
