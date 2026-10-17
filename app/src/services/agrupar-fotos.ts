// Agrupa os registros (fotos e observações) de uma experiência por dia e por período, no horário de Brasília.
// Regras puras, sem dependências. Brasília não tem horário de verão desde 2019: UTC−3 fixo.
import type { Foto } from '@/services/fotos';

const DESLOCAMENTO_BRASILIA_MS = -3 * 60 * 60 * 1000;

export type Periodo = 'madrugada' | 'manha' | 'tarde' | 'noite';

/** Na ordem do dia. */
export const PERIODOS: Periodo[] = ['madrugada', 'manha', 'tarde', 'noite'];

export const ROTULO_DO_PERIODO: Record<Periodo, string> = {
  madrugada: 'Madrugada',
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

/** O que basta para agrupar: quando foi tirada (fotos) e quando foi guardado. */
type ComMomento = { capturadaEm?: string | null; criadoEm: string };

export type GrupoDoDia<T extends ComMomento = Foto> = {
  /** `AAAA-MM-DD` no horário de Brasília. */
  dia: string;
  rotulo: string;
  periodos: { periodo: Periodo; fotos: T[] }[];
};

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Momento que vale para a foto: quando foi tirada; sem isso, quando foi enviada. */
export const momentoDaFoto = (f: ComMomento) => f.capturadaEm ?? f.criadoEm;

/** Data e hora "de parede" em Brasília para um instante. */
function emBrasilia(iso: string) {
  const d = new Date(new Date(iso).getTime() + DESLOCAMENTO_BRASILIA_MS);
  return { dia: d.toISOString().slice(0, 10), hora: d.getUTCHours() };
}

/** Madrugada 0h–4h59, manhã 5h–11h59, tarde 12h–17h59, noite 18h–23h59. */
export function periodoDaHora(hora: number): Periodo {
  if (hora < 5) return 'madrugada';
  if (hora < 12) return 'manha';
  if (hora < 18) return 'tarde';
  return 'noite';
}

export function rotuloDoDia(dia: string, agora: Date): string {
  const hoje = emBrasilia(agora.toISOString()).dia;
  const ontem = emBrasilia(new Date(agora.getTime() - 86_400_000).toISOString()).dia;
  if (dia === hoje) return 'Hoje';
  if (dia === ontem) return 'Ontem';
  const [ano, mes, d] = dia.split('-').map(Number);
  const anoAtual = Number(hoje.slice(0, 4));
  return ano === anoAtual ? `${d} de ${MESES[mes - 1]}` : `${d} de ${MESES[mes - 1]} de ${ano}`;
}

/** Dia (`AAAA-MM-DD`) e período em Brasília de um instante. */
export function diaEPeriodo(iso: string): { dia: string; periodo: Periodo } {
  const { dia, hora } = emBrasilia(iso);
  return { dia, periodo: periodoDaHora(hora) };
}

// Hora de Brasília que representa cada período quando a pessoa escolhe um momento que não é o atual.
const HORA_DO_PERIODO: Record<Periodo, number> = { madrugada: 3, manha: 9, tarde: 15, noite: 21 };

/**
 * Instante guardado para um momento escolhido (observações): se for o dia e período de agora, é agora;
 * senão, uma hora no meio do período. Só o dia e o período importam para o agrupamento.
 */
export function instanteDoMomento(dia: string, periodo: Periodo, agora: Date): string {
  const atual = diaEPeriodo(agora.toISOString());
  if (atual.dia === dia && atual.periodo === periodo) return agora.toISOString();
  const [ano, mes, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, d, HORA_DO_PERIODO[periodo]) - DESLOCAMENTO_BRASILIA_MS).toISOString();
}

/** Do mais recente para o mais antigo: dias, períodos do dia e fotos. */
export function agruparFotos<T extends ComMomento>(fotos: T[], agora: Date): GrupoDoDia<T>[] {
  const ordenadas = [...fotos].sort((a, b) => momentoDaFoto(b).localeCompare(momentoDaFoto(a)));
  const dias = new Map<string, Map<Periodo, T[]>>();
  for (const foto of ordenadas) {
    const { dia, hora } = emBrasilia(momentoDaFoto(foto));
    const periodo = periodoDaHora(hora);
    if (!dias.has(dia)) dias.set(dia, new Map());
    const doDia = dias.get(dia) as Map<Periodo, T[]>;
    if (!doDia.has(periodo)) doDia.set(periodo, []);
    (doDia.get(periodo) as T[]).push(foto);
  }
  return [...dias.entries()].map(([dia, periodos]) => ({
    dia,
    rotulo: rotuloDoDia(dia, agora),
    periodos: [...periodos.entries()].map(([periodo, lista]) => ({ periodo, fotos: lista })),
  }));
}

/**
 * Data de captura a partir do EXIF que a câmera/galeria devolve ao aparelho (`DateTimeOriginal`,
 * "AAAA:MM:DD HH:MM:SS", hora local da câmera). Usa o deslocamento gravado na foto quando existe;
 * sem ele, considera o horário de Brasília. O EXIF em si não é enviado ao servidor.
 */
export function capturaDoExif(exif: Record<string, unknown> | null | undefined): string | null {
  if (!exif) return null;
  const bruto = exif.DateTimeOriginal ?? exif.DateTimeDigitized ?? exif.DateTime;
  if (typeof bruto !== 'string') return null;
  const m = bruto.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const deslocamento = typeof exif.OffsetTimeOriginal === 'string' && /^[+-]\d{2}:\d{2}$/.test(exif.OffsetTimeOriginal)
    ? exif.OffsetTimeOriginal
    : '-03:00';
  const instante = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${deslocamento}`);
  if (Number.isNaN(instante.getTime())) return null;
  // Datas absurdas (relógio da câmera errado) são ignoradas: vale o momento do envio.
  if (instante.getTime() < Date.UTC(1990, 0, 1) || instante.getTime() > Date.now() + 86_400_000) return null;
  return instante.toISOString();
}
