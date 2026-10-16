import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

import { useSessao } from '@/hooks/use-sessao';
import { removerFotosDaExperiencia } from '@/services/fotos';
import type { Resultado } from '@/services/laco';
import {
  atualizarExperiencia as atualizarNoServidor,
  criarDesejo,
  excluirExperiencia as excluirNoServidor,
  listarExperiencias,
  definirFotoDestaque,
  mudarEstado as mudarEstadoNoServidor,
  type CamposDaExperiencia,
  type Estado,
  type Experiencia,
} from '@/services/experiencias';

type Experiencias = {
  /** Todas as experiências do Laço. */
  experiencias: Experiencia[];
  /** Só as que estão em Desejo, da mais nova para a mais antiga. */
  desejos: Experiencia[];
  /** Primeira carga do Laço atual ainda em andamento. */
  carregando: boolean;
  /** Mensagem da última carga que falhou; some quando uma carga dá certo. */
  erro: string | undefined;
  recarregar: () => Promise<void>;
  adicionarDesejo: (campos: CamposDaExperiencia) => Promise<Resultado<{ desejo: Experiencia }>>;
  atualizarExperiencia: (id: string, campos: CamposDaExperiencia) => Promise<Resultado<{ experiencia: Experiencia }>>;
  excluirExperiencia: (id: string) => Promise<Resultado>;
  mudarEstado: (id: string, estado: Estado) => Promise<Resultado<{ estado: Estado }>>;
  definirDestaque: (id: string, fotoId: string | null) => Promise<Resultado<{ experiencia: Experiencia }>>;
};

const ExperienciasContext = createContext<Experiencias | null>(null);

// Os dados guardam de que Laço são: ao trocar de conta, o que sobrou não aparece para a outra pessoa.
type Dados = { lacoId: string | null; lista: Experiencia[]; erro: string | undefined; carregado: boolean };
const VAZIO: Dados = { lacoId: null, lista: [], erro: undefined, carregado: false };

/**
 * Experiências do Laço, lidas e gravadas no Supabase. Só mostra como salvo o que o servidor confirmou.
 * Não há tempo real: Início, Desejos e as listas releem quando ganham foco.
 */
export function ExperienciasProvider({ children }: { children: ReactNode }) {
  const { perfil } = useSessao();
  const lacoId = perfil?.laco_id ?? null;
  const [dados, setDados] = useState<Dados>(VAZIO);
  const emAndamento = useRef<Promise<void> | null>(null);

  const carregar = useCallback(async () => {
    if (!lacoId) return;
    const r = await listarExperiencias();
    setDados((atuais) => {
      const base = atuais.lacoId === lacoId ? atuais : { ...VAZIO, lacoId };
      return r.ok
        ? { lacoId, lista: r.experiencias, erro: undefined, carregado: true }
        : { ...base, erro: r.mensagem, carregado: true };
    });
  }, [lacoId]);

  // Quem chamar enquanto outra carga está em andamento recebe a mesma (uma só ida ao servidor).
  const recarregar = useCallback(() => {
    if (!emAndamento.current) {
      emAndamento.current = carregar().finally(() => {
        emAndamento.current = null;
      });
    }
    return emAndamento.current;
  }, [carregar]);

  const doLaco = dados.lacoId === lacoId;
  const experiencias = doLaco ? dados.lista : [];

  const alterar = useCallback(
    (funcao: (atuais: Experiencia[]) => Experiencia[]) =>
      setDados((atuais) => ({
        ...atuais,
        lacoId,
        lista: funcao(atuais.lacoId === lacoId ? atuais.lista : []),
      })),
    [lacoId]
  );

  const adicionarDesejo = useCallback(
    async (campos: CamposDaExperiencia) => {
      const r = await criarDesejo(campos);
      if (r.ok) alterar((atuais) => [r.desejo, ...atuais]);
      return r;
    },
    [alterar]
  );

  const atualizarExperiencia = useCallback(
    async (id: string, campos: CamposDaExperiencia) => {
      const r = await atualizarNoServidor(id, campos);
      if (r.ok) alterar((atuais) => atuais.map((e) => (e.id === id ? r.experiencia : e)));
      // A outra pessoa já excluiu: tira da lista local para a tela refletir a realidade.
      else if (r.codigo === 'desejo_inexistente') alterar((atuais) => atuais.filter((e) => e.id !== id));
      return r;
    },
    [alterar]
  );

  const excluirExperiencia = useCallback(
    async (id: string) => {
      // ADR 020: primeiro os arquivos; se falhar, nada é excluído e a pessoa pode tentar de novo.
      const fotos = await removerFotosDaExperiencia(id);
      if (!fotos.ok) return fotos;
      const r = await excluirNoServidor(id);
      if (r.ok) alterar((atuais) => atuais.filter((e) => e.id !== id));
      return r;
    },
    [alterar]
  );

  const mudarEstado = useCallback(
    async (id: string, estado: Estado) => {
      const r = await mudarEstadoNoServidor(id, estado);
      if (r.ok) {
        alterar((atuais) =>
          atuais.map((e) => (e.id === id ? { ...e, estado, atualizadoEm: new Date().toISOString() } : e))
        );
      } else if (r.codigo === 'desejo_inexistente') {
        alterar((atuais) => atuais.filter((e) => e.id !== id));
      }
      return r;
    },
    [alterar]
  );

  const definirDestaque = useCallback(
    async (id: string, fotoId: string | null) => {
      const r = await definirFotoDestaque(id, fotoId);
      if (r.ok) alterar((atuais) => atuais.map((e) => (e.id === id ? r.experiencia : e)));
      return r;
    },
    [alterar]
  );

  return (
    <ExperienciasContext.Provider
      value={{
        experiencias,
        desejos: experiencias.filter((e) => e.estado === 'desejo'),
        carregando: Boolean(lacoId) && !(doLaco && dados.carregado),
        erro: doLaco ? dados.erro : undefined,
        recarregar,
        adicionarDesejo,
        atualizarExperiencia,
        excluirExperiencia,
        mudarEstado,
        definirDestaque,
      }}>
      {children}
    </ExperienciasContext.Provider>
  );
}

export function useExperiencias() {
  const contexto = useContext(ExperienciasContext);
  if (!contexto) {
    throw new Error('useExperiencias deve ser usado dentro de ExperienciasProvider');
  }
  return contexto;
}
