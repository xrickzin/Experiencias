import type { Experiencia } from '@/services/experiencias';
import { SEM_DATA } from '@/services/referencia-temporal';

/** Experiência de teste: um Desejo sem data, a menos que o teste diga outra coisa. */
export const experiencia = (id: string, titulo: string, extra: Partial<Experiencia> = {}): Experiencia => ({
  id,
  titulo,
  estado: 'desejo',
  local: null,
  observacoes: null,
  referencia: SEM_DATA,
  inicioEm: null,
  fotoDestaque: null,
  tamanho: null,
  categorias: [],
  criadoEm: '2026-10-15T12:00:00Z',
  atualizadoEm: '2026-10-15T12:00:00Z',
  ...extra,
});
