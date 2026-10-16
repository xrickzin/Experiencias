// Integração da legenda das fotos e do momento das observações (ADR 030) contra o Supabase LOCAL.
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/legendas.mjs

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
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
const j = (r) => JSON.stringify(r.data ?? r.error);

const ana = await pessoa('ana');
const bia = await pessoa('bia');
const caio = await pessoa('caio');
await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `legenda ${sufixo}`, p_fuso: null });
await bia.rpc('vincular_laco', { p_palavra: `legenda ${sufixo}` });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outraleg ${sufixo}`, p_fuso: null });
const lacoId = (await ana.rpc('meu_perfil')).data.laco_id;

const exp = (await ana.from('experiencias').insert({ titulo: 'Serra' }).select('id')).data[0];
await ana.rpc('mudar_estado', { p_experiencia: exp.id, p_estado: 'planejamento' });
const caminho = `${lacoId}/${exp.id}/a.jpg`;
await ana.storage.from('experiencias').upload(caminho, JPEG, { contentType: 'image/jpeg' });
const foto = (await ana.from('registros').insert({ experiencia_id: exp.id, caminho }).select('id')).data[0];
const legendar = (cliente, legenda) =>
  cliente.from('registros').update({ legenda }).eq('id', foto.id).select('legenda, autor_id');

// --- Legenda ---------------------------------------------------------------------------------------
let r = await legendar(bia, 'Primeira noite na serra');
confere('Bia legenda a foto de Ana', r.data?.[0]?.legenda === 'Primeira noite na serra', j(r));

r = await legendar(ana, 'Primeira noite, com chuva');
confere('Ana troca a legenda; a foto continua dela', r.data?.[0]?.legenda === 'Primeira noite, com chuva', j(r));

r = await legendar(ana, '   ');
confere('legenda em branco é recusada', Boolean(r.error), j(r));

r = await legendar(ana, 'a'.repeat(301));
confere('legenda acima de 300 caracteres é recusada', Boolean(r.error), j(r));

r = await legendar(caio, 'invasão');
confere('outro Laço não legenda', !r.error && r.data?.length === 0, j(r));

r = await legendar(ana, null);
confere('tirar a legenda', !r.error && r.data?.[0]?.legenda === null, j(r));

// --- Observação: sem legenda, com momento -----------------------------------------------------------
r = await ana
  .from('registros')
  .insert({ experiencia_id: exp.id, tipo: 'observacao', texto: 'Café da manhã na pousada', capturada_em: '2026-10-11T12:00:00Z' })
  .select('id, capturada_em');
const obs = r.data?.[0];
confere('observação nasce no momento escolhido', obs?.capturada_em?.startsWith('2026-10-11T12:00:00'), j(r));

r = await bia.from('registros').update({ capturada_em: '2026-10-11T00:00:00Z' }).eq('id', obs.id).select('capturada_em');
confere('a outra pessoa muda o momento da observação', r.data?.[0]?.capturada_em?.startsWith('2026-10-11T00:00:00'), j(r));

r = await ana.from('registros').update({ capturada_em: '2099-01-01T00:00:00Z' }).eq('id', obs.id).select('id');
confere('momento no futuro distante é recusado', Boolean(r.error), j(r));

r = await ana.from('registros').update({ legenda: 'não cabe' }).eq('id', obs.id).select('id');
confere('observação não tem legenda', Boolean(r.error), j(r));

r = await caio.from('registros').update({ capturada_em: '2026-10-10T00:00:00Z' }).eq('id', obs.id).select('id');
confere('outro Laço não muda o momento', !r.error && r.data?.length === 0, j(r));

// Limpeza: arquivo antes da linha.
// --- Quando a foto foi tirada, escolhido à mão (ADR 032) ------------------------------------------
r = await bia.from('registros').update({ capturada_em: '2022-06-11T00:00:00Z' }).eq('id', foto.id).select('capturada_em, autor_id');
confere('a outra pessoa corrige quando a foto foi tirada', r.data?.[0]?.capturada_em?.startsWith('2022-06-11T00:00:00'), j(r));
r = await ana.from('registros').update({ capturada_em: '2099-01-01T00:00:00Z' }).eq('id', foto.id).select('id');
confere('data da foto no futuro distante é recusada', Boolean(r.error), j(r));
r = await caio.from('registros').update({ capturada_em: '2020-01-01T00:00:00Z' }).eq('id', foto.id).select('id');
confere('outro Laço não muda a data da foto', !r.error && r.data?.length === 0, j(r));

await ana.storage.from('experiencias').remove([caminho]);
await ana.from('experiencias').delete().eq('id', exp.id);

console.log(falhas === 0 ? '\nTODOS OS TESTES DE LEGENDA E MOMENTO PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
