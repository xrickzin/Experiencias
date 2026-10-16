// Referência temporal (dates-and-automation.md): o "quando" de uma experiência, com a precisão que o
// casal escolheu. Regras puras, sem dependências: entrada digitada → valor do banco → texto da tela.

export type Precisao = 'sem_data' | 'mes_ano' | 'data' | 'data_horario' | 'periodo';

/** Como o banco guarda: datas `AAAA-MM-DD`, horário `HH:MM`. */
export type ReferenciaTemporal = {
  precisao: Precisao;
  inicio: string | null;
  fim: string | null;
  horario: string | null;
};

/** O que a pessoa digita: `DD/MM/AAAA`, `MM/AAAA` e `HH:MM`. */
export type CamposDaReferencia = {
  precisao: Precisao;
  data: string;
  dataFim: string;
  mesAno: string;
  horario: string;
};

export const SEM_DATA: ReferenciaTemporal = { precisao: 'sem_data', inicio: null, fim: null, horario: null };

export const PRECISOES: { valor: Precisao; rotulo: string }[] = [
  { valor: 'sem_data', rotulo: 'Sem data' },
  { valor: 'mes_ano', rotulo: 'Mês' },
  { valor: 'data', rotulo: 'Dia' },
  { valor: 'data_horario', rotulo: 'Dia e horário' },
  { valor: 'periodo', rotulo: 'Período' },
];

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const ANO_MINIMO = 1900;
const ANO_MAXIMO = 2100;

// --- máscaras: aceitam só dígitos e põem as barras e os dois-pontos sozinhas -----------------------
const digitos = (texto: string, maximo: number) => texto.replace(/\D/g, '').slice(0, maximo);

