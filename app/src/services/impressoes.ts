// Impressão pessoal e momento favorito de cada pessoa numa memória (ADR 005 e 012).
// A regra de privacidade é do banco (RLS): a leitura só traz as linhas da outra pessoa para quem já
// registrou a própria impressão. A tela mostra o que vier; nunca decide sozinha o que pode ver.
import { ehErroDeRede, falha, type Resultado } from '@/services/laco';
import { supabase } from '@/services/supabase';

export type Impressao = {
  membroId: string;
  /** Nulo: ainda não registrou. */
  texto: string | null;
  /** Foto escolhida como momento favorito, com o caminho para exibir. */
  momentoFavorito: { id: string; caminho: string } | null;
};

export const LIMITE_DA_IMPRESSAO = 4000;

type Linha = {
  membro_id: string;
  texto: string | null;
  momento_favorito_id: string | null;
  momento_favorito: { caminho: string } | null;
};

/** As linhas que a pessoa pode ver: sempre a sua (se existir); a da outra, só depois de registrar a sua. */
export async function listarImpressoes(experienciaId: string): Promise<Resultado<{ impressoes: Impressao[] }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('impressoes')
      .select('membro_id, texto, momento_favorito_id, momento_favorito:registros(caminho)')
      .eq('experiencia_id', experienciaId);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return {
      ok: true,
      impressoes: (data as unknown as Linha[]).map((l) => ({
        membroId: l.membro_id,
        texto: l.texto,
        momentoFavorito:
          l.momento_favorito_id && l.momento_favorito
            ? { id: l.momento_favorito_id, caminho: l.momento_favorito.caminho }
            : null,
      })),
    };
  } catch {
    return falha('rede');
  }
}

async function chamar(funcao: string, parametros: Record<string, unknown>): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.rpc(funcao, parametros);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    const resposta = data as { ok: boolean; codigo?: string };
    return resposta.ok ? { ok: true } : falha(resposta.codigo ?? 'desconhecido');
  } catch {
    return falha('rede');
  }
}

/** Escreve ou reescreve a própria impressão; texto vazio a apaga (volta a "não registrada"). */
export function salvarImpressao(experienciaId: string, texto: string): Promise<Resultado> {
  if (texto.trim().length > LIMITE_DA_IMPRESSAO) return Promise.resolve(falha('impressao_longa'));
  return chamar('salvar_minha_impressao', { p_experiencia: experienciaId, p_texto: texto });
}

/** Escolhe (ou tira, com nulo) o próprio momento favorito: uma foto da memória. */
export function escolherMomentoFavorito(experienciaId: string, fotoId: string | null): Promise<Resultado> {
  return chamar('escolher_meu_momento_favorito', { p_experiencia: experienciaId, p_foto: fotoId });
}
