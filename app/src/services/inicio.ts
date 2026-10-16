// Organização do Início (ADR 014 e 027): sem ranking, só estado e referência temporal.
import type { Experiencia } from '@/services/experiencias';
import { chaveDeOrdem } from '@/services/referencia-temporal';

/** Limites de apresentação provisórios (ADR 027). Não limitam quantas experiências existem. */
export const LIMITES = { vivendo: 3, proximas: 3, planejamentos: 3 } as const;

export type Inicio = {
  /** Vivendo: pela referência disponível; sem ela, a atualizada mais recentemente primeiro. */
  vivendo: Experiencia[];
  /** Planejamento com instante de início no futuro (dia, dia e horário, período), da mais próxima. */
  proximas: Experiencia[];
  /**
   * Planejamento sem instante futuro: sem data, só mês/ano, ou dia que já passou (ADR 027: segue em
   * Planejamento, sem alerta). A atualizada mais recentemente primeiro.
   */
  planejamentos: Experiencia[];
  /** Todas as experiências em Planejamento ("Ver planejamentos"). */
  todosOsPlanejamentos: Experiencia[];
  totalDeDesejos: number;
};

const maisRecente = (a: Experiencia, b: Experiencia) => b.atualizadoEm.localeCompare(a.atualizadoEm);

export function organizarInicio(experiencias: Experiencia[], agora: Date): Inicio {
  const vivendo = experiencias
    .filter((e) => e.estado === 'vivendo')
    .sort((a, b) => {
      const ka = chaveDeOrdem(a.referencia);
      const kb = chaveDeOrdem(b.referencia);
      if (ka && kb) return ka.localeCompare(kb);
      if (ka) return -1;
      if (kb) return 1;
      return maisRecente(a, b);
    });

  const planejando = experiencias.filter((e) => e.estado === 'planejamento');
  const futuro = (e: Experiencia) => e.inicioEm !== null && new Date(e.inicioEm).getTime() > agora.getTime();

  const proximas = planejando
    .filter(futuro)
    .sort((a, b) => new Date(a.inicioEm as string).getTime() - new Date(b.inicioEm as string).getTime());

  const planejamentos = planejando.filter((e) => !futuro(e)).sort(maisRecente);

  return {
    vivendo,
    proximas,
    planejamentos,
    todosOsPlanejamentos: [...proximas, ...planejamentos],
    totalDeDesejos: experiencias.filter((e) => e.estado === 'desejo').length,
  };
}
