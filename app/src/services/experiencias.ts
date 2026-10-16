import { ehErroDeRede, falha, type ErroServico, type Falha, type Resultado } from '@/services/laco';
import { SEM_DATA, type Precisao, type ReferenciaTemporal } from '@/services/referencia-temporal';
import { supabase } from '@/services/supabase';

export type Estado = 'desejo' | 'planejamento' | 'vivendo' | 'memoria';

/** A experiência é uma só em todos os estados (lifecycle.md). */
export type Experiencia = {
  id: string;
  titulo: string;
  estado: Estado;
  local: string | null;
  observacoes: string | null;
  referencia: ReferenciaTemporal;
  /** Instante de início calculado pelo servidor (dia, dia e horário, período); nulo nos demais. */
  inicioEm: string | null;
  /** Foto de destaque, compartilhada e escolhida à mão (ADR 012 e 028); nula se ninguém escolheu. */
  fotoDestaque: { id: string; caminho: string } | null;
  criadoEm: string;
  atualizadoEm: string;
};

/** Mantido para as telas de Desejos: um Desejo é uma experiência no estado `desejo`. */
export type Desejo = Experiencia;

export type CamposDaExperiencia = {
  titulo: string;
  local?: string;
  observacoes?: string;
  referencia?: ReferenciaTemporal;
};

type Linha = {
  id: string;
  titulo: string;
  estado: Estado;
  local: string | null;
  observacoes: string | null;
  referencia_precisao: Precisao;
  referencia_inicio: string | null;
  referencia_fim: string | null;
  referencia_horario: string | null;
  inicio_em: string | null;
  foto_destaque_id: string | null;
  foto_destaque: { caminho: string } | null;
  criado_em: string;
  atualizado_em: string;
};

const COLUNAS =
  'id, titulo, estado, local, observacoes, referencia_precisao, referencia_inicio, referencia_fim, ' +
  'referencia_horario, inicio_em, criado_em, atualizado_em, foto_destaque_id, ' +
  // Há duas ligações entre as tabelas; o nome da chave diz qual é a do destaque.
  'foto_destaque:registros!experiencias_foto_destaque_id_fkey(caminho)';

export const paraExperiencia = (l: Linha): Experiencia => ({
  id: l.id,
  titulo: l.titulo,
  estado: l.estado,
  local: l.local,
  observacoes: l.observacoes,
  referencia: {
    precisao: l.referencia_precisao ?? 'sem_data',
    inicio: l.referencia_inicio,
    fim: l.referencia_fim,
    horario: l.referencia_horario ? l.referencia_horario.slice(0, 5) : null,
  },
  inicioEm: l.inicio_em,
  fotoDestaque:
    l.foto_destaque_id && l.foto_destaque ? { id: l.foto_destaque_id, caminho: l.foto_destaque.caminho } : null,
  criadoEm: l.criado_em,
  atualizadoEm: l.atualizado_em ?? l.criado_em,
});

// Texto opcional vazio vira nulo: o banco guarda "sem local", não uma string vazia.
const opcional = (valor: string | undefined) => {
  const limpo = valor?.trim();
  return limpo ? limpo : null;
};

const paraColunas = (campos: CamposDaExperiencia) => {
  const r = campos.referencia ?? SEM_DATA;
  return {
    titulo: campos.titulo.trim(),
    local: opcional(campos.local),
    observacoes: opcional(campos.observacoes),
    referencia_precisao: r.precisao,
    referencia_inicio: r.inicio,
    referencia_fim: r.fim,
    referencia_horario: r.horario,
  };
};

function falhaDoServico(erro: NonNullable<ErroServico>): Falha {
  if (ehErroDeRede(erro)) return falha('rede');
  // 23514: violação de CHECK (título vazio, textos acima do limite, referência incoerente).
  if (erro.code === '23514') return falha('desejo_invalido');
  return falha('desconhecido');
}

/** Todas as experiências do Laço; Início, Desejos e as listas filtram por estado. */
export async function listarExperiencias(): Promise<Resultado<{ experiencias: Experiencia[] }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('experiencias')
      .select(COLUNAS)
      .order('criado_em', { ascending: false });
    if (error) return falhaDoServico(error);
    return { ok: true, experiencias: (data as unknown as Linha[]).map(paraExperiencia) };
  } catch {
    return falha('rede');
  }
}

/** Criar só existe em Desejo (lifecycle.md). */
export async function criarDesejo(campos: CamposDaExperiencia): Promise<Resultado<{ desejo: Experiencia }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('experiencias')
      .insert(paraColunas(campos))
      .select(COLUNAS)
      .single();
    if (error) return falhaDoServico(error);
    return { ok: true, desejo: paraExperiencia(data as unknown as Linha) };
  } catch {
    return falha('rede');
  }
}

export async function atualizarExperiencia(
  id: string,
  campos: CamposDaExperiencia
): Promise<Resultado<{ experiencia: Experiencia }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('experiencias')
      .update(paraColunas(campos))
      .eq('id', id)
      .select(COLUNAS);
    if (error) return falhaDoServico(error);
    // Nenhuma linha: a outra pessoa excluiu.
    if (data.length === 0) return falha('desejo_inexistente');
    return { ok: true, experiencia: paraExperiencia(data[0] as unknown as Linha) };
  } catch {
    return falha('rede');
  }
}

/**
 * Exclusão definitiva, em qualquer estado (ADR 006). Excluir algo que já não existe conta como feito.
 * Fotos: quem chama remove os arquivos antes (ADR 020); ver `excluirExperienciaComFotos`.
 */
export async function excluirExperiencia(id: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { error } = await supabase.from('experiencias').delete().eq('id', id);
    if (error) return falhaDoServico(error);
    return { ok: true };
  } catch {
    return falha('rede');
  }
}

/** Escolhe (ou tira, com nulo) a foto de destaque. Qualquer um dos dois pode; só fotos da própria experiência. */
export async function definirFotoDestaque(
  id: string,
  fotoId: string | null
): Promise<Resultado<{ experiencia: Experiencia }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('experiencias')
      .update({ foto_destaque_id: fotoId })
      .eq('id', id)
      .select(COLUNAS);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('destaque_invalido');
    if (data.length === 0) return falha('desejo_inexistente');
    return { ok: true, experiencia: paraExperiencia(data[0] as unknown as Linha) };
  } catch {
    return falha('rede');
  }
}

/** Transição de estado, validada no servidor (só as do ciclo). */
export async function mudarEstado(id: string, estado: Estado): Promise<Resultado<{ estado: Estado }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.rpc('mudar_estado', { p_experiencia: id, p_estado: estado });
    if (error) return falhaDoServico(error);
    const resposta = data as { ok: boolean; codigo?: string; estado?: Estado };
    if (!resposta.ok) {
      return falha(resposta.codigo === 'experiencia_inexistente' ? 'desejo_inexistente' : (resposta.codigo ?? 'desconhecido'));
    }
    return { ok: true, estado };
  } catch {
    return falha('rede');
  }
}
