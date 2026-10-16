// Categorias e tamanho das experiências (ADR 038) contra o Supabase LOCAL.
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/categorias.mjs

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
await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `categ ${sufixo}`, p_fuso: null });
await bia.rpc('vincular_laco', { p_palavra: `categ ${sufixo}` });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outracat ${sufixo}`, p_fuso: null });

// --- Lista pronta ------------------------------------------------------------------------------
let r = await ana.from('categorias').select('id, nome').order('nome');
const nomes = (r.data ?? []).map((c) => c.nome);
const idsDeAna = new Set((r.data ?? []).map((c) => c.id));
confere('Laço novo já tem a lista pronta', ['Em casa', 'Filme', 'Passeio', 'Restaurante', 'Show', 'Viagem'].every((n) => nomes.includes(n)) && nomes.length === 6, j(r));
r = await bia.from('categorias').select('id');
confere('a outra pessoa vê as mesmas categorias', r.data?.length === 6, j(r));
r = await caio.from('categorias').select('id, nome');
const doCaio = r.data ?? [];
confere('outro Laço tem a própria lista, sem ver a de Ana', doCaio.length === 6 && !doCaio.some((c) => idsDeAna.has(c.id)), j(r));
const filme = (await ana.from('categorias').select('id').eq('nome', 'Filme').single()).data;

// --- Criar e excluir ---------------------------------------------------------------------------
r = await bia.from('categorias').insert({ nome: 'Coisas nerds' }).select('id, nome');
const nerd = r.data?.[0];
confere('a outra pessoa cria uma categoria', nerd?.nome === 'Coisas nerds', j(r));
r = await ana.from('categorias').insert({ nome: '  coisas NERDS ' }).select('id');
confere('nome repetido (sem diferenciar maiúsculas) é recusado', Boolean(r.error), j(r));
r = await ana.from('categorias').insert({ nome: '   ' }).select('id');
confere('nome vazio é recusado', Boolean(r.error), j(r));
r = await ana.from('categorias').insert({ nome: 'x'.repeat(41) }).select('id');
confere('nome acima de 40 caracteres é recusado', Boolean(r.error), j(r));

// --- Renomear -----------------------------------------------------------------------------------
r = await ana.from('categorias').update({ nome: 'Nerdices' }).eq('id', nerd.id).select('nome');
confere('renomear uma categoria (mesmo criada pela outra pessoa)', r.data?.[0]?.nome === 'Nerdices', j(r));
r = await ana.from('categorias').update({ nome: 'filme' }).eq('id', nerd.id).select('id');
confere('renomear para um nome que já existe é recusado', Boolean(r.error), j(r));
r = await ana.from('categorias').update({ nome: '  ' }).eq('id', nerd.id).select('id');
confere('renomear para vazio é recusado', Boolean(r.error), j(r));
r = await caio.from('categorias').update({ nome: 'Invadida' }).eq('id', nerd.id).select('id');
confere('outro Laço não renomeia', !r.error && r.data?.length === 0, j(r));
r = await caio.from('categorias').delete().eq('id', nerd.id).select('id');
confere('outro Laço não exclui', !r.error && r.data?.length === 0, j(r));

// --- Tamanho -----------------------------------------------------------------------------------
r = await ana.from('experiencias').insert({ titulo: 'Sessão de cinema', tamanho: 'noite' }).select('id, tamanho');
const exp = r.data?.[0];
confere('desejo nasce com tamanho', exp?.tamanho === 'noite', j(r));
r = await bia.from('experiencias').update({ tamanho: 'viagem' }).eq('id', exp.id).select('tamanho');
confere('a outra pessoa muda o tamanho', r.data?.[0]?.tamanho === 'viagem', j(r));
r = await ana.from('experiencias').update({ tamanho: 'mes' }).eq('id', exp.id).select('id');
confere('tamanho desconhecido é recusado', Boolean(r.error), j(r));
r = await ana.from('experiencias').update({ tamanho: null }).eq('id', exp.id).select('tamanho');
confere('tirar o tamanho', r.data?.[0]?.tamanho === null, j(r));

// --- Categorias da experiência -----------------------------------------------------------------
r = await ana.from('experiencia_categorias').insert([{ experiencia_id: exp.id, categoria_id: filme.id }, { experiencia_id: exp.id, categoria_id: nerd.id }]).select('categoria_id');
confere('experiência com duas categorias', r.data?.length === 2, j(r));
r = await bia.from('experiencias').select('id, categorias:experiencia_categorias(categoria_id)').eq('id', exp.id).single();
confere('a leitura traz as categorias da experiência', r.data?.categorias?.length === 2, j(r));
r = await caio.from('experiencia_categorias').insert({ experiencia_id: exp.id, categoria_id: doCaio[0].id }).select('categoria_id');
confere('outro Laço não marca experiência de Ana', Boolean(r.error), j(r));
const expCaio = (await caio.from('experiencias').insert({ titulo: 'Do Caio' }).select('id')).data[0];
r = await caio.from('experiencia_categorias').insert({ experiencia_id: expCaio.id, categoria_id: filme.id }).select('categoria_id');
confere('nem usa categoria do Laço de Ana', Boolean(r.error), j(r));
r = await caio.from('experiencia_categorias').select('categoria_id').eq('experiencia_id', exp.id);
confere('outro Laço não lê as categorias de Ana', r.data?.length === 0, j(r));
r = await bia.from('experiencia_categorias').delete().eq('experiencia_id', exp.id).eq('categoria_id', nerd.id).select('categoria_id');
confere('tirar uma categoria da experiência', r.data?.length === 1, j(r));

// --- Exclusões em cascata ----------------------------------------------------------------------
await ana.from('experiencia_categorias').insert({ experiencia_id: exp.id, categoria_id: nerd.id });
await ana.from('categorias').delete().eq('id', nerd.id);
r = await ana.from('experiencia_categorias').select('categoria_id').eq('experiencia_id', exp.id);
confere('excluir a categoria tira ela das experiências', r.data?.length === 1, j(r));
await ana.from('experiencias').delete().eq('id', exp.id);
r = await ana.from('experiencia_categorias').select('categoria_id').eq('experiencia_id', exp.id);
confere('excluir a experiência leva as ligações', r.data?.length === 0, j(r));

// --- Sem sessão --------------------------------------------------------------------------------
r = await aparelho().from('categorias').select('id');
confere('sem sessão, nada', (r.data ?? []).length === 0, j(r));

await caio.from('experiencias').delete().eq('id', expCaio.id);
console.log(falhas === 0 ? '\nTODOS OS TESTES DE CATEGORIAS E TAMANHO PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
