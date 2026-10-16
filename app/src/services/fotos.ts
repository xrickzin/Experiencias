// Fotos das experiências (registros do tipo foto) no Storage privado do Supabase.
// Caminho `{laco}/{experiencia}/{arquivo}`; acesso por URL assinada de curta duração (ADR 020).
// Ordem nas exclusões: primeiro o arquivo, depois a linha; se o arquivo falhar, nada é dado como excluído.
import { ehErroDeRede, falha, type Falha, type Resultado } from '@/services/laco';
import { supabase } from '@/services/supabase';

export type Foto = {
  id: string;
  caminho: string;
  /** URL assinada para exibir; nula se não foi possível gerá-la agora. */
  url: string | null;
  autorId: string | null;
  /** Quando a foto foi tirada (da própria foto); nulo se o aparelho não informou. */
  capturadaEm: string | null;
  criadoEm: string;
};

export type ArquivoDeFoto = { base64: string; mimeType?: string | null; capturadaEm?: string | null };

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

type Linha = { id: string; caminho: string; autor_id: string | null; capturada_em: string | null; criado_em: string };

const COLUNAS = 'id, caminho, autor_id, capturada_em, criado_em';

const paraFoto = (l: Linha, url: string | null): Foto => ({
  id: l.id,
  caminho: l.caminho,
  url,
  autorId: l.autor_id,
  capturadaEm: l.capturada_em,
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

    const assinadas = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(
        linhas.map((l) => l.caminho),
        VALIDADE_DA_URL_S
      );
    const urls = new Map((assinadas.data ?? []).map((a) => [a.path, a.signedUrl ?? null]));
    return {
      ok: true,
      fotos: linhas.map((l) => paraFoto(l, urls.get(l.caminho) ?? null)),
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
      await supabase.storage.from(BUCKET).remove([caminho]);
      return ehErroDeRede(error) ? falha('rede') : falha('foto_nao_enviada');
    }

    const assinada = await supabase.storage.from(BUCKET).createSignedUrl(caminho, VALIDADE_DA_URL_S);
    return { ok: true, foto: paraFoto(data as Linha, assinada.data?.signedUrl ?? null) };
  } catch {
    return falha('rede');
  }
}

export async function excluirFoto(foto: Pick<Foto, 'id' | 'caminho'>): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const arquivo = await supabase.storage.from(BUCKET).remove([foto.caminho]);
    if (arquivo.error) return falhaDoStorage(arquivo.error, 'foto_nao_removida');
    const { error } = await supabase.from('registros').delete().eq('id', foto.id);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('foto_nao_removida');
    return { ok: true };
  } catch {
    return falha('rede');
  }
}

/** URLs assinadas para caminhos já conhecidos (ex.: a foto de destaque no Início). */
export async function assinarCaminhos(caminhos: string[]): Promise<Map<string, string>> {
  if (!supabase || caminhos.length === 0) return new Map();
  try {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(caminhos, VALIDADE_DA_URL_S);
    const urls = new Map<string, string>();
    for (const a of data ?? []) if (a.path && a.signedUrl) urls.set(a.path, a.signedUrl);
    return urls;
  } catch {
    return new Map();
  }
}

/** Antes de excluir uma experiência: apaga os arquivos dela. Se falhar, a exclusão não deve seguir. */
export async function removerFotosDaExperiencia(experienciaId: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.from('registros').select('caminho').eq('experiencia_id', experienciaId);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('fotos_nao_removidas');
    const caminhos = (data as { caminho: string }[]).map((l) => l.caminho);
    if (caminhos.length === 0) return { ok: true };
    const remocao = await supabase.storage.from(BUCKET).remove(caminhos);
    if (remocao.error) return falhaDoStorage(remocao.error, 'fotos_nao_removidas');
    return { ok: true };
  } catch {
    return falha('rede');
  }
}
