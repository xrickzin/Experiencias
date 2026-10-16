import { useCallback, useState } from 'react';

import { criarLink, editarLink, excluirLink, listarLinks, type Link } from '@/services/links';

/** Links de uma experiência. Só entram ou mudam na lista depois que o servidor confirmou. */
export function useLinks(experienciaId: string) {
  const [links, setLinks] = useState<Link[]>([]);
  const [erro, setErro] = useState<string>();

  const carregar = useCallback(async () => {
    const r = await listarLinks(experienciaId);
    if (r.ok) {
      setLinks(r.links);
      setErro(undefined);
    } else {
      setErro(r.mensagem);
    }
  }, [experienciaId]);

  const criar = useCallback(
    async (titulo: string, endereco: string) => {
      const r = await criarLink(experienciaId, titulo, endereco);
      if (r.ok) setLinks((atuais) => [...atuais, r.link]);
      return r;
    },
    [experienciaId]
  );

  const editar = useCallback(async (id: string, titulo: string, endereco: string) => {
    const r = await editarLink(id, titulo, endereco);
    if (r.ok) setLinks((atuais) => atuais.map((l) => (l.id === id ? r.link : l)));
    // A outra pessoa já excluiu: some da lista.
    else if (r.codigo === 'link_inexistente') setLinks((atuais) => atuais.filter((l) => l.id !== id));
    return r;
  }, []);

  const excluir = useCallback(async (id: string) => {
    const r = await excluirLink(id);
    if (r.ok) setLinks((atuais) => atuais.filter((l) => l.id !== id));
    return r;
  }, []);

  return { links, erro, carregar, criar, editar, excluir };
}
