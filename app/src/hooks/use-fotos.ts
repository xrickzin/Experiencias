import { useCallback, useState } from 'react';

import { useSessao } from '@/hooks/use-sessao';
import { datarFoto, enviarFoto, excluirFoto, legendarFoto, listarFotos, type ArquivoDeFoto, type Foto } from '@/services/fotos';
import type { Resultado } from '@/services/laco';

type Envio = { atual: number; total: number } | null;

/**
 * Fotos de uma experiência. Só aparecem na lista depois que o servidor confirmou o envio; ao enviar
 * várias, uma falha não apaga as que já foram e a mensagem diz quantas entraram.
 */
export function useFotos(experienciaId: string) {
  const { perfil } = useSessao();
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState<string>();
  const [envio, setEnvio] = useState<Envio>(null);

  const carregar = useCallback(async () => {
    const r = await listarFotos(experienciaId);
    if (r.ok) {
      setFotos(r.fotos);
      setErro(undefined);
    } else {
      setErro(r.mensagem);
    }
    setCarregado(true);
  }, [experienciaId]);

  const enviar = useCallback(
    async (arquivos: ArquivoDeFoto[]): Promise<Resultado<{ enviadas: number }>> => {
      const lacoId = perfil?.laco_id;
      if (!lacoId || arquivos.length === 0) return { ok: true, enviadas: 0 };
      let enviadas = 0;
      for (let i = 0; i < arquivos.length; i++) {
        setEnvio({ atual: i + 1, total: arquivos.length });
        const r = await enviarFoto(lacoId, experienciaId, arquivos[i]);
        if (!r.ok) {
          setEnvio(null);
          const mensagem =
            enviadas > 0 ? `${enviadas} de ${arquivos.length} fotos foram guardadas. ${r.mensagem}` : r.mensagem;
          return { ok: false, codigo: r.codigo, mensagem };
        }
        enviadas++;
        setFotos((atuais) => [...atuais, r.foto]);
      }
      setEnvio(null);
      return { ok: true, enviadas };
    },
    [experienciaId, perfil?.laco_id]
  );

  const excluir = useCallback(async (foto: Foto) => {
    const r = await excluirFoto(foto);
    if (r.ok) setFotos((atuais) => atuais.filter((f) => f.id !== foto.id));
    return r;
  }, []);

  const legendar = useCallback(async (id: string, legenda: string) => {
    const r = await legendarFoto(id, legenda);
    if (r.ok) setFotos((atuais) => atuais.map((f) => (f.id === id ? { ...f, legenda: r.legenda } : f)));
    return r;
  }, []);

  const datar = useCallback(async (id: string, capturadaEm: string) => {
    const r = await datarFoto(id, capturadaEm);
    if (r.ok) setFotos((atuais) => atuais.map((f) => (f.id === id ? { ...f, capturadaEm: r.capturadaEm } : f)));
    return r;
  }, []);

  return { fotos, carregando: !carregado, erro, envio, carregar, enviar, excluir, legendar, datar };
}
