import { ehErroDeRede, falha, type ErroServico, type Falha, type Resultado } from '@/services/laco';
import { SEM_DATA, type Precisao, type ReferenciaTemporal } from '@/services/referencia-temporal';
import type { Tamanho } from '@/services/tamanho';
import { supabase } from '@/services/supabase';

export type Estado = 'desejo' | 'planejamento' | 'vivendo' | 'memoria';

export type { Tamanho } from '@/services/tamanho';

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
  tamanho: Tamanho | null;
  /** Ids das categorias do Laço marcadas nesta experiência. */
  categorias: string[];
  /** "Organizar por roteiro" ligado: a experiência ganha a guia Roteiro (ADR 040). */
  roteiroAtivo: boolean;
  /** Orçamento ligado: a experiência ganha a guia Orçamento (ADR 041). */
  orcamentoAtivo: boolean;
  /** Total estimado do casal, em centavos; nulo sem valor. */
  orcamentoCentavos: number | null;
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
  tamanho?: Tamanho | null;
  /** Ids das categorias; ausente mantém as que já estão. */
  categorias?: string[];
  /** Ao criar: já com "Organizar por roteiro" ligado (ADR 040). Na edição, usa-se `definirRoteiro`. */
  roteiroAtivo?: boolean;
  /** Ao criar: já com o orçamento ligado (ADR 041). Na edição, usa-se `definirOrcamento`. */
  orcamentoAtivo?: boolean;
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
  tamanho: Tamanho | null;
  categorias: { categoria_id: string }[] | null;
  roteiro_ativo: boolean | null;
  orcamento_ativo: boolean | null;
  orcamento_centavos: number | null;
  criado_em: string;
  atualizado_em: string;
};

const COLUNAS =
  'id, titulo, estado, local, observacoes, referencia_precisao, referencia_inicio, referencia_fim, ' +
  'referencia_horario, inicio_em, criado_em, atualizado_em, foto_destaque_id, tamanho, roteiro_ativo, orcamento_ativo, orcamento_centavos, ' +
  'categorias:experiencia_categorias(categoria_id), ' +
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
  tamanho: l.tamanho ?? null,
  categorias: (l.categorias ?? []).map((c) => c.categoria_id),
  roteiroAtivo: l.roteiro_ativo ?? false,
  orcamentoAtivo: l.orcamento_ativo ?? false,
  orcamentoCentavos: l.orcamento_centavos ?? null,
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
    tamanho: campos.tamanho ?? null,
    ...(campos.roteiroAtivo === undefined ? {} : { roteiro_ativo: campos.roteiroAtivo }),
    ...(campos.orcamentoAtivo === undefined ? {} : { orcamento_ativo: campos.orcamentoAtivo }),
  };
};

/**
 * Deixa a experiência com exatamente estas categorias: tira as que saíram e marca as novas.
 * Ausente (`undefined`) não mexe. Devolve as categorias que ficaram.
 */
async function definirCategorias(experienciaId: string, ids: string[] | undefined, atuais: string[]) {
  if (!supabase || ids === undefined) return atuais;
  const sair = atuais.filter((id) => !ids.includes(id));
  const entrar = ids.filter((id) => !atuais.includes(id));
  if (sair.length) {
    const { error } = await supabase
      .from('experiencia_categorias')
      .delete()
      .eq('experiencia_id', experienciaId)
      .in('categoria_id', sair);
    if (error) throw error;
  }
  if (!entrar.length) return ids;
  // Uma categoria pode ter sido excluída com o formulário aberto (aqui ou pela outra pessoa): só liga as que existem.
  const { data, error: erroLeitura } = await supabase.from('categorias').select('id').in('id', entrar);
  if (erroLeitura) throw erroLeitura;
  const existem = (data ?? []).map((c: { id: string }) => c.id);
  if (existem.length) {
    const { error } = await supabase
      .from('experiencia_categorias')
      .insert(existem.map((categoria_id) => ({ experiencia_id: experienciaId, categoria_id })));
    if (error) throw error;
  }
  return ids.filter((id) => !entrar.includes(id) || existem.includes(id));
}

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
    const desejo = paraExperiencia(data as unknown as Linha);
    try {
      desejo.categorias = await definirCategorias(desejo.id, campos.categorias, []);
    } catch (e) {
      return falhaDoServico(e as NonNullable<ErroServico>);
    }
    return { ok: true, desejo };
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
    const experiencia = paraExperiencia(data[0] as unknown as Linha);
    try {
      experiencia.categorias = await definirCategorias(id, campos.categorias, experiencia.categorias);
    } catch (e) {
      return falhaDoServico(e as NonNullable<ErroServico>);
    }
    return { ok: true, experiencia };
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

