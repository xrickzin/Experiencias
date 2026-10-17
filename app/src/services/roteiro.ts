// Roteiro por dia (ADR 038, etapa 4; ADR 040): o que o casal vai fazer em cada dia e período. A ordem
// dentro do período é do casal (arrastar); o horário, quando há, só sugere a posição ao guardar.
import { MESES, PERIODOS, periodoDaHora, rotuloDoDia, type Periodo } from '@/services/agrupar-fotos';
import { ehErroDeRede, falha, type ErroServico, type Falha, type Resultado } from '@/services/laco';
import { lerData, lerHorario, type ReferenciaTemporal } from '@/services/referencia-temporal';
import { supabase } from '@/services/supabase';

export type ItemDoRoteiro = {
  id: string;
  /** `AAAA-MM-DD`. */
  dia: string;
  periodo: Periodo;
  /** `HH:MM`, sempre dentro do período. */
  horario: string | null;
  texto: string;
  /** Posição dentro do dia e do período (esparsa: o meio entre dois vizinhos). */
  ordem: number;
  /** Ids dos links da experiência associados ao item (os mesmos da seção Links). */
  links: string[];
  criadoEm: string;
};

/** O que foi digitado no editor: dia como DD/MM/AAAA, horário como HH:MM (vazio quando não há) e os links marcados. */
export type CamposDoItem = { dia: string; periodo: Periodo; horario: string; texto: string; links: string[] };

/** Para onde um item vai ao ser arrastado ou movido. */
export type Posicao = Pick<ItemDoRoteiro, 'periodo' | 'ordem' | 'horario'>;

export const LIMITE_DO_TEXTO_DO_ROTEIRO = 200;
/** Acima disso, os dias da experiência não viram dias vazios no roteiro (uma viagem de meses). */
export const LIMITE_DE_DIAS_SUGERIDOS = 31;

type Linha = Omit<ItemDoRoteiro, 'criadoEm' | 'links'> & { criado_em: string; links: { link_id: string }[] | null };
const COLUNAS = 'id, dia, periodo, horario, texto, ordem, criado_em, links:roteiro_links(link_id)';
const paraItem = ({ criado_em, links, ...l }: Linha): ItemDoRoteiro => ({
  ...l,
  horario: l.horario?.slice(0, 5) ?? null,
  links: (links ?? []).map((x) => x.link_id),
  criadoEm: criado_em,
});

// --- Regras puras -------------------------------------------------------------------------------

/** Por dia, período (na ordem do dia), a ordem do casal e, no empate, quando foi guardado. */
export function ordenarRoteiro(itens: ItemDoRoteiro[]): ItemDoRoteiro[] {
  return [...itens].sort(
    (a, b) =>
      a.dia.localeCompare(b.dia) ||
      PERIODOS.indexOf(a.periodo) - PERIODOS.indexOf(b.periodo) ||
      a.ordem - b.ordem ||
      a.criadoEm.localeCompare(b.criadoEm)
  );
}

const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const diaDaSemana = (dia: string) => {
  const [ano, mes, d] = dia.split('-').map(Number);
  return SEMANA[new Date(Date.UTC(ano, mes - 1, d)).getUTCDay()];
};

/** "sábado, 12 de dezembro"; hoje e amanhã ganham o nome: "Hoje, sábado". */
export function rotuloDoDiaDoRoteiro(dia: string, agora: Date): string {
  const semana = diaDaSemana(dia);
  const amanha = new Date(agora.getTime() + 86_400_000);
  if (rotuloDoDia(dia, amanha) === 'Hoje') return `Amanhã, ${semana}`;
  const rotulo = rotuloDoDia(dia, agora);
  if (rotulo === 'Hoje' || rotulo === 'Ontem') return `${rotulo}, ${semana}`;
  return `${semana}, ${rotulo}`;
}

