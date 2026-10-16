// Fotos das experiências (registros do tipo foto) no Storage privado do Supabase.
// Caminho `{laco}/{experiencia}/{arquivo}`; acesso por URL assinada de curta duração (ADR 020).
// Ordem nas exclusões: primeiro o arquivo, depois a linha; se o arquivo falhar, nada é dado como excluído.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { salvarNaGaleria } from '@/services/galeria';
import { caminhoDaMiniatura } from '@/services/miniatura';
import { ehErroDeRede, falha, type Falha, type Resultado } from '@/services/laco';
import { supabase } from '@/services/supabase';

export type Foto = {
  id: string;
  caminho: string;
  /** URL assinada da foto inteira (para abrir); nula se não foi possível gerá-la agora. */
  url: string | null;
  /** URL assinada da miniatura (para listas); nula se a foto não tem miniatura (fotos antigas). */
  miniatura: string | null;
  autorId: string | null;
  /** Quando a foto foi tirada (da própria foto); nulo se o aparelho não informou. */
  capturadaEm: string | null;
  /** Texto curto opcional, dos dois (ADR 030). */
  legenda: string | null;
  criadoEm: string;
};

export type ArquivoDeFoto = {
  base64: string;
  mimeType?: string | null;
  capturadaEm?: string | null;
  /** Miniatura em JPEG (base64) gerada no aparelho; sem ela, as listas usam a foto inteira. */
  miniatura?: string | null;
};

const BUCKET = 'experiencias';
const VALIDADE_DA_URL_S = 60 * 60;

const EXTENSOES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/** Nome único e seguro para o arquivo (só letras, números, ponto e hífen). */
export function nomeDeArquivo(mimeType: string, agora = Date.now(), aleatorio = Math.random): string {
  const extensao = EXTENSOES[mimeType] ?? 'jpg';
  const sorteio = Math.floor(aleatorio() * 2 ** 40).toString(36);
  return `${agora.toString(36)}-${sorteio}.${extensao}`;
}

/** Base64 da câmera/galeria para os bytes que o Storage recebe. */
export function base64ParaBytes(base64: string): Uint8Array {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

type ErroDoStorage = { message?: string; name?: string; status?: number; statusCode?: string } | null;

function falhaDoStorage(erro: NonNullable<ErroDoStorage>, codigo: string): Falha {
  if (ehErroDeRede(erro)) return falha('rede');
  if (erro.statusCode === '413' || /too large|payload/i.test(erro.message ?? '')) return falha('foto_grande');
  return falha(codigo);
}

type Linha = {
  id: string;
  caminho: string;
  autor_id: string | null;
  capturada_em: string | null;
  legenda: string | null;
  criado_em: string;
};

const COLUNAS = 'id, caminho, autor_id, capturada_em, legenda, criado_em';

export const LIMITE_DA_LEGENDA = 300;

const paraFoto = (l: Linha, url: string | null, miniatura: string | null): Foto => ({
  id: l.id,
  caminho: l.caminho,
  url,
  miniatura,
  autorId: l.autor_id,
  capturadaEm: l.capturada_em,
  legenda: l.legenda,
  criadoEm: l.criado_em,
});

export async function listarFotos(experienciaId: string): Promise<Resultado<{ fotos: Foto[] }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('registros')
      .select(COLUNAS)
      .eq('experiencia_id', experienciaId)
      .eq('tipo', 'foto')
      .order('criado_em', { ascending: true });
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    const linhas = data as Linha[];
    if (linhas.length === 0) return { ok: true, fotos: [] };

    // Foto e miniatura numa só chamada; a miniatura que não existe (fotos antigas) volta sem URL.
    const assinadas = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(
        linhas.flatMap((l) => [l.caminho, caminhoDaMiniatura(l.caminho)]),
        VALIDADE_DA_URL_S
      );
    const urls = new Map((assinadas.data ?? []).map((a) => [a.path, a.signedUrl ?? null]));
    return {
      ok: true,
      fotos: linhas.map((l) =>
        paraFoto(l, urls.get(l.caminho) ?? null, urls.get(caminhoDaMiniatura(l.caminho)) ?? null)
      ),
    };
  } catch {
    return falha('rede');
  }
}

/** Envia o arquivo e só então cria o registro; se o registro falhar, o arquivo enviado é apagado. */
export async function enviarFoto(
  lacoId: string,
  experienciaId: string,
  arquivo: ArquivoDeFoto
): Promise<Resultado<{ foto: Foto }>> {
  if (!supabase) return falha('sem_configuracao');
  const mimeType = arquivo.mimeType && EXTENSOES[arquivo.mimeType] ? arquivo.mimeType : 'image/jpeg';
  const caminho = `${lacoId}/${experienciaId}/${nomeDeArquivo(mimeType)}`;
  try {
    const envio = await supabase.storage
      .from(BUCKET)
      .upload(caminho, base64ParaBytes(arquivo.base64), { contentType: mimeType, upsert: false });
    if (envio.error) return falhaDoStorage(envio.error, 'foto_nao_enviada');
    // A miniatura é um extra: se não subir, a foto entra do mesmo jeito (as listas usam a inteira).
    const miniatura = arquivo.miniatura
      ? !(
          await supabase.storage
            .from(BUCKET)
            .upload(caminhoDaMiniatura(caminho), base64ParaBytes(arquivo.miniatura), {
              contentType: 'image/jpeg',
              upsert: false,
            })
        ).error
      : false;

    const { data, error } = await supabase
      .from('registros')
      .insert({
        experiencia_id: experienciaId,
        caminho,
        ...(arquivo.capturadaEm ? { capturada_em: arquivo.capturadaEm } : {}),
      })
      .select(COLUNAS)
      .single();
    if (error) {
      await supabase.storage.from(BUCKET).remove([caminho, caminhoDaMiniatura(caminho)]);
      return ehErroDeRede(error) ? falha('rede') : falha('foto_nao_enviada');
    }

    const assinadas = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(miniatura ? [caminho, caminhoDaMiniatura(caminho)] : [caminho], VALIDADE_DA_URL_S);
    const [inteira, pequena] = (assinadas.data ?? []).map((a) => a.signedUrl ?? null);
    return { ok: true, foto: paraFoto(data as Linha, inteira ?? null, pequena ?? null) };
  } catch {
    return falha('rede');
  }
}

