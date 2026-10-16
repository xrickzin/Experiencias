// Integração da Fase 3 contra o Supabase LOCAL: referência temporal, instante de início no fuso do
// Laço, armado_em e transições de estado validadas no servidor.
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/planejamento.mjs

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
const sufixo = Date.now().toString(36);
async function pessoa(nome) {
  const c = aparelho();
  const r = await c.auth.signUp({ email: `${nome}-${sufixo}@exemplo.test`, password: 'senha-forte-1' });
  if (r.error) throw new Error(`cadastro de ${nome}: ${r.error.message}`);
  return c;
}
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

const ana = await pessoa('ana');
const bia = await pessoa('bia');
const caio = await pessoa('caio');
let r = await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `fase3 ${sufixo}`, p_fuso: 'America/Sao_Paulo' });
confere('Laço criado no fuso de São Paulo', r.data?.ok === true, JSON.stringify(r.data ?? r.error));
await bia.rpc('vincular_laco', { p_palavra: `fase3 ${sufixo}` });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outro3 ${sufixo}`, p_fuso: null });

const COLUNAS = 'id, estado, referencia_precisao, referencia_inicio, referencia_fim, referencia_horario, inicio_em, armado_em, atualizado_em';
const criar = async (cliente, campos) => (await cliente.from('experiencias').insert(campos).select(COLUNAS)).data?.[0];
const editar = (cliente, id, campos) => cliente.from('experiencias').update(campos).eq('id', id).select(COLUNAS);

// --- referência temporal e instante de início ------------------------------------------------------
let e = await criar(ana, { titulo: 'Sem data' });
confere('nasce sem data e sem instante de início', e?.referencia_precisao === 'sem_data' && e?.inicio_em === null, JSON.stringify(e));

e = await criar(ana, { titulo: 'Data', referencia_precisao: 'data', referencia_inicio: '2026-12-10' });
confere('data → 00:00 no fuso do Laço (03:00 UTC em São Paulo)', new Date(e?.inicio_em).toISOString() === '2026-12-10T03:00:00.000Z', e?.inicio_em);

e = await criar(ana, { titulo: 'Data e hora', referencia_precisao: 'data_horario', referencia_inicio: '2026-12-10', referencia_horario: '19:30' });
confere('data + horário → esse horário no fuso', new Date(e?.inicio_em).toISOString() === '2026-12-10T22:30:00.000Z', e?.inicio_em);

e = await criar(ana, { titulo: 'Período', referencia_precisao: 'periodo', referencia_inicio: '2026-12-12', referencia_fim: '2026-12-15' });
confere('período → início do período', new Date(e?.inicio_em).toISOString() === '2026-12-12T03:00:00.000Z', e?.inicio_em);

e = await criar(ana, { titulo: 'Mês', referencia_precisao: 'mes_ano', referencia_inicio: '2026-12-01' });
confere('mês/ano guarda a precisão e não tem instante de início', e?.referencia_precisao === 'mes_ano' && e?.inicio_em === null, JSON.stringify(e));

for (const [nome, campos] of [
  ['data sem dia', { referencia_precisao: 'data' }],
  ['mês/ano fora do dia 1', { referencia_precisao: 'mes_ano', referencia_inicio: '2026-12-05' }],
  ['período com fim antes do início', { referencia_precisao: 'periodo', referencia_inicio: '2026-12-15', referencia_fim: '2026-12-12' }],
  ['data + horário sem horário', { referencia_precisao: 'data_horario', referencia_inicio: '2026-12-10' }],
  ['sem data com dia preenchido', { referencia_precisao: 'sem_data', referencia_inicio: '2026-12-10' }],
  ['precisão desconhecida', { referencia_precisao: 'semana', referencia_inicio: '2026-12-10' }],
]) {
  const res = await ana.from('experiencias').insert({ titulo: nome, ...campos }).select('id');
  confere(`referência incoerente recusada: ${nome}`, Boolean(res.error), JSON.stringify(res.data));
}

const proibidos = await ana.from('experiencias').insert({ titulo: 'x', inicio_em: '2020-01-01T00:00:00Z' }).select('id');
confere('o cliente não escreve o instante de início', Boolean(proibidos.error));
const proibido2 = await ana.from('experiencias').insert({ titulo: 'x', armado_em: '2020-01-01T00:00:00Z' }).select('id');
confere('o cliente não escreve armado_em', Boolean(proibido2.error));

// --- armado_em (anti-loop da automação) ----------------------------------------------------------
const viagem = await criar(ana, { titulo: 'Viagem', referencia_precisao: 'data', referencia_inicio: '2026-12-10' });
await espera(1100);
r = await editar(ana, viagem.id, { titulo: 'Viagem para a serra' });
confere('editar só o título não muda armado_em', r.data?.[0]?.armado_em === viagem.armado_em, JSON.stringify(r.data?.[0]));
await espera(1100);
r = await editar(bia, viagem.id, { referencia_inicio: '2026-12-11' });
const armadoDepoisDaData = r.data?.[0]?.armado_em;
confere('editar a referência muda armado_em e o instante', new Date(armadoDepoisDaData) > new Date(viagem.armado_em) && new Date(r.data?.[0]?.inicio_em).toISOString() === '2026-12-11T03:00:00.000Z', JSON.stringify(r.data?.[0]));

// --- transições ----------------------------------------------------------------------------------
await espera(1100);
r = await ana.rpc('mudar_estado', { p_experiencia: viagem.id, p_estado: 'planejamento' });
confere('Desejo → Planejamento', r.data?.ok === true, JSON.stringify(r.data ?? r.error));
let linha = (await ana.from('experiencias').select(COLUNAS).eq('id', viagem.id)).data?.[0];
confere('a transição muda armado_em', new Date(linha.armado_em) > new Date(armadoDepoisDaData), JSON.stringify(linha));
confere('a transição preserva título e referência', linha.referencia_inicio === '2026-12-11' && linha.estado === 'planejamento');

r = await bia.rpc('mudar_estado', { p_experiencia: viagem.id, p_estado: 'vivendo' });
confere('Planejamento → Vivendo (pela outra pessoa)', r.data?.ok === true, JSON.stringify(r.data ?? r.error));
r = await ana.rpc('mudar_estado', { p_experiencia: viagem.id, p_estado: 'desejo' });
confere('Vivendo → Desejo direto é recusado', r.data?.codigo === 'transicao_invalida', JSON.stringify(r.data ?? r.error));
r = await ana.rpc('mudar_estado', { p_experiencia: viagem.id, p_estado: 'memoria' });
confere('Vivendo → Memória ainda não existe nesta fase', r.data?.codigo === 'transicao_invalida', JSON.stringify(r.data ?? r.error));
r = await ana.rpc('mudar_estado', { p_experiencia: viagem.id, p_estado: 'planejamento' });
confere('Vivendo → Planejamento', r.data?.ok === true, JSON.stringify(r.data ?? r.error));
r = await ana.rpc('mudar_estado', { p_experiencia: viagem.id, p_estado: 'desejo' });
confere('Planejamento → Desejo', r.data?.ok === true, JSON.stringify(r.data ?? r.error));
r = await ana.rpc('mudar_estado', { p_experiencia: viagem.id, p_estado: 'vivendo' });
confere('Desejo → Vivendo direto é recusado', r.data?.codigo === 'transicao_invalida', JSON.stringify(r.data ?? r.error));
r = await ana.rpc('mudar_estado', { p_experiencia: viagem.id, p_estado: 'qualquer' });
confere('estado desconhecido é recusado', r.data?.codigo === 'transicao_invalida', JSON.stringify(r.data ?? r.error));

r = await caio.rpc('mudar_estado', { p_experiencia: viagem.id, p_estado: 'planejamento' });
confere('outro Laço não muda o estado (resposta de inexistente)', r.data?.codigo === 'experiencia_inexistente', JSON.stringify(r.data ?? r.error));
r = await aparelho().rpc('mudar_estado', { p_experiencia: viagem.id, p_estado: 'planejamento' });
confere('sem sessão não muda o estado', Boolean(r.error) || r.data?.ok === false, JSON.stringify(r.data));
r = await ana.from('experiencias').update({ estado: 'vivendo' }).eq('id', viagem.id).select('id');
confere('o cliente continua sem poder escrever o estado direto', Boolean(r.error), JSON.stringify(r.data));

// --- edição em qualquer estado e limpeza da referência --------------------------------------------
await ana.rpc('mudar_estado', { p_experiencia: viagem.id, p_estado: 'planejamento' });
r = await editar(bia, viagem.id, { local: 'Serra', referencia_precisao: 'sem_data', referencia_inicio: null });
confere('em Planejamento, o outro membro edita e pode voltar a "sem data"', r.data?.[0]?.referencia_precisao === 'sem_data' && r.data?.[0]?.inicio_em === null, JSON.stringify(r.data?.[0] ?? r.error));
r = await ana.from('experiencias').delete().eq('id', viagem.id).select('id');
confere('excluir vale em Planejamento', r.data?.length === 1, JSON.stringify(r.data ?? r.error));

console.log(falhas === 0 ? '\nTODOS OS TESTES DA FASE 3 PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
