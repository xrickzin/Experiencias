import { useEffect, useState } from 'react';

import { assinarCaminhos } from '@/services/fotos';

/**
 * URL assinada de um arquivo do Storage (válida por 1 hora). Nula enquanto carrega, sem caminho
 * ou se não foi possível gerar: quem usa mostra um substituto.
 */
export function useUrlAssinada(caminho: string | null): string | null {
  // Guarda de qual caminho é a URL, para nunca mostrar a imagem antiga depois de trocar.
  const [assinada, setAssinada] = useState<{ caminho: string; url: string } | null>(null);

  useEffect(() => {
    if (!caminho) return;
    let ativo = true;
    assinarCaminhos([caminho]).then((urls) => {
      const url = urls.get(caminho);
      if (ativo && url) setAssinada({ caminho, url });
    });
    return () => {
      ativo = false;
    };
  }, [caminho]);

  return caminho && assinada?.caminho === caminho ? assinada.url : null;
}
