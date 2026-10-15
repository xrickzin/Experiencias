// Substitui `@/hooks/use-sessao` nos testes: o estado da sessão é controlado pelo teste e as telas
// reagem a ele como reagiriam ao Supabase. Uso: jest.mock('@/hooks/use-sessao', () =>
// require('./apoio/sessao-falsa').modulo) e `definirSessao({ estado: 'com-laco' })`.
import { useSyncExternalStore, type ReactNode } from 'react';

import type { EstadoSessao } from '@/hooks/use-sessao';
import type { Perfil } from '@/services/laco';

type EstadoFalso = {
  estado: EstadoSessao;
  perfil: Perfil | null;
  usuarioId: string | null;
  retido: boolean;
  /** Estado que `atualizar`/`liberar` passam a refletir (imita a releitura do servidor). */
  proximoEstado: EstadoSessao | null;
};

const INICIAL: EstadoFalso = {
  estado: 'sem-sessao',
  perfil: null,
  usuarioId: null,
  retido: false,
  proximoEstado: null,
};

let atual: EstadoFalso = INICIAL;
const ouvintes = new Set<() => void>();

export function definirSessao(parcial: Partial<EstadoFalso>) {
  atual = { ...atual, ...parcial };
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function reiniciarSessao() {
  atual = INICIAL;
}

export function sessaoAtual() {
  return atual;
}

const assinar = (ouvinte: () => void) => {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
};

const reter = (valor: boolean) => definirSessao({ retido: valor });

const atualizar = async () => {
  if (atual.proximoEstado) definirSessao({ estado: atual.proximoEstado });
  return atual.estado;
};

const liberar = async () => {
  await atualizar();
  definirSessao({ retido: false });
};

const sair = async () => definirSessao({ estado: 'sem-sessao', usuarioId: null, perfil: null, retido: false });

function useSessao() {
  const s = useSyncExternalStore(assinar, () => atual);
  return {
    estado: s.estado,
    perfil: s.perfil,
    usuarioId: s.usuarioId,
    acessoLiberado: s.estado === 'com-laco' && !s.retido,
    reter,
    atualizar,
    liberar,
    sair,
  };
}

function SessaoProvider({ children }: { children: ReactNode }) {
  return children;
}

export const modulo = { useSessao, SessaoProvider };
