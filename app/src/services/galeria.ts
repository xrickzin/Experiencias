import { Platform } from 'react-native';

type Galeria = typeof import('expo-media-library/legacy');

/**
 * A biblioteca da galeria só é carregada quando usada, e uma falha ao carregá-la não derruba o app:
 * sem ela, as fotos entram do mesmo jeito, só sem a data da galeria. (A interface "legacy" é a que o
 * Expo Go traz.)
 */
function galeria(): Galeria | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-media-library/legacy') as Galeria;
  } catch {
    return null;
  }
}

/**
 * Pede acesso às fotos do aparelho (ADR 033). No Android, o seletor do sistema entrega a imagem sem
 * a data em que foi tirada; com esse acesso, o app lê a data da própria galeria. Sem acesso, segue
 * sem ela (vale o envio, e dá para corrigir na foto aberta).
 */
export async function pedirAcessoAsFotos(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return (await galeria()?.requestPermissionsAsync(false, ['photo']))?.granted ?? false;
  } catch {
    return false;
  }
}

/**
 * Data em que a foto foi tirada, segundo a galeria do Android. O seletor do sistema nomeia o arquivo
 * com o número da imagem na galeria (ex.: `1000331477.jpg`); por ele a imagem é encontrada. Nulo se
 * não achar (foto só na nuvem, nome diferente, sem acesso) ou se a data for absurda.
 */
export async function dataDaGaleria(nomeDoArquivo: string | null | undefined): Promise<string | null> {
  const numero = Platform.OS === 'android' ? nomeDoArquivo?.match(/^(\d+)\.\w+$/)?.[1] : undefined;
  if (!numero) return null;
  try {
    const ms = (await galeria()?.getAssetInfoAsync(numero))?.creationTime;
    if (!ms || ms < Date.UTC(1990, 0, 1) || ms > Date.now() + 86_400_000) return null;
    return new Date(ms).toISOString();
  } catch {
    return null;
  }
}

/** Grava na galeria do aparelho um arquivo já baixado (ADR 033). Pede só a permissão de gravar. */
export async function salvarNaGaleria(arquivoLocal: string): Promise<boolean> {
  const g = galeria();
  if (!g) return false;
  try {
    if (!(await g.requestPermissionsAsync(true)).granted) return false;
    await g.saveToLibraryAsync(arquivoLocal);
    return true;
  } catch {
    return false;
  }
}
