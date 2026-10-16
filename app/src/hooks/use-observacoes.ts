import { useCallback, useState } from 'react';

import {
  criarObservacao,
  editarObservacao,
  excluirObservacao,
  listarObservacoes,
  type Observacao,
} from '@/services/observacoes';

/** Observações de uma experiência. Só entram ou mudam na lista depois que o servidor confirmou. */
export function useObservacoes(experienciaId: string) {
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);
  const [erro, setErro] = useState<string>();

  const carregar = useCallback(async () => {
    const r = await listarObservacoes(experienciaId);
    if (r.ok) {
      setObservacoes(r.observacoes);
      setErro(undefined);
    } else {
      setErro(r.mensagem);
    }
  }, [experienciaId]);

  const criar = useCallback(
    async (texto: string, momentoEm: string) => {
      const r = await criarObservacao(experienciaId, texto, momentoEm);
      if (r.ok) setObservacoes((atuais) => [...atuais, r.observacao]);
      return r;
    },
    [experienciaId]
  );

  const editar = useCallback(async (id: string, texto: string, momentoEm: string) => {
    const r = await editarObservacao(id, texto, momentoEm);
    if (r.ok) setObservacoes((atuais) => atuais.map((o) => (o.id === id ? r.observacao : o)));
    // A outra pessoa já excluiu: some da lista.
    else if (r.codigo === 'observacao_inexistente') setObservacoes((atuais) => atuais.filter((o) => o.id !== id));
    return r;
  }, []);

  const excluir = useCallback(async (id: string) => {
    const r = await excluirObservacao(id);
    if (r.ok) setObservacoes((atuais) => atuais.filter((o) => o.id !== id));
    return r;
  }, []);

  return { observacoes, erro, carregar, criar, editar, excluir };
}