export function mascararData(texto: string): string {
  const d = digitos(texto, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function mascararMesAno(texto: string): string {
  const d = digitos(texto, 6);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function mascararHorario(texto: string): string {
  const d = digitos(texto, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

// --- leitura do que foi digitado ------------------------------------------------------------------
const dois = (n: number) => String(n).padStart(2, '0');

export function lerData(texto: string): string | null {
  const m = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (ano < ANO_MINIMO || ano > ANO_MAXIMO || mes < 1 || mes > 12 || dia < 1) return null;
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  if (dia > ultimoDia) return null;
  return `${ano}-${dois(mes)}-${dois(dia)}`;
}

function lerMesAno(texto: string): string | null {
  const m = texto.trim().match(/^(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [mes, ano] = [Number(m[1]), Number(m[2])];
  if (ano < ANO_MINIMO || ano > ANO_MAXIMO || mes < 1 || mes > 12) return null;
  return `${ano}-${dois(mes)}-01`;
}

export function lerHorario(texto: string): string | null {
  const m = texto.trim().match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [hora, minuto] = [Number(m[1]), Number(m[2])];
  if (hora > 23 || minuto > 59) return null;
  return `${dois(hora)}:${dois(minuto)}`;
}

export type LeituraDaReferencia =
  | { ok: true; referencia: ReferenciaTemporal }
  | { ok: false; erro: string };

/** Valida o que foi digitado para a precisão escolhida e devolve o valor do banco. */
export function lerReferencia(campos: CamposDaReferencia): LeituraDaReferencia {
  switch (campos.precisao) {
    case 'sem_data':
      return { ok: true, referencia: SEM_DATA };
    case 'mes_ano': {
      const inicio = lerMesAno(campos.mesAno);
      if (!inicio) return { ok: false, erro: 'Informe o mês como MM/AAAA, por exemplo 10/2026.' };
      return { ok: true, referencia: { precisao: 'mes_ano', inicio, fim: null, horario: null } };
    }
    case 'data': {
      const inicio = lerData(campos.data);
      if (!inicio) return { ok: false, erro: 'Informe o dia como DD/MM/AAAA, por exemplo 12/10/2026.' };
      return { ok: true, referencia: { precisao: 'data', inicio, fim: null, horario: null } };
    }
    case 'data_horario': {
      const inicio = lerData(campos.data);
      if (!inicio) return { ok: false, erro: 'Informe o dia como DD/MM/AAAA, por exemplo 12/10/2026.' };
      const horario = lerHorario(campos.horario);
      if (!horario) return { ok: false, erro: 'Informe o horário como HH:MM, por exemplo 19:30.' };
      return { ok: true, referencia: { precisao: 'data_horario', inicio, fim: null, horario } };
    }
    case 'periodo': {
      const inicio = lerData(campos.data);
      const fim = lerData(campos.dataFim);
      if (!inicio || !fim) return { ok: false, erro: 'Informe o começo e o fim como DD/MM/AAAA.' };
      if (fim < inicio) return { ok: false, erro: 'O fim do período não pode ser antes do começo.' };
      return { ok: true, referencia: { precisao: 'periodo', inicio, fim, horario: null } };
    }
  }
}

/** Memória: a referência é obrigatória (dates-and-automation.md); "sem data" não vale. */
export function lerReferenciaDaMemoria(campos: CamposDaReferencia): LeituraDaReferencia {
  if (campos.precisao === 'sem_data') return { ok: false, erro: 'Escolham quando vocês viveram isso.' };
  return lerReferencia(campos);
}

// --- do banco para os campos da tela --------------------------------------------------------------
const paraTextoDeData = (iso: string | null) => {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
};

export function camposDaReferencia(r: ReferenciaTemporal): CamposDaReferencia {
  const [ano, mes] = (r.inicio ?? '').split('-');
  return {
    precisao: r.precisao,
    data: r.precisao === 'mes_ano' ? '' : paraTextoDeData(r.inicio),
    dataFim: paraTextoDeData(r.fim),
    mesAno: r.precisao === 'mes_ano' && ano ? `${mes}/${ano}` : '',
    horario: r.horario ? r.horario.slice(0, 5) : '',
  };
}

// --- texto para a tela ----------------------------------------------------------------------------
const partes = (iso: string) => {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return { ano, mes, dia };
};

/** "12 de outubro de 2026": a data por extenso, como as outras precisões. */
const porExtenso = (iso: string) => {
  const { ano, mes, dia } = partes(iso);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
};

/**
 * Sempre por extenso: "outubro de 2026", "12 de outubro de 2026", "12 de outubro de 2026, 19:30",
 * "12 a 15 de outubro de 2026". Nulo se sem data.
 */
export function descreverReferencia(r: ReferenciaTemporal): string | null {
  if (r.precisao === 'sem_data' || !r.inicio) return null;
  const i = partes(r.inicio);
  switch (r.precisao) {
    case 'mes_ano':
      return `${MESES[i.mes - 1]} de ${i.ano}`;
    case 'data':
      return porExtenso(r.inicio);
    case 'data_horario':
      return `${porExtenso(r.inicio)}, ${(r.horario ?? '').slice(0, 5)}`;
    case 'periodo': {
      if (!r.fim) return porExtenso(r.inicio);
      const f = partes(r.fim);
      if (i.ano === f.ano && i.mes === f.mes) {
        return i.dia === f.dia
          ? `${i.dia} de ${MESES[i.mes - 1]} de ${i.ano}`
          : `${i.dia} a ${f.dia} de ${MESES[i.mes - 1]} de ${i.ano}`;
      }
      if (i.ano === f.ano) return `${i.dia} de ${MESES[i.mes - 1]} a ${f.dia} de ${MESES[f.mes - 1]} de ${i.ano}`;
      return `${porExtenso(r.inicio)} a ${porExtenso(r.fim)}`;
    }
  }
}

/** Chave de ordenação pela referência disponível (data e horário), ou nulo sem data. */
export function chaveDeOrdem(r: ReferenciaTemporal): string | null {
  if (!r.inicio) return null;
  return `${r.inicio}T${r.horario ? r.horario.slice(0, 5) : '00:00'}`;
}
