import { useCallback, useState } from 'react';

import { useSessao } from '@/hooks/use-sessao';
import {
  escolherMomentoFavorito,
  listarImpressoes,
  salvarImpressao,
  type Impressao,
} from '@/services/impressoes';

/**
 * Impressões e momentos favoritos de uma memória, separados em "minha" e "da outra pessoa".
 * A da outra pessoa só vem do servidor quando a regra permite; depois de salvar, relê para saber.
 */
export function useImpressoes(experienciaId: string) {
  const { perfil } = useSessao();
  const meuId = perfil?.membro_id;
  const [lista, setLista] = useState<Impressao[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState<string>();

  const carregar = useCallback(async () => {
    const r = await listarImpressoes(experienciaId);
    if (r.ok) {
      setLista(r.impressoes);
      setErro(undefined);
    } else {
      setErro(r.mensagem);
    }
    setCarregado(true);
  }, [experienciaId]);

  const salvar = useCallback(
    async (texto: string) => {
      const r = await salvarImpressao(experienciaId, texto);
      if (r.ok) await carregar();
      return r;
    },
    [experienciaId, carregar]
  );

  const escolherFavorito = useCallback(
    async (fotoId: string | null) => {
      const r = await escolherMomentoFavorito(experienciaId, fotoId);
      if (r.ok) await carregar();
      return r;
    },
    [experienciaId, carregar]
  );

  return {
    minha: lista.find((i) => i.membroId === meuId) ?? null,
    // Só existe para quem já registrou a própria impressão (regra do banco).
    daOutra: lista.find((i) => i.membroId !== meuId) ?? null,
    registrei: Boolean(lista.find((i) => i.membroId === meuId)?.texto),
    carregando: !carregado,
    erro,
    carregar,
    salvar,
    escolherFavorito,
  };
}
