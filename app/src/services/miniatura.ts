// Tamanhos de cada foto, gerados no aparelho na hora do envio (ADR 034 e 035):
// - a foto inteira, reduzida a 2560 px no lado maior: nítida no celular, com folga para zoom, a uma
//   fração do tamanho do original;
// - a miniatura, a 1080 px: o que as listas mostram (grade de Momentos, Nossa História, Início).

/** Lado maior da foto guardada. */
export const LADO_DA_FOTO = 2560;
const QUALIDADE_DA_FOTO = 0.85;
/** Lado maior da miniatura: nítida em capas de largura inteira, sem peso de foto inteira. */
export const LADO_DA_MINIATURA = 1080;
const QUALIDADE_DA_MINIATURA = 0.7;

type Manipulador = typeof import('expo-image-manipulator');

/** Carregada só quando usada; se faltar, a foto segue como o seletor a entregou. */
function manipulador(): Manipulador | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-image-manipulator') as Manipulador;
  } catch {
    return null;
  }
}

/** Onde fica a miniatura de uma foto: ao lado dela, com `.mini.jpg` no lugar da extensão. */
export const caminhoDaMiniatura = (caminho: string) => caminho.replace(/\.[^./]+$/, '') + '.mini.jpg';

/**
 * JPEG em base64 de uma imagem do aparelho, reduzida só se o lado maior passar do limite (nunca
 * amplia). Nulo se não der: quem chama segue com o que já tem.
 */
async function reduzir(uri: string, largura: number, altura: number, lado: number, qualidade: number) {
  const m = manipulador();
  if (!m) return null;
  try {
    let contexto = m.ImageManipulator.manipulate(uri);
    if (Math.max(largura, altura) > lado) {
      contexto = contexto.resize(largura >= altura ? { width: lado } : { height: lado });
    }
    const imagem = await contexto.renderAsync();
    const salva = await imagem.saveAsync({ format: m.SaveFormat.JPEG, compress: qualidade, base64: true });
    return salva.base64 ?? null;
  } catch {
    return null;
  }
}

/** A foto que vai para o Laço: até 2560 px, JPEG 0,85 (ADR 035). */
export const reduzirFoto = (uri: string, largura: number, altura: number) =>
  reduzir(uri, largura, altura, LADO_DA_FOTO, QUALIDADE_DA_FOTO);

/** A miniatura das listas: até 1080 px, JPEG 0,7 (ADR 034). */
export const gerarMiniatura = (uri: string, largura: number, altura: number) =>
  reduzir(uri, largura, altura, LADO_DA_MINIATURA, QUALIDADE_DA_MINIATURA);
