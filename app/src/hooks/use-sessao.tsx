import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { buscarPerfil, sair as sairDaConta, type Perfil } from '@/services/laco';
import { supabase, supabaseConfigurado } from '@/services/supabase';

export type EstadoSessao =
  | 'carregando'
  | 'sem-configuracao'
  | 'sem-sessao'
  | 'sem-laco'
  | 'com-laco'
  | 'erro';

type Sessao = {
  estado: EstadoSessao;
  perfil: Perfil | null;
  /** Identidade autenticada, mesmo antes de pertencer a um Laço. */
  usuarioId: string | null;
  /** Só `true` com Laço e sem uma tela de onboarding pedindo para segurar a pessoa nela. */
  acessoLiberado: boolean;
  /** Segura a pessoa no onboarding mesmo já tendo Laço (código mostrado uma vez, confirmação). */
  reter: (reter: boolean) => void;
  /** Recarrega a sessão e o perfil. */
  atualizar: () => Promise<EstadoSessao>;
  /** Recarrega e libera a área principal. */
  liberar: () => Promise<void>;
  sair: () => Promise<void>;
};

const SessaoContext = createContext<Sessao | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSessao>(
    supabaseConfigurado ? 'carregando' : 'sem-configuracao'
  );
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [retido, setRetido] = useState(false);
  const versao = useRef(0);

  const atualizar = useCallback(async (): Promise<EstadoSessao> => {
    if (!supabase) return 'sem-configuracao';
    const minha = ++versao.current;
    let novoEstado: EstadoSessao = 'erro';
    let novoPerfil: Perfil | null = null;
    let novoUsuario: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        novoEstado = 'sem-sessao';
      } else {
        novoUsuario = data.session.user.id;
        const r = await buscarPerfil();
        // Se falhar com sessão válida (sem conexão), fica em 'erro': não manda a pessoa ao onboarding.
        if (r.ok) {
          novoPerfil = r.perfil;
          novoEstado = r.perfil ? 'com-laco' : 'sem-laco';
        }
      }
    } catch {
      novoEstado = 'erro';
    }
    // Resultado de uma chamada mais antiga que outra em andamento é descartado.
    if (minha === versao.current) {
      setUsuarioId(novoUsuario);
      if (novoEstado !== 'erro') setPerfil(novoPerfil);
      // Uma falha ao recarregar não derruba quem já está dentro do Laço.
      setEstado((anterior) => (novoEstado === 'erro' && anterior === 'com-laco' ? anterior : novoEstado));
    }
    return novoEstado;
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const cliente = supabase;

    // O primeiro evento (INITIAL_SESSION) dispara a carga inicial.
    const { data } = cliente.auth.onAuthStateChange(() => {
      // Não chamar o Supabase dentro do callback: adiar evita travar o cliente de autenticação.
      setTimeout(() => {
        atualizar();
      }, 0);
    });

    const app = AppState.addEventListener('change', (situacao) => {
      if (situacao === 'active') cliente.auth.startAutoRefresh();
      else cliente.auth.stopAutoRefresh();
    });

    return () => {
      data.subscription.unsubscribe();
      app.remove();
    };
  }, [atualizar]);

  const liberar = useCallback(async () => {
    await atualizar();
    setRetido(false);
  }, [atualizar]);

  const sair = useCallback(async () => {
    setRetido(false);
    await sairDaConta();
    // Não depende só do evento de saída do Supabase para atualizar o estado.
    await atualizar();
  }, [atualizar]);

  return (
    <SessaoContext.Provider
      value={{
        estado,
        perfil,
        usuarioId,
        acessoLiberado: estado === 'com-laco' && !retido,
        reter: setRetido,
        atualizar,
        liberar,
        sair,
      }}>
      {children}
    </SessaoContext.Provider>
  );
}

export function useSessao() {
  const contexto = useContext(SessaoContext);
  if (!contexto) {
    throw new Error('useSessao deve ser usado dentro de SessaoProvider');
  }
  return contexto;
}
