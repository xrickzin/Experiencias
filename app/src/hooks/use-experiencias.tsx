import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

export type Desejo = { id: string; titulo: string };

type Experiencias = {
  desejos: Desejo[];
  adicionarDesejo: (titulo: string) => void;
};

const ExperienciasContext = createContext<Experiencias | null>(null);

/**
 * Estado local e temporário: os desejos existem só enquanto o app está aberto.
 * Será substituído pela persistência no Supabase quando o fluxo de experiências existir.
 */
export function ExperienciasProvider({ children }: { children: ReactNode }) {
  const [desejos, setDesejos] = useState<Desejo[]>([]);
  const proximoId = useRef(1);

  const adicionarDesejo = useCallback((titulo: string) => {
    const id = String(proximoId.current++);
    setDesejos((atuais) => [{ id, titulo }, ...atuais]);
  }, []);

  return (
    <ExperienciasContext.Provider value={{ desejos, adicionarDesejo }}>
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
