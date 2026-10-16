// Reservas de uma experiência (ADR 038, etapa 3): hospedagem, transporte, ingresso, mesa. Só o tipo e o
// nome são obrigatórios. Os dois criam, editam e excluem; o autor é definido pelo servidor.
import { ehErroDeRede, falha, type ErroServico, type Falha, type Resultado } from '@/services/laco';
import { lerEndereco } from '@/services/links';
import { descreverReferencia, lerData, lerHorario } from '@/services/referencia-temporal';
import { supabase } from '@/services/supabase';

export type TipoDeReserva = 'hospedagem' | 'transporte' | 'ingresso' | 'mesa' | 'outro';

export const TIPOS_DE_RESERVA: { valor: TipoDeReserva; rotulo: string }[] = [
  { valor: 'hospedagem', rotulo: 'Hospedagem' },
  { valor: 'transporte', rotulo: 'Transporte' },
  { valor: 'ingresso', rotulo: 'Ingresso' },
  { valor: 'mesa', rotulo: 'Mesa' },
  { valor: 'outro', rotulo: 'Outro' },
];

export type Reserva = {
  id: string;
  tipo: TipoDeReserva;
  nome: string;
  /** `AAAA-MM-DD`. */
  data: string | null;
  /** `HH:MM`, só com `data`. */
  horario: string | null;
  codigo: string | null;
  url: string | null;
  criadoEm: string;
};

/** O que foi digitado no editor: data como DD/MM/AAAA e horário como HH:MM, vazios quando não há. */
export type CamposDaReserva = { tipo: TipoDeReserva; nome: string; data: string; horario: string; codigo: string; endereco: string };

export const LIMITE_DO_NOME_DA_RESERVA = 80;
export const LIMITE_DO_CODIGO = 60;

type Linha = Omit<Reserva, 'criadoEm'> & { criado_em: string };
const COLUNAS = 'id, tipo, nome, data, horario, codigo, url, criado_em';
const paraReserva = ({ criado_em, ...l }: Linha): Reserva => ({ ...l, horario: l.horario?.slice(0, 5) ?? null, criadoEm: criado_em });

/** Por dia e horário; as sem dia no fim, na ordem em que foram guardadas. */
export function ordenarReservas(reservas: Reserva[]): Reserva[] {
  const chave = (r: Reserva) => `${r.data ?? '9999-99-99'}T${r.horario ?? '00:00'}|${r.criadoEm}`;
  return [...reservas].sort((a, b) => chave(a).localeCompare(chave(b)));
}

/** "12 de dezembro de 2026, 14:00", ou nulo sem dia. */
export function descreverQuando(r: Pick<Reserva, 'data' | 'horario'>): string | null {
  if (!r.data) return null;
  return descreverReferencia({ precisao: r.horario ? 'data_horario' : 'data', inicio: r.data, fim: null, horario: r.horario });
}

/** Do formato do banco para o editor. */
export const camposDe = (r: Reserva | null): CamposDaReserva => ({
  tipo: r?.tipo ?? 'outro',
  nome: r?.nome ?? '',
  data: r?.data ? r.data.split('-').reverse().join('/') : '',
  horario: r?.horario ?? '',
  codigo: r?.codigo ?? '',
  endereco: r?.url ?? '',
});

/** O que vai ao banco a partir do que foi digitado, ou a falha com a mensagem. */
export function validarReserva(c: CamposDaReserva): Falha | Omit<Linha, 'id' | 'criado_em'> {
  const nome = c.nome.trim();
  if (!nome) return falha('reserva_sem_nome');
  if (nome.length > LIMITE_DO_NOME_DA_RESERVA) return falha('reserva_nome_longo');
  const data = c.data.trim() ? lerData(c.data) : null;
  if (c.data.trim() && !data) return falha('reserva_data_invalida');
  const horario = c.horario.trim() ? lerHorario(c.horario) : null;
  if (c.horario.trim() && !horario) return falha('reserva_horario_invalido');
  if (horario && !data) return falha('reserva_horario_sem_dia');
  const codigo = c.codigo.trim() || null;
  if (codigo && codigo.length > LIMITE_DO_CODIGO) return falha('reserva_codigo_longo');
  const url = c.endereco.trim() ? lerEndereco(c.endereco) : null;
  if (c.endereco.trim() && !url) return falha('link_endereco_invalido');
  return { tipo: c.tipo, nome, data, horario, codigo, url };
}

function falhaDaReserva(erro: NonNullable<ErroServico>): Falha {
  if (ehErroDeRede(erro)) return falha('rede');
  return falha(erro.code === '23514' ? 'reserva_invalida' : 'reserva_nao_salva');
}

export async function listarReservas(experienciaId: string): Promise<Resultado<{ reservas: Reserva[] }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.from('reservas').select(COLUNAS).eq('experiencia_id', experienciaId);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return { ok: true, reservas: ordenarReservas((data as Linha[]).map(paraReserva)) };
  } catch {
    return falha('rede');
  }
}

export async function criarReserva(experienciaId: string, campos: CamposDaReserva): Promise<Resultado<{ reserva: Reserva }>> {
  if (!supabase) return falha('sem_configuracao');
  const valores = validarReserva(campos);
  if ('ok' in valores) return valores;
  try {
    const { data, error } = await supabase
      .from('reservas')
      .insert({ experiencia_id: experienciaId, ...valores })
      .select(COLUNAS)
      .single();
    if (error) return falhaDaReserva(error);
    return { ok: true, reserva: paraReserva(data as Linha) };
  } catch {
    return falha('rede');
  }
}

export async function editarReserva(id: string, campos: CamposDaReserva): Promise<Resultado<{ reserva: Reserva }>> {
  if (!supabase) return falha('sem_configuracao');
  const valores = validarReserva(campos);
  if ('ok' in valores) return valores;
  try {
    const { data, error } = await supabase.from('reservas').update(valores).eq('id', id).select(COLUNAS);
    if (error) return falhaDaReserva(error);
    // Nenhuma linha: a outra pessoa excluiu.
    if (data.length === 0) return falha('reserva_inexistente');
    return { ok: true, reserva: paraReserva(data[0] as Linha) };
  } catch {
    return falha('rede');
  }
}

/** Excluir algo que já não existe conta como feito. */
export async function excluirReserva(id: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { error } = await supabase.from('reservas').delete().eq('id', id);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return { ok: true };
  } catch {
    return falha('rede');
  }
}