/** Muda só as colunas indicadas e devolve a experiência como ficou. */
async function atualizarParte(
  id: string,
  valores: Record<string, unknown>,
  falhou: (erro: NonNullable<ErroServico>) => Falha = falhaDoServico
): Promise<Resultado<{ experiencia: Experiencia }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.from('experiencias').update(valores).eq('id', id).select(COLUNAS);
    if (error) return falhou(error);
    if (data.length === 0) return falha('desejo_inexistente');
    return { ok: true, experiencia: paraExperiencia(data[0] as unknown as Linha) };
  } catch {
    return falha('rede');
  }
}

/** Liga ou desliga "Organizar por roteiro" na hora (ADR 040). Desligar exclui o roteiro, no servidor. */
export const definirRoteiro = (id: string, ativo: boolean) => atualizarParte(id, { roteiro_ativo: ativo });

/** Liga ou desliga o orçamento na hora (ADR 041). Desligar apaga o valor, no servidor. */
export const definirOrcamentoAtivo = (id: string, ativo: boolean) => atualizarParte(id, { orcamento_ativo: ativo });

/** O total estimado, em centavos (nulo tira o valor). Acima do limite, ou com o orçamento desligado, o servidor recusa. */
export const definirOrcamento = (id: string, centavos: number | null) =>
  atualizarParte(id, { orcamento_centavos: centavos }, (erro) =>
    ehErroDeRede(erro) ? falha('rede') : falha(erro.code === '23514' ? 'orcamento_invalido' : 'orcamento_nao_salvo')
  )

/**
 * Algo vivido antes do aplicativo (ADR 008): nasce em Memória e exige título e referência temporal.
 * O servidor também recusa memória sem data.
 */
export async function registrarMemoria(campos: CamposDaExperiencia): Promise<Resultado<{ memoria: Experiencia }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('experiencias')
      .insert({ ...paraColunas(campos), estado: 'memoria' })
      .select(COLUNAS)
      .single();
    if (error) {
      if (ehErroDeRede(error)) return falha('rede');
      return falha(error.code === '23514' ? 'memoria_invalida' : 'desconhecido');
    }
    const memoria = paraExperiencia(data as unknown as Linha);
    try {
      memoria.categorias = await definirCategorias(memoria.id, campos.categorias, []);
    } catch (e) {
      return falhaDoServico(e as NonNullable<ErroServico>);
    }
    return { ok: true, memoria };
  } catch {
    return falha('rede');
  }
}

/**
 * Vivendo → Memória, sem volta. Sem data, a referência informada vai junto; se a outra pessoa
 * definiu uma antes, vale a dela (o primeiro a definir fixa) e quem chama relê a experiência.
 */
export async function finalizarExperiencia(id: string, referencia: ReferenciaTemporal | null): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.rpc('finalizar_experiencia', {
      p_experiencia: id,
      ...(referencia
        ? {
            p_precisao: referencia.precisao,
            p_inicio: referencia.inicio,
            p_fim: referencia.fim,
            p_horario: referencia.horario,
          }
        : {}),
    });
    if (error) return falhaDoServico(error);
    const resposta = data as { ok: boolean; codigo?: string };
    if (!resposta.ok) {
      return falha(resposta.codigo === 'experiencia_inexistente' ? 'desejo_inexistente' : (resposta.codigo ?? 'desconhecido'));
    }
    return { ok: true };
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