export async function excluirFoto(foto: Pick<Foto, 'id' | 'caminho'>): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const arquivo = await supabase.storage.from(BUCKET).remove([foto.caminho, caminhoDaMiniatura(foto.caminho)]);
    if (arquivo.error) return falhaDoStorage(arquivo.error, 'foto_nao_removida');
    const { error } = await supabase.from('registros').delete().eq('id', foto.id);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('foto_nao_removida');
    return { ok: true };
  } catch {
    return falha('rede');
  }
}

/** Escreve, troca ou tira (vazio) a legenda de uma foto. Os dois podem. */
export async function legendarFoto(id: string, legenda: string): Promise<Resultado<{ legenda: string | null }>> {
  if (!supabase) return falha('sem_configuracao');
  const limpa = legenda.trim() || null;
  if (limpa && limpa.length > LIMITE_DA_LEGENDA) return falha('legenda_longa');
  try {
    const { data, error } = await supabase.from('registros').update({ legenda: limpa }).eq('id', id).select('legenda');
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('legenda_nao_salva');
    if (data.length === 0) return falha('foto_inexistente');
    return { ok: true, legenda: limpa };
  } catch {
    return falha('rede');
  }
}

/**
 * Quando a foto foi tirada, escolhido à mão (dia e período): corrige a data quando a galeria não a
 * informa ou ela está errada (ex.: recebida pelo WhatsApp dias depois). Os dois podem.
 */
export async function datarFoto(id: string, capturadaEm: string): Promise<Resultado<{ capturadaEm: string }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.from('registros').update({ capturada_em: capturadaEm }).eq('id', id).select('id');
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('data_nao_salva');
    if (data.length === 0) return falha('foto_inexistente');
    return { ok: true, capturadaEm };
  } catch {
    return falha('rede');
  }
}

/** Baixa a foto para o cache do app, para compartilhar ou salvar. */
async function baixar(foto: Foto): Promise<string | null> {
  if (!foto.url) return null;
  const destino = new File(Paths.cache, `laco-${foto.id}.jpg`);
  return (await File.downloadFileAsync(foto.url, destino, { idempotent: true })).uri;
}

/** Compartilhar a foto (ADR 033): abre as opções do aparelho para enviá-la a alguém. */
export async function compartilharFoto(foto: Foto): Promise<Resultado> {
  try {
    if (!(await Sharing.isAvailableAsync())) return falha('compartilhar');
    const arquivo = await baixar(foto);
    if (!arquivo) return falha('compartilhar');
    await Sharing.shareAsync(arquivo, { mimeType: 'image/jpeg', dialogTitle: 'Compartilhar a foto' });
    return { ok: true };
  } catch {
    return falha('compartilhar');
  }
}

/**
 * Salvar a foto na galeria do aparelho (ADR 033). A tela de compartilhar do Android não costuma
 * oferecer essa opção, por isso ela é uma ação própria.
 */
export async function salvarFoto(foto: Foto): Promise<Resultado> {
  try {
    const arquivo = await baixar(foto);
    if (!arquivo || !(await salvarNaGaleria(arquivo))) return falha('salvar');
    return { ok: true };
  } catch {
    return falha('salvar');
  }
}

/**
 * URLs para mostrar fotos já conhecidas em listas e capas (destaque, favorito, Nossa História): a
 * miniatura quando existe, senão a foto inteira (fotos de antes das miniaturas).
 */
export async function assinarCaminhos(caminhos: string[]): Promise<Map<string, string>> {
  if (!supabase || caminhos.length === 0) return new Map();
  try {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(caminhos.flatMap((c) => [caminhoDaMiniatura(c), c]), VALIDADE_DA_URL_S);
    const assinadas = new Map((data ?? []).map((a) => [a.path, a.signedUrl]));
    const urls = new Map<string, string>();
    for (const c of caminhos) {
      const url = assinadas.get(caminhoDaMiniatura(c)) ?? assinadas.get(c);
      if (url) urls.set(c, url);
    }
    return urls;
  } catch {
    return new Map();
  }
}

/** Antes de excluir uma experiência: apaga os arquivos dela. Se falhar, a exclusão não deve seguir. */
export async function removerFotosDaExperiencia(experienciaId: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('registros')
      .select('caminho')
      .eq('experiencia_id', experienciaId)
      .eq('tipo', 'foto');
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('fotos_nao_removidas');
    const caminhos = (data as { caminho: string }[]).map((l) => l.caminho);
    if (caminhos.length === 0) return { ok: true };
    const remocao = await supabase.storage.from(BUCKET).remove(caminhos.flatMap((c) => [c, caminhoDaMiniatura(c)]));
    if (remocao.error) return falhaDoStorage(remocao.error, 'fotos_nao_removidas');
    return { ok: true };
  } catch {
    return falha('rede');
  }
}
