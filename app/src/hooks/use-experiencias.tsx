import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useSessao } from '@/hooks/use-sessao';
import type { Resultado } from '@/services/laco';
import {
  atualizarDesejo as atualizarDesejoNoServidor,
  criarDesejo,
  excluirDesejo as excluirDesejoNoServidor,
  listarDesejos,
  type CamposDoDesejo,
  type Desejo,
} from '@/services/experiencias';

type Experiencias = {
  desejos: Desejo[];
  /** Primeira carga do Laço atual ainda em andamento. */
  carregando: boolean;
  /** Mensagem da última carga que falhou; some quando uma carga dá certo. */
  erro: string | undefined;
  recarregar: () => Promise<void>;
  adicionarDesejo: (campos: CamposDoDesejo) => Promise<Resultado<{ desejo: Desejo }>>;
  atualizarDesejo: (id: string, campos: CamposDoDesejo) => Promise<Resultado<{ desejo: Desejo }>>;
  excluirDesejo: (id: string) => Promise<Resultado>;
};

const ExperienciasContext = createContext<Experiencias | null>(null);

// Os dados guardam de que Laço são: ao trocar de conta, o que sobrou não aparece para a outra pessoa.
type Dados = { lacoId: string | null; desejos: Desejo[]; erro: string | undefined; carregado: boolean };
const VAZIO: Dados = { lacoId: null, desejos: [], erro: undefined, carregado: false };

/**
 * Desejos do Laço, lidos e gravados no Supabase. Só mostra como salvo o que o servidor confirmou.
 * Não há tempo real: Início e Desejos releem a lista quando ganham foco (a outra pessoa pode ter mudado).
 */
export function ExperienciasProvider({ children }: { children: ReactNode }) {
  const { perfil } = useSessao();
  const lacoId = perfil?.laco_id ?? null;
  const [dados, setDados] = useState<Dados>(VAZIO);
  const emAndamento = useRef<Promise<void> | null>(null);

  const carregar = useCallback(async () => {
    if (!lacoId) return;
    const r = await listarDesejos();
    setDados((atuais) => {
      const base = atuais.lacoId === lacoId ? atuais : { ...VAZIO, lacoId };
      return r.ok
        ? { lacoId, desejos: r.desejos, erro: undefined, carregado: true }
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
  const desejos = doLaco ? dados.desejos : [];

  const alterar = useCallback(
    (funcao: (atuais: Desejo[]) => Desejo[]) =>
      setDados((atuais) => ({
        ...atuais,
        lacoId,
        desejos: funcao(atuais.lacoId === lacoId ? atuais.desejos : []),
      })),
    [lacoId]
  );

  const adicionarDesejo = useCallback(
    async (campos: CamposDoDesejo) => {
      const r = await criarDesejo(campos);
      if (r.ok) alterar((atuais) => [r.desejo, ...atuais]);
      return r;
    },
    [alterar]
  );

  const atualizarDesejo = useCallback(
    async (id: string, campos: CamposDoDesejo) => {
      const r = await atualizarDesejoNoServidor(id, campos);
      if (r.ok) alterar((atuais) => atuais.map((d) => (d.id === id ? r.desejo : d)));
      // A outra pessoa já excluiu: tira da lista local para a tela refletir a realidade.
      else if (r.codigo === 'desejo_inexistente') alterar((atuais) => atuais.filter((d) => d.id !== id));
      return r;
    },
    [alterar]
  );

  const excluirDesejo = useCallback(
    async (id: string) => {
      const r = await excluirDesejoNoServidor(id);
      if (r.ok) alterar((atuais) => atuais.filter((d) => d.id !== id));
      return r;
    },
    [alterar]
  );

  return (
    <ExperienciasContext.Provider
      value={{
        desejos,
        carregando: Boolean(lacoId) && !(doLaco && dados.carregado),
        erro: doLaco ? dados.erro : undefined,
        recarregar,
        adicionarDesejo,
        atualizarDesejo,
        excluirDesejo,
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
