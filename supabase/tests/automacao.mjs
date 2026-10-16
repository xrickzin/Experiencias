// Integração da Fase 7 contra o Supabase LOCAL: a rotina que passa Planejamento → Vivendo quando o
// instante de início chega (ADR 019). A função é chamada direto, com `p_agora` simulando o relógio;
// casos que dependem do relógio real (data passada, volta manual) usam o padrão `now()`.
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/automacao.mjs

import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../app/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');

const saida = execSync('npx --yes supabase@2.119.0 status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const status = {};
for (const linha of saida.split('\n')) {
  const m = linha.trim().match(/^([A-Z_]+)="?(.*?)"?$/);
  if (m) status[m[1]] = m[2];
}
if (!status.API_URL?.startsWith('http://127.0.0.1') && !status.API_URL?.startsWith('http://localhost')) {
  console.error('Abortado: a URL não é do Supabase local.');
  process.exit(2);
}

let falhas = 0;
const confere = (nome, ok, detalhe = '') => {
  if (!ok) falhas++;
  console.log(ok ? 'ok   ' : 'FALHA', nome, ok ? '' : detalhe);
};
const memoria = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};
const aparelho = () =>
  createClient(status.API_URL, status.PUBLISHABLE_KEY, {
    auth: { storage: memoria(), persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'pkce' },
  });
const servidor = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const sufixo = Date.now().toString(36);
async function pessoa(nome) {
  const c = aparelho();
  const r = await c.auth.signUp({ email: `${nome}-${sufixo}@exemplo.test`, password: 'senha-forte-1' });
  if (r.error) throw new Error(`cadastro de ${nome}: ${r.error.message}`);
  return c;
}

const ana = await pessoa('ana');
const caio = await pessoa('caio');
await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `fase7 ${sufixo}`, p_fuso: 'America/Sao_Paulo' });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `toquio7 ${sufixo}`, p_fuso: 'Asia/Tokyo' });

const COLUNAS = 'id, titulo, estado, referencia_precisao, referencia_inicio, referencia_fim, referencia_horario, inicio_em, armado_em';
const ler = async (cliente, id) => (await cliente.from('experiencias').select(COLUNAS).eq('id', id).single()).data;
const estado = async (cliente, id) => (await ler(cliente, id))?.estado;
const mudar = (cliente, id, novo) => cliente.rpc('mudar_estado', { p_experiencia: id, p_estado: novo });
/** Cria e leva até Planejamento (a menos que `fica` diga outro estado). */
async function planejamento(cliente, titulo, ref = {}, fica = 'planejamento') {
  const { data } = await cliente.from('experiencias').insert({ titulo, ...ref }).select('id').single();
  if (fica !== 'desejo') await mudar(cliente, data.id, 'planejamento');
  return data.id;
}
const rodar = async (agora) => {
  const r = await servidor.rpc('iniciar_experiencias_do_momento', agora ? { p_agora: agora } : {});
  if (r.error) throw new Error(`rotina: ${r.error.message}`);
  return r.data;
};
const data = (dia) => ({ referencia_precisao: 'data', referencia_inicio: dia });

// --- o início chega ------------------------------------------------------------------------------
let id = await planejamento(ana, 'Teatro', data('2030-03-10'));
await rodar('2030-03-10T02:59:00Z');
confere('antes de 00:00 no fuso do Laço, continua em Planejamento', (await estado(ana, id)) === 'planejamento');
const antes = await ler(ana, id);
await rodar('2030-03-10T03:00:00Z');
const depois = await ler(ana, id);
confere('às 00:00 em São Paulo (03:00 UTC), vira Vivendo', depois?.estado === 'vivendo', JSON.stringify(depois));
confere(
  'a automação não muda título nem referência (precisão preservada)',
  depois?.titulo === 'Teatro' && depois?.referencia_precisao === 'data' && depois?.referencia_inicio === '2030-03-10',
  JSON.stringify(depois)
);
confere('a transição automática renova armado_em', new Date(depois?.armado_em) > new Date(antes?.armado_em));