/** "Sáb, 12/12", para os botões de dia do editor. */
export function rotuloCurtoDoDia(dia: string): string {
  const [, mes, d] = dia.split('-');
  const semana = diaDaSemana(dia);
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1, 3)}, ${d}/${mes}`;
}

/** "12 de dezembro", sem o ano. */
export const diaPorExtenso = (dia: string) => {
  const [, mes, d] = dia.split('-').map(Number);
  return `${d} de ${MESES[mes - 1]}`;
};

const somarDias = (dia: string, n: number) => {
  const [ano, mes, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, d + n)).toISOString().slice(0, 10);
};

/** Os dias que a experiência ocupa: o dia marcado, ou cada dia do período (até o limite). */
export function diasDaExperiencia(r: ReferenciaTemporal): string[] {
  if (!r.inicio) return [];
  if (r.precisao === 'data' || r.precisao === 'data_horario') return [r.inicio];
  if (r.precisao !== 'periodo' || !r.fim) return [];
  const dias = [r.inicio];
  while (dias[dias.length - 1] < r.fim) {
    if (dias.length >= LIMITE_DE_DIAS_SUGERIDOS) return [];
    dias.push(somarDias(dias[dias.length - 1], 1));
  }
  return dias;
}

export type DiaDoRoteiro = {
  dia: string;
  /** "Dia 1", "Dia 2"… para os dias da experiência; nulo para um dia fora dela. */
  numero: number | null;
  rotulo: string;
  /** Os itens do dia já em ordem, com os períodos que têm algo. */
  itens: ItemDoRoteiro[];
  periodos: { periodo: Periodo; itens: ItemDoRoteiro[] }[];
};

/** Os dias da experiência (mesmo vazios) e os dias que têm itens, do primeiro ao último. */
export function agruparRoteiro(itens: ItemDoRoteiro[], diasSugeridos: string[], agora: Date): DiaDoRoteiro[] {
  const ordenados = ordenarRoteiro(itens);
  const dias = [...new Set([...diasSugeridos, ...ordenados.map((i) => i.dia)])].sort();
  return dias.map((dia) => {
    const doDia = ordenados.filter((i) => i.dia === dia);
    const numero = diasSugeridos.indexOf(dia);
    return {
      dia,
      numero: numero >= 0 ? numero + 1 : null,
      rotulo: rotuloDoDiaDoRoteiro(dia, agora),
      itens: doDia,
      periodos: PERIODOS.map((periodo) => ({ periodo, itens: doDia.filter((i) => i.periodo === periodo) })).filter(
        (p) => p.itens.length > 0
      ),
    };
  });
}

/** Ordem para quem fica entre dois vizinhos (do mesmo período); sem um deles, um passo além do outro. */
function ordemEntre(antes: ItemDoRoteiro | undefined, depois: ItemDoRoteiro | undefined): number {
  // ponytail: o meio entre dois números perde precisão depois de ~50 inserções seguidas no mesmo
  // lugar; se acontecer, renumerar o período (0, 1, 2…) numa só atualização.
  if (antes && depois) return (antes.ordem + depois.ordem) / 2;
  if (antes) return antes.ordem + 1;
  if (depois) return depois.ordem - 1;
  return 0;
}

/**
 * Ordem de um item guardado pelo editor, entre os outros do mesmo dia e período: com horário, logo
 * antes do primeiro com horário mais tarde (ou logo depois do último com horário até ele); sem
 * horário, no fim.
 */
export function ordemAoGuardar(outros: ItemDoRoteiro[], dia: string, periodo: Periodo, horario: string | null): number {
  const grupo = ordenarRoteiro(outros.filter((i) => i.dia === dia && i.periodo === periodo));
  if (!horario) return ordemEntre(grupo[grupo.length - 1], undefined);
  let indice = grupo.findIndex((i) => i.horario !== null && i.horario > horario);
  if (indice < 0) {
    const ultimoAntes = grupo.map((i) => i.horario !== null).lastIndexOf(true);
    indice = ultimoAntes < 0 ? grupo.length : ultimoAntes + 1;
  }
  return ordemEntre(grupo[indice - 1], grupo[indice]);
}

/**
 * Onde o item fica ao ser solto na posição `indice` entre os outros itens do dia (já em ordem, sem
 * ele), no `periodo` indicado. Um horário que não cabe no novo período sai.
 */
export function posicaoAoSoltar(item: ItemDoRoteiro, outros: ItemDoRoteiro[], indice: number, periodo: Periodo): Posicao {
  const antes = outros[indice - 1]?.periodo === periodo ? outros[indice - 1] : undefined;
  const depois = outros[indice]?.periodo === periodo ? outros[indice] : undefined;
  const horario = item.horario && periodoDaHora(Number(item.horario.slice(0, 2))) === periodo ? item.horario : null;
  return { periodo, ordem: ordemEntre(antes, depois), horario };
}

/**
 * Um passo para cima ou para baixo dentro do dia (os botões de acessibilidade). Na borda de um
 * período, o primeiro passo só troca de período: o item continua no mesmo lugar da lista.
 * Nulo se já está no começo ou no fim do dia.
 */
export function posicaoUmPasso(itensDoDia: ItemDoRoteiro[], id: string, sentido: -1 | 1): Posicao | null {
  const i = itensDoDia.findIndex((x) => x.id === id);
  const vizinho = itensDoDia[i + sentido];
  if (i < 0 || !vizinho) return null;
  const item = itensDoDia[i];
  const outros = itensDoDia.filter((x) => x.id !== id);
  // Nos outros, o vizinho de cima está em i - 1 e o de baixo em i.
  const mesmoPeriodo = vizinho.periodo === item.periodo;
  const indice = sentido < 0 ? (mesmoPeriodo ? i - 1 : i) : mesmoPeriodo ? i + 1 : i;
  return posicaoAoSoltar(item, outros, indice, vizinho.periodo);
}

/** Do formato do banco para o editor; um item novo começa no dia indicado, de manhã. */
export const camposDe = (item: ItemDoRoteiro | null, dia?: string): CamposDoItem => {
  const d = item?.dia ?? dia;
  return {
    dia: d ? d.split('-').reverse().join('/') : '',
    periodo: item?.periodo ?? 'manha',
    horario: item?.horario ?? '',
    texto: item?.texto ?? '',
    links: item?.links ?? [],
  };
};

/** O que vai à tabela do roteiro (sem a ordem e sem os links) a partir do que foi digitado, ou a falha com a mensagem. */
export function validarItem(c: CamposDoItem): Falha | Pick<ItemDoRoteiro, 'dia' | 'periodo' | 'horario' | 'texto'> {
  const texto = c.texto.trim();
  if (!texto) return falha('roteiro_sem_texto');
  if (texto.length > LIMITE_DO_TEXTO_DO_ROTEIRO) return falha('roteiro_texto_longo');
  const dia = lerData(c.dia);
  if (!dia) return falha('roteiro_dia_invalido');
  const horario = c.horario.trim() ? lerHorario(c.horario) : null;
  if (c.horario.trim() && !horario) return falha('roteiro_horario_invalido');
  if (horario && periodoDaHora(Number(horario.slice(0, 2))) !== c.periodo) return falha('roteiro_horario_fora_do_periodo');
  return { dia, periodo: c.periodo, horario, texto };
}

// --- Banco --------------------------------------------------------------------------------------

/**
 * Deixa o item com exatamente estes links: desfaz os que saíram e associa os novos. Um link excluído
 * enquanto o editor estava aberto (aqui ou pela outra pessoa) fica de fora. Devolve os que ficaram.
 */
async function definirLinksDoItem(itemId: string, ids: string[], atuais: string[]): Promise<string[]> {
  if (!supabase) return atuais;
  const sair = atuais.filter((id) => !ids.includes(id));
  const entrar = ids.filter((id) => !atuais.includes(id));
  if (sair.length) {
    const { error } = await supabase.from('roteiro_links').delete().eq('item_id', itemId).in('link_id', sair);
    if (error) throw error;
  }
  if (!entrar.length) return ids;
  const { data, error: erroLeitura } = await supabase.from('links').select('id').in('id', entrar);
  if (erroLeitura) throw erroLeitura;
  const existem = (data ?? []).map((l: { id: string }) => l.id);
  if (existem.length) {
    const { error } = await supabase.from('roteiro_links').insert(existem.map((link_id) => ({ item_id: itemId, link_id })));
    if (error) throw error;
  }
  return ids.filter((id) => !entrar.includes(id) || existem.includes(id));
}

function falhaDoItem(erro: NonNullable<ErroServico>): Falha {
  if (ehErroDeRede(erro)) return falha('rede');
  if (erro.code === '23514') return falha('roteiro_invalido');
  // Recusado pela RLS: o roteiro foi desligado (aqui ou pela outra pessoa).
  if (erro.code === '42501') return falha('roteiro_desligado');
  return falha('roteiro_nao_salvo');
}

export async function listarRoteiro(experienciaId: string): Promise<Resultado<{ itens: ItemDoRoteiro[] }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.from('roteiro').select(COLUNAS).eq('experiencia_id', experienciaId);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return { ok: true, itens: ordenarRoteiro((data as Linha[]).map(paraItem)) };
  } catch {
    return falha('rede');
  }
}

/** `atuais`: o roteiro como está na tela, para achar a posição pelo horário. */
export async function criarItem(
  experienciaId: string,
  campos: CamposDoItem,
  atuais: ItemDoRoteiro[]
): Promise<Resultado<{ item: ItemDoRoteiro }>> {
  if (!supabase) return falha('sem_configuracao');
  const valores = validarItem(campos);
  if ('ok' in valores) return valores;
  const ordem = ordemAoGuardar(atuais, valores.dia, valores.periodo, valores.horario);
  try {
    const { data, error } = await supabase
      .from('roteiro')
      .insert({ experiencia_id: experienciaId, ...valores, ordem })
      .select(COLUNAS)
      .single();
    if (error) return falhaDoItem(error);
    const item = paraItem(data as Linha);
    try {
      item.links = await definirLinksDoItem(item.id, campos.links, []);
    } catch (e) {
      return falhaDoItem(e as NonNullable<ErroServico>);
    }
    return { ok: true, item };
  } catch {
    return falha('rede');
  }
}

/** Mudou o dia, o período ou o horário: o item vai para a posição do horário. Senão, fica onde está. */
export async function editarItem(
  item: ItemDoRoteiro,
  campos: CamposDoItem,
  atuais: ItemDoRoteiro[]
): Promise<Resultado<{ item: ItemDoRoteiro }>> {
  if (!supabase) return falha('sem_configuracao');
  const valores = validarItem(campos);
  if ('ok' in valores) return valores;
  const mudouDeLugar = valores.dia !== item.dia || valores.periodo !== item.periodo || valores.horario !== item.horario;
  const outros = atuais.filter((i) => i.id !== item.id);
  const ordem = mudouDeLugar ? ordemAoGuardar(outros, valores.dia, valores.periodo, valores.horario) : item.ordem;
  const r = await atualizar(item.id, { ...valores, ordem }, falhaDoItem);
  if (!r.ok) return r;
  try {
    r.item.links = await definirLinksDoItem(item.id, campos.links, r.item.links);
  } catch (e) {
    return falhaDoItem(e as NonNullable<ErroServico>);
  }
  return r;
}

/** Depois de arrastar ou de um passo: só período, ordem e horário mudam. */
export function moverItem(id: string, posicao: Posicao): Promise<Resultado<{ item: ItemDoRoteiro }>> {
  return atualizar(id, posicao, (erro) => (ehErroDeRede(erro) ? falha('rede') : falha('roteiro_nao_movido')));
}

async function atualizar(
  id: string,
  valores: Partial<Omit<Linha, 'id' | 'criado_em' | 'links'>>,
  falhou: (erro: NonNullable<ErroServico>) => Falha
): Promise<Resultado<{ item: ItemDoRoteiro }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.from('roteiro').update(valores).eq('id', id).select(COLUNAS);
    if (error) return falhou(error);
    // Nenhuma linha: a outra pessoa excluiu o item (ou desligou o roteiro).
    if (data.length === 0) return falha('roteiro_inexistente');
    return { ok: true, item: paraItem(data[0] as Linha) };
  } catch {
    return falha('rede');
  }
}

/** Excluir algo que já não existe conta como feito. */
export async function excluirItem(id: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { error } = await supabase.from('roteiro').delete().eq('id', id);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return { ok: true };
  } catch {
    return falha('rede');
  }
}
