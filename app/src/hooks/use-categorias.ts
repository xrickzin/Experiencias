import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  criarCategoria,
  excluirCategoria,
  listarCategorias,
  renomearCategoria,
  type Categoria,
} from '@/services/categorias';

const emOrdem = (lista: Categoria[]) => [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

/**
 * As categorias do Laço, relidas sempre que a tela volta ao foco (podem ter mudado em Ajustes ou no
 * aparelho da outra pessoa), e as ações de criar, renomear e excluir, que já atualizam a lista.
 */
export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      void listarCategorias().then((r) => {
        if (ativo && r?.ok) setCategorias(r.categorias);
      });
      return () => {
        ativo = false;
      };
    }, [])
  );

  const criar = useCallback(async (nome: string) => {
    const r = await criarCategoria(nome);
    if (r.ok) setCategorias((atuais) => emOrdem([...atuais, r.categoria]));
    return r;
  }, []);

  const renomear = useCallback(async (id: string, nome: string) => {
    const r = await renomearCategoria(id, nome);
    if (r.ok) setCategorias((atuais) => emOrdem(atuais.map((c) => (c.id === id ? r.categoria : c))));
    return r;
  }, []);

  const excluir = useCallback(async (id: string) => {
    const r = await excluirCategoria(id);
    if (r.ok) setCategorias((atuais) => atuais.filter((c) => c.id !== id));
    return r;
  }, []);

  return { categorias, criar, renomear, excluir };
}
