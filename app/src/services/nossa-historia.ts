import type { Experiencia } from '@/services/experiencias';
import { chaveDeOrdem, MESES } from '@/services/referencia-temporal';

export type MesDaHistoria = {
  /** `AAAA-MM`. */
  chave: string;
  /** "Outubro de 2026". */
  rotulo: string;
  /** Memórias com dia, em ordem cronológica crescente. */
  comDia: Experiencia[];
  /** Memórias só com mês/ano: ficam à parte, no fim do mês, sem sugerir um dia (ADR 031). */
  semDia: Experiencia[];
};

/**
 * Agrupa as memórias pelo mês de início da referência temporal, do mês mais recente ao mais
 * antigo. Um período aparece uma vez só, no mês em que começa.
 */
export function agruparPorMes(memorias: Experiencia[]): MesDaHistoria[] {
  const meses = new Map<string, MesDaHistoria>();
  for (const m of memorias) {
    // Memória sempre tem data (regra no banco); sem ela não há onde colocar.
    if (!m.referencia.inicio) continue;
    const chave = m.referencia.inicio.slice(0, 7);
    let mes = meses.get(chave);
    if (!mes) {
      const [ano, numero] = chave.split('-').map(Number);
      const nome = MESES[numero - 1];
      mes = { chave, rotulo: `${nome[0].toUpperCase()}${nome.slice(1)} de ${ano}`, comDia: [], semDia: [] };
      meses.set(chave, mes);
    }
    (m.referencia.precisao === 'mes_ano' ? mes.semDia : mes.comDia).push(m);
  }

  const porData = (a: Experiencia, b: Experiencia) =>
    (chaveDeOrdem(a.referencia) ?? '').localeCompare(chaveDeOrdem(b.referencia) ?? '');
  const porTitulo = (a: Experiencia, b: Experiencia) => a.titulo.localeCompare(b.titulo, 'pt-BR');
  return [...meses.values()]
    .sort((a, b) => b.chave.localeCompare(a.chave))
    .map((mes) => ({ ...mes, comDia: mes.comDia.sort(porData), semDia: mes.semDia.sort(porTitulo) }));
}
