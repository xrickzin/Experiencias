// Categorias do Laço (ADR 038): a lista pronta e as que o casal criar. Uma experiência pode ter várias.
import { ehErroDeRede, falha, type Resultado } from '@/services/laco';
import { supabase } from '@/services/supabase';

export type Categoria = { id: string; nome: string };

export const LIMITE_DO_NOME_DA_CATEGORIA = 40;

/** As categorias do Laço, em ordem alfabética. */
export async function listarCategorias(): Promise<Resultado<{ categorias: Categoria[] }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.from('categorias').select('id, nome').order('nome');
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return { ok: true, categorias: data as Categoria[] };
  } catch {
    return falha('rede');
  }
}

/** Cria uma categoria nova para o Laço. O mesmo nome (sem diferenciar maiúsculas) não se repete. */
export async function criarCategoria(nome: string): Promise<Resultado<{ categoria: Categoria }>> {
  if (!supabase) return falha('sem_configuracao');
  const limpo = nome.trim();
  if (!limpo) return falha('categoria_vazia');
  if (limpo.length > LIMITE_DO_NOME_DA_CATEGORIA) return falha('categoria_longa');
  try {
    const { data, error } = await supabase.from('categorias').insert({ nome: limpo }).select('id, nome').single();
    if (error) {
      if (ehErroDeRede(error)) return falha('rede');
      // 23505: já existe uma categoria com esse nome no Laço.
      return falha(error.code === '23505' ? 'categoria_repetida' : 'desconhecido');
    }
    return { ok: true, categoria: data as Categoria };
  } catch {
    return falha('rede');
  }
}

/** Renomeia uma categoria do Laço. Vale para todas as experiências que a usam. */
export async function renomearCategoria(id: string, nome: string): Promise<Resultado<{ categoria: Categoria }>> {
  if (!supabase) return falha('sem_configuracao');
  const limpo = nome.trim();
  if (!limpo) return falha('categoria_vazia');
  if (limpo.length > LIMITE_DO_NOME_DA_CATEGORIA) return falha('categoria_longa');
  try {
    const { data, error } = await supabase.from('categorias').update({ nome: limpo }).eq('id', id).select('id, nome');
    if (error) {
      if (ehErroDeRede(error)) return falha('rede');
      return falha(error.code === '23505' ? 'categoria_repetida' : 'desconhecido');
    }
    if (data.length === 0) return falha('categoria_inexistente');
    return { ok: true, categoria: data[0] as Categoria };
  } catch {
    return falha('rede');
  }
}

/** Exclui a categoria. Ela sai das experiências; as experiências continuam. Já excluída conta como feito. */
export async function excluirCategoria(id: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return { ok: true };
  } catch {
    return falha('rede');
  }
}
