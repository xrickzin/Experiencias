// Links das experiências (ADR 039) contra o Supabase LOCAL.
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/links.mjs

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
await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `links ${sufixo}`, p_fuso: null });
await bia.rpc('vincular_laco', { p_palavra: `links ${sufixo}` });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outrolink ${sufixo}`, p_fuso: null });

const exp = (await ana.from('experiencias').insert({ titulo: 'Fim de semana na serra' }).select('id')).data[0];
const membroDeBia = (await bia.rpc('meu_membro_id')).data;

// --- Criar -------------------------------------------------------------------------------------
let r = await bia
  .from('links')
  .insert({ experiencia_id: exp.id, titulo: 'Pousada', url: 'https://maps.app.goo.gl/abc123' })
  .select('id, titulo, url, autor_id, laco_id');
const link = r.data?.[0];
confere('em Desejo, a outra pessoa guarda um link', link?.titulo === 'Pousada', j(r));
confere('o autor é quem criou', !membroDeBia || link?.autor_id === membroDeBia, j(r));
r = await ana.from('links').select('id').eq('experiencia_id', exp.id);
confere('os dois veem o link', r.data?.length === 1, j(r));

for (const [nome, campos] of [
  ['título vazio é recusado', { titulo: '  ', url: 'https://a.com' }],
  ['título acima de 60 caracteres é recusado', { titulo: 'x'.repeat(61), url: 'https://a.com' }],
  ['endereço sem http(s) é recusado', { titulo: 'X', url: 'javascript:alert(1)' }],
  ['endereço com espaço é recusado', { titulo: 'X', url: 'https://a.com/um dois' }],
  ['endereço acima de 2.000 caracteres é recusado', { titulo: 'X', url: `https://a.com/${'x'.repeat(2000)}` }],
]) {
  r = await ana.from('links').insert({ experiencia_id: exp.id, ...campos }).select('id');
  confere(nome, Boolean(r.error), j(r));
}
r = await ana.from('links').insert({ experiencia_id: exp.id, titulo: 'X', url: 'https://a.com', laco_id: (await caio.rpc('meu_laco_id')).data }).select('id');
confere('o cliente não escolhe o Laço', Boolean(r.error), j(r));

// --- Editar e excluir --------------------------------------------------------------------------
r = await ana.from('links').update({ titulo: 'Pousada da serra', url: 'https://pousada.com.br' }).eq('id', link.id).select('titulo, url, autor_id');
confere('editar um link criado pela outra pessoa', r.data?.[0]?.titulo === 'Pousada da serra', j(r));
confere('editar preserva o autor', r.data?.[0]?.autor_id === link.autor_id, j(r));
r = await ana.from('links').update({ url: 'ftp://x' }).eq('id', link.id).select('id');
confere('editar para endereço inválido é recusado', Boolean(r.error), j(r));

// --- Outro Laço --------------------------------------------------------------------------------
r = await caio.from('links').select('id').eq('experiencia_id', exp.id);
confere('outro Laço não lê', r.data?.length === 0, j(r));
r = await caio.from('links').insert({ experiencia_id: exp.id, titulo: 'Invasão', url: 'https://x.com' }).select('id');
confere('outro Laço não cria na experiência de Ana', Boolean(r.error), j(r));
r = await caio.from('links').update({ titulo: 'Invadido' }).eq('id', link.id).select('id');
confere('outro Laço não edita', !r.error && r.data?.length === 0, j(r));
r = await caio.from('links').delete().eq('id', link.id).select('id');
confere('outro Laço não exclui', !r.error && r.data?.length === 0, j(r));

r = await bia.from('links').delete().eq('id', link.id).select('id');
confere('excluir um link', r.data?.length === 1, j(r));

// --- Cascata e sem sessão ----------------------------------------------------------------------
await ana.from('links').insert({ experiencia_id: exp.id, titulo: 'Ingresso', url: 'https://ingresso.com' });
await ana.from('experiencias').delete().eq('id', exp.id);
r = await ana.from('links').select('id').eq('experiencia_id', exp.id);
confere('excluir a experiência leva os links', r.data?.length === 0, j(r));
r = await aparelho().from('links').select('id');
confere('sem sessão, nada', (r.data ?? []).length === 0, j(r));

console.log(falhas === 0 ? '\nTODOS OS TESTES DE LINKS PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