id = await planejamento(ana, 'Jantar', { referencia_precisao: 'data_horario', referencia_inicio: '2030-06-01', referencia_horario: '19:30' });
await rodar('2030-06-01T22:29:00Z');
confere('data + horário: um minuto antes, nada', (await estado(ana, id)) === 'planejamento');
await rodar('2030-06-01T22:30:00Z');
confere('data + horário: no horário do fuso, vira Vivendo', (await estado(ana, id)) === 'vivendo');

id = await planejamento(ana, 'Feriado', { referencia_precisao: 'periodo', referencia_inicio: '2030-05-01', referencia_fim: '2030-05-03' });
await rodar('2030-05-01T03:00:00Z');
confere('período: vira Vivendo no início do período', (await estado(ana, id)) === 'vivendo');

id = await planejamento(caio, 'Templo', data('2030-07-01'));
await rodar('2030-06-30T14:59:00Z');
confere('outro fuso (Tóquio): antes da 00:00 de lá, nada', (await estado(caio, id)) === 'planejamento');
await rodar('2030-06-30T15:00:00Z');
confere('outro fuso (Tóquio): 00:00 de lá = 15:00 UTC do dia anterior', (await estado(caio, id)) === 'vivendo');

// --- nova data futura reabilita ------------------------------------------------------------------
id = await planejamento(ana, 'Show', data('2030-08-01'));
await rodar('2030-08-01T03:00:00Z');
await mudar(ana, id, 'planejamento');
await ana.from('experiencias').update(data('2030-09-01')).eq('id', id);
await rodar('2030-09-01T03:00:00Z');
confere('voltou a Planejamento e ganhou nova data futura: dispara de novo', (await estado(ana, id)) === 'vivendo');

// --- o que nunca dispara (relógio real) -----------------------------------------------------------
const passada = await planejamento(ana, 'Data passada', data('2020-01-01'));
const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const deHoje = await planejamento(ana, 'Hoje sem horário', data(hoje));
const volta = await planejamento(ana, 'Volta manual', data('2020-02-01'));
await mudar(ana, volta, 'vivendo');
await mudar(ana, volta, 'planejamento');
await rodar();
confere('data já passada ao definir: não dispara', (await estado(ana, passada)) === 'planejamento');
confere('hoje sem horário (00:00 já passou): não dispara', (await estado(ana, deHoje)) === 'planejamento');
confere('voltou manualmente a Planejamento: não repete', (await estado(ana, volta)) === 'planejamento');

const semData = await planejamento(ana, 'Sem data');
const mes = await planejamento(ana, 'Só o mês', { referencia_precisao: 'mes_ano', referencia_inicio: '2030-03-01' });
const desejo = await planejamento(ana, 'Desejo com data', data('2030-03-10'), 'desejo');
await rodar('2099-01-01T00:00:00Z');
confere('sem data: nunca dispara', (await estado(ana, semData)) === 'planejamento');
confere('mês/ano: nunca dispara', (await estado(ana, mes)) === 'planejamento');
confere('Desejo com data: a automação só atua em Planejamento', (await estado(ana, desejo)) === 'desejo');
confere('data passada continua parada mesmo muito depois', (await estado(ana, passada)) === 'planejamento');

// --- só o servidor --------------------------------------------------------------------------------
let r = await ana.rpc('iniciar_experiencias_do_momento');
confere('o aplicativo (sessão de usuário) não chama a rotina', r.error !== null, JSON.stringify(r.data));
r = await aparelho().rpc('iniciar_experiencias_do_momento');
confere('sem sessão, também não', r.error !== null, JSON.stringify(r.data));

console.log(falhas === 0 ? '\nTodas as verificações passaram.' : `\n${falhas} verificação(ões) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
