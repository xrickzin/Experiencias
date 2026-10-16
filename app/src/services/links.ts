// Links de uma experiência (ADR 039): o restaurante, o ingresso, o lugar no Google Maps. Os dois criam,
// editam e excluem; o autor é definido pelo servidor.
import { ehErroDeRede, falha, type ErroServico, type Falha, type Resultado } from '@/services/laco';
import { supabase } from '@/services/supabase';

export type Link = { id: string; titulo: string; url: string; criadoEm: string };

export const LIMITE_DO_TITULO_DO_LINK = 60;
const LIMITE_DO_ENDERECO = 2000;

type Linha = { id: string; titulo: string; url: string; criado_em: string };
const COLUNAS = 'id, titulo, url, criado_em';
const paraLink = (l: Linha): Link => ({ id: l.id, titulo: l.titulo, url: l.url, criadoEm: l.criado_em });

/**
 * O endereço a guardar a partir do que foi colado. O "Compartilhar" do Google Maps manda o nome do
 * lugar junto com o link: fica só o link. Sem `http`, entende como `https://`. Inválido: `null`.
 */
export function lerEndereco(texto: string): string | null {
  const limpo = texto.trim();
  const url = limpo.match(/https?:\/\/\S+/i)?.[0] ?? (/^[^\s/]+\.[^\s]+$/.test(limpo) ? `https://${limpo}` : null);
  return url && url.length <= LIMITE_DO_ENDERECO ? url : null;
}

/** O que aparece abaixo do título: "Google Maps" para lugares no mapa; senão, o domínio. */
export function descreverEndereco(url: string): { dominio: string; mapa: boolean } {
  const [host, ...resto] = url.replace(/^https?:\/\//i, '').toLowerCase().replace(/^www\./, '').split('/');
  const caminho = resto.join('/');
  const mapa =
    host === 'maps.app.goo.gl' ||
    host.startsWith('maps.google.') ||
    ((host === 'goo.gl' || host.startsWith('google.')) && caminho.startsWith('maps'));
  return { dominio: mapa ? 'Google Maps' : host.split(/[?#]/)[0], mapa };
}

/** Pesquisa o texto do campo Local no Google Maps (abre o app, se instalado). Sem chave de API. */
export const enderecoNoMapa = (local: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(local.trim())}`;

function validar(titulo: string, endereco: string): Falha | { titulo: string; url: string } {
  const limpo = titulo.trim();
  if (!limpo) return falha('link_sem_titulo');
  if (limpo.length > LIMITE_DO_TITULO_DO_LINK) return falha('link_titulo_longo');
  const url = lerEndereco(endereco);
  if (!url) return falha('link_endereco_invalido');
  return { titulo: limpo, url };
}

function falhaDoLink(erro: NonNullable<ErroServico>): Falha {
  if (ehErroDeRede(erro)) return falha('rede');
  return falha(erro.code === '23514' ? 'link_endereco_invalido' : 'link_nao_salvo');
}

export async function listarLinks(experienciaId: string): Promise<Resultado<{ links: Link[] }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('links')
      .select(COLUNAS)
      .eq('experiencia_id', experienciaId)
      .order('criado_em', { ascending: true });
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return { ok: true, links: (data as Linha[]).map(paraLink) };
  } catch {
    return falha('rede');
  }
}

export async function criarLink(experienciaId: string, titulo: string, endereco: string): Promise<Resultado<{ link: Link }>> {
  if (!supabase) return falha('sem_configuracao');
  const campos = validar(titulo, endereco);
  if ('ok' in campos) return campos;
  try {
    const { data, error } = await supabase
      .from('links')
      .insert({ experiencia_id: experienciaId, ...campos })
      .select(COLUNAS)
      .single();
    if (error) return falhaDoLink(error);
    return { ok: true, link: paraLink(data as Linha) };
  } catch {
    return falha('rede');
  }
}

export async function editarLink(id: string, titulo: string, endereco: string): Promise<Resultado<{ link: Link }>> {
  if (!supabase) return falha('sem_configuracao');
  const campos = validar(titulo, endereco);
  if ('ok' in campos) return campos;
  try {
    const { data, error } = await supabase.from('links').update(campos).eq('id', id).select(COLUNAS);
    if (error) return falhaDoLink(error);
    // Nenhuma linha: a outra pessoa excluiu.
    if (data.length === 0) return falha('link_inexistente');
    return { ok: true, link: paraLink(data[0] as Linha) };
  } catch {
    return falha('rede');
  }
}

/** Excluir algo que já não existe conta como feito. */
export async function excluirLink(id: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { error } = await supabase.from('links').delete().eq('id', id);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return { ok: true };
  } catch {
    return falha('rede');
  }
}
