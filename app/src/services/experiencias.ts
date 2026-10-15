import { ehErroDeRede, falha, type ErroServico, type Falha, type Resultado } from '@/services/laco';
import { supabase } from '@/services/supabase';

/** Experiência no estado Desejo. Referência temporal e demais estados chegam nas próximas fases. */
export type Desejo = {
  id: string;
  titulo: string;
  local: string | null;
  observacoes: string | null;
  criadoEm: string;
};

export type CamposDoDesejo = {
  titulo: string;
  local?: string;
  observacoes?: string;
};

type Linha = {
  id: string;
  titulo: string;
  local: string | null;
  observacoes: string | null;
  criado_em: string;
};

const COLUNAS = 'id, titulo, local, observacoes, criado_em';

const paraDesejo = (l: Linha): Desejo => ({
  id: l.id,
  titulo: l.titulo,
  local: l.local,
  observacoes: l.observacoes,
  criadoEm: l.criado_em,
});

// Texto opcional vazio vira nulo: o banco guarda "sem local", não uma string vazia.
const opcional = (valor: string | undefined) => {
  const limpo = valor?.trim();
  return limpo ? limpo : null;
};

function falhaDoServico(erro: NonNullable<ErroServico>): Falha {
  if (ehErroDeRede(erro)) return falha('rede');
  // 23514: violação de CHECK (título vazio ou textos acima do limite).
  if (erro.code === '23514') return falha('desejo_invalido');
  return falha('desconhecido');
}

export async function listarDesejos(): Promise<Resultado<{ desejos: Desejo[] }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('experiencias')
      .select(COLUNAS)
      .eq('estado', 'desejo')
      .order('criado_em', { ascending: false });
    if (error) return falhaDoServico(error);
    return { ok: true, desejos: (data as Linha[]).map(paraDesejo) };
  } catch {
    return falha('rede');
  }
}

export async function criarDesejo(campos: CamposDoDesejo): Promise<Resultado<{ desejo: Desejo }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('experiencias')
      .insert({
        titulo: campos.titulo.trim(),
        local: opcional(campos.local),
        observacoes: opcional(campos.observacoes),
      })
      .select(COLUNAS)
      .single();
    if (error) return falhaDoServico(error);
    return { ok: true, desejo: paraDesejo(data as Linha) };
  } catch {
    return falha('rede');
  }
}

export async function atualizarDesejo(
  id: string,
  campos: CamposDoDesejo
): Promise<Resultado<{ desejo: Desejo }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('experiencias')
      .update({
        titulo: campos.titulo.trim(),
        local: opcional(campos.local),
        observacoes: opcional(campos.observacoes),
      })
      .eq('id', id)
      .eq('estado', 'desejo')
      .select(COLUNAS);
    if (error) return falhaDoServico(error);
    // Nenhuma linha: a outra pessoa excluiu (ou o desejo já avançou de estado).
    if (data.length === 0) return falha('desejo_inexistente');
    return { ok: true, desejo: paraDesejo(data[0] as Linha) };
  } catch {
    return falha('rede');
  }
}

/** Exclusão definitiva (ADR 006). Excluir algo que já não existe conta como feito. */
export async function excluirDesejo(id: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { error } = await supabase.from('experiencias').delete().eq('id', id).eq('estado', 'desejo');
    if (error) return falhaDoServico(error);
    return { ok: true };
  } catch {
    return falha('rede');
  }
}
