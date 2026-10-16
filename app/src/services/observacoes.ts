// Observações simples: registros de texto de uma experiência (ADR 010 e 029), ao lado das fotos.
// Os dois escrevem, editam e excluem; o autor é definido pelo servidor e preservado na edição.
import { ehErroDeRede, falha, type ErroServico, type Falha, type Resultado } from '@/services/laco';
import { supabase } from '@/services/supabase';

export type Observacao = {
  id: string;
  texto: string;
  autorId: string | null;
  /** Momento a que a observação se refere (dia e período); nulo nas antigas: vale quando foi escrita. */
  capturadaEm: string | null;
  criadoEm: string;
};

export const LIMITE_DA_OBSERVACAO = 2000;

type Linha = { id: string; texto: string; autor_id: string | null; capturada_em: string | null; criado_em: string };
const COLUNAS = 'id, texto, autor_id, capturada_em, criado_em';

const paraObservacao = (l: Linha): Observacao => ({
  id: l.id,
  texto: l.texto,
  autorId: l.autor_id,
  capturadaEm: l.capturada_em,
  criadoEm: l.criado_em,
});

function falhaDaObservacao(erro: NonNullable<ErroServico>): Falha {
  if (ehErroDeRede(erro)) return falha('rede');
  // 23514: texto vazio ou longo demais.
  return falha(erro.code === '23514' ? 'observacao_invalida' : 'observacao_nao_salva');
}

export async function listarObservacoes(experienciaId: string): Promise<Resultado<{ observacoes: Observacao[] }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('registros')
      .select(COLUNAS)
      .eq('experiencia_id', experienciaId)
      .eq('tipo', 'observacao')
      .order('criado_em', { ascending: true });
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return { ok: true, observacoes: (data as Linha[]).map(paraObservacao) };
  } catch {
    return falha('rede');
  }
}

/** `momentoEm`: o instante do dia e período escolhidos (ver `instanteDoMomento`). */
export async function criarObservacao(
  experienciaId: string,
  texto: string,
  momentoEm: string
): Promise<Resultado<{ observacao: Observacao }>> {
  if (!supabase) return falha('sem_configuracao');
  const limpo = texto.trim();
  if (!limpo || limpo.length > LIMITE_DA_OBSERVACAO) return falha('observacao_invalida');
  try {
    const { data, error } = await supabase
      .from('registros')
      .insert({ experiencia_id: experienciaId, tipo: 'observacao', texto: limpo, capturada_em: momentoEm })
      .select(COLUNAS)
      .single();
    if (error) return falhaDaObservacao(error);
    return { ok: true, observacao: paraObservacao(data as Linha) };
  } catch {
    return falha('rede');
  }
}

export async function editarObservacao(
  id: string,
  texto: string,
  momentoEm: string
): Promise<Resultado<{ observacao: Observacao }>> {
  if (!supabase) return falha('sem_configuracao');
  const limpo = texto.trim();
  if (!limpo || limpo.length > LIMITE_DA_OBSERVACAO) return falha('observacao_invalida');
  try {
    const { data, error } = await supabase
      .from('registros')
      .update({ texto: limpo, capturada_em: momentoEm })
      .eq('id', id)
      .select(COLUNAS);
    if (error) return falhaDaObservacao(error);
    // Nenhuma linha: a outra pessoa excluiu.
    if (data.length === 0) return falha('observacao_inexistente');
    return { ok: true, observacao: paraObservacao(data[0] as Linha) };
  } catch {
    return falha('rede');
  }
}

/** Excluir algo que já não existe conta como feito. */
export async function excluirObservacao(id: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { error } = await supabase.from('registros').delete().eq('id', id);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return { ok: true };
  } catch {
    return falha('rede');
  }
}
