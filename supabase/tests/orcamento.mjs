// Orçamento estimado (ADR 038, etapa 5; ADR 041) contra o Supabase LOCAL.
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/orcamento.mjs

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
const j = (r) => JSON.stringify(r.data ?? r.error);

const ana = await pessoa('ana');
const bia = await pessoa('bia');
const caio = await pessoa('caio');
await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `orcamento ${sufixo}`, p_fuso: null });
await bia.rpc('vincular_laco', { p_palavra: `orcamento ${sufixo}` });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outroorcamento ${sufixo}`, p_fuso: null });

const COLUNAS = 'id, orcamento_ativo, orcamento_centavos';
const exp = (await ana.from('experiencias').insert({ titulo: 'Fim de semana na serra' }).select(COLUNAS)).data[0];
confere('o orçamento começa desligado e sem valor', exp.orcamento_ativo === false && exp.orcamento_centavos === null, JSON.stringify(exp));

// --- Desligado, sem valor ------------------------------------------------------------------------
let r = await ana.from('experiencias').update({ orcamento_centavos: 120000 }).eq('id', exp.id).select(COLUNAS);
confere('com o orçamento desligado, não aceita valor', Boolean(r.error), j(r));

r = await bia.from('experiencias').update({ orcamento_ativo: true }).eq('id', exp.id).select(COLUNAS);
confere('a outra pessoa liga o orçamento', r.data?.[0]?.orcamento_ativo === true, j(r));
r = await ana.from('experiencias').insert({ titulo: 'Já com orçamento', orcamento_ativo: true, orcamento_centavos: 50000 }).select(COLUNAS);
confere('dá para criar já com orçamento e valor', r.data?.[0]?.orcamento_centavos === 50000, j(r));
const outra = r.data?.[0];

// --- Valor ---------------------------------------------------------------------------------------
r = await bia.from('experiencias').update({ orcamento_centavos: 120000 }).eq('id', exp.id).select(COLUNAS);
confere('guardar R$ 1.200,00 (em centavos)', r.data?.[0]?.orcamento_centavos === 120000, j(r));
r = await ana.from('experiencias').update({ orcamento_centavos: 0 }).eq('id', exp.id).select(COLUNAS);
confere('zero é aceito (de graça)', r.data?.[0]?.orcamento_centavos === 0, j(r));
r = await ana.from('experiencias').update({ orcamento_centavos: 10000000 }).eq('id', exp.id).select(COLUNAS);
confere('R$ 100.000,00 é o máximo aceito', r.data?.[0]?.orcamento_centavos === 10000000, j(r));
r = await ana.from('experiencias').update({ orcamento_centavos: 10000001 }).eq('id', exp.id).select(COLUNAS);
confere('acima do máximo é recusado', Boolean(r.error), j(r));
r = await ana.from('experiencias').update({ orcamento_centavos: -1 }).eq('id', exp.id).select(COLUNAS);
confere('negativo é recusado', Boolean(r.error), j(r));
r = await ana.from('experiencias').update({ orcamento_centavos: null }).eq('id', exp.id).select(COLUNAS);
confere('tirar o valor deixa o orçamento ligado', r.data?.[0]?.orcamento_centavos === null && r.data?.[0]?.orcamento_ativo === true, j(r));

// --- Outro Laço ----------------------------------------------------------------------------------
r = await caio.from('experiencias').update({ orcamento_centavos: 999 }).eq('id', exp.id).select(COLUNAS);
confere('outro Laço não muda o valor', !r.error && r.data?.length === 0, j(r));
r = await caio.from('experiencias').select(COLUNAS).eq('id', exp.id);
confere('outro Laço não lê', r.data?.length === 0, j(r));

// --- Desligar apaga ------------------------------------------------------------------------------
await ana.from('experiencias').update({ orcamento_centavos: 80000 }).eq('id', exp.id);
r = await ana.from('experiencias').update({ titulo: 'Serra' }).eq('id', exp.id).select(COLUNAS);
confere('salvar outras coisas mantém o valor', r.data?.[0]?.orcamento_centavos === 80000, j(r));
r = await bia.from('experiencias').update({ orcamento_ativo: false }).eq('id', exp.id).select(COLUNAS);
confere('desligar apaga o valor', r.data?.[0]?.orcamento_ativo === false && r.data?.[0]?.orcamento_centavos === null, j(r));

// --- Sem sessão ----------------------------------------------------------------------------------
r = await aparelho().from('experiencias').update({ orcamento_centavos: 1 }).eq('id', outra.id).select(COLUNAS);
confere('sem sessão, não muda nada', !r.error ? r.data?.length === 0 : true, j(r));
await ana.from('experiencias').delete().in('id', [exp.id, outra.id]);

console.log(falhas === 0 ? '\nTODOS OS TESTES DO ORÇAMENTO PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
