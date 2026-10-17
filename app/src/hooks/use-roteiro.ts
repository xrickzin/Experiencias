import { useCallback, useRef, useState } from 'react';

import {
  criarItem,
  editarItem,
  excluirItem,
  listarRoteiro,
  moverItem,
  ordenarRoteiro,
  type CamposDoItem,
  type ItemDoRoteiro,
  type Posicao,
} from '@/services/roteiro';

/**
 * O roteiro de uma experiência, em ordem. Criar, editar e excluir só mudam a lista depois que o
 * servidor confirmou; mover (arrastar) muda na hora e volta atrás se o servidor recusar.
 */
export function useRoteiro(experienciaId: string) {
  const [itens, setItensDoEstado] = useState<ItemDoRoteiro[]>([]);
  // A lista mais recente, para calcular posições sem depender de um render.
  const atuais = useRef<ItemDoRoteiro[]>([]);
  const [erro, setErro] = useState<string>();
  // Já houve resposta do servidor: antes disso, "nenhum item" ainda não é certo.
  const [carregado, setCarregado] = useState(false);

  const setItens = useCallback((mudar: (lista: ItemDoRoteiro[]) => ItemDoRoteiro[]) => {
    atuais.current = ordenarRoteiro(mudar(atuais.current));
    setItensDoEstado(atuais.current);
  }, []);

  const carregar = useCallback(async () => {
    const r = await listarRoteiro(experienciaId);
    setCarregado(true);
    if (r.ok) {
      setItens(() => r.itens);
      setErro(undefined);
    } else {
      setErro(r.mensagem);
    }
  }, [experienciaId, setItens]);

  const criar = useCallback(
    async (campos: CamposDoItem) => {
      const r = await criarItem(experienciaId, campos, atuais.current);
      if (r.ok) setItens((lista) => [...lista, r.item]);
      return r;
    },
    [experienciaId, setItens]
  );

  const tirarSeSumiu = useCallback(
    (id: string, codigo: string) => {
      // A outra pessoa já excluiu: some da lista.
      if (codigo === 'roteiro_inexistente') setItens((lista) => lista.filter((x) => x.id !== id));
    },
    [setItens]
  );

  const editar = useCallback(
    async (item: ItemDoRoteiro, campos: CamposDoItem) => {
      const r = await editarItem(item, campos, atuais.current);
      if (r.ok) setItens((lista) => lista.map((x) => (x.id === item.id ? r.item : x)));
      else tirarSeSumiu(item.id, r.codigo);
      return r;
    },
    [setItens, tirarSeSumiu]
  );

  const mover = useCallback(
    async (id: string, posicao: Posicao) => {
      const antes = atuais.current.find((x) => x.id === id);
      if (!antes) return;
      setErro(undefined);
      setItens((lista) => lista.map((x) => (x.id === id ? { ...x, ...posicao } : x)));
      const r = await moverItem(id, posicao);
      if (r.ok) return;
      setItens((lista) => lista.map((x) => (x.id === id ? antes : x)));
      tirarSeSumiu(id, r.codigo);
      setErro(r.mensagem);
    },
    [setItens, tirarSeSumiu]
  );

  const excluir = useCallback(
    async (id: string) => {
      const r = await excluirItem(id);
      if (r.ok) setItens((lista) => lista.filter((x) => x.id !== id));
      return r;
    },
    [setItens]
  );

  return { itens, erro, carregado, carregar, criar, editar, mover, excluir };
}
