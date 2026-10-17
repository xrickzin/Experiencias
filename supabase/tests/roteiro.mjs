// Roteiro por dia e links nos itens (ADR 038, etapa 4; ADR 040) contra o Supabase LOCAL.
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/roteiro.mjs

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
await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `roteiro ${sufixo}`, p_fuso: null });
await bia.rpc('vincular_laco', { p_palavra: `roteiro ${sufixo}` });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outroroteiro ${sufixo}`, p_fuso: null });

const exp = (await ana.from('experiencias').insert({ titulo: 'Fim de semana na serra' }).select('id, roteiro_ativo')).data[0];
const membroDeBia = (await bia.rpc('meu_membro_id')).data;
const COLUNAS = 'id, dia, periodo, horario, texto, ordem, autor_id';
confere('o roteiro começa desligado', exp.roteiro_ativo === false, JSON.stringify(exp));

// --- Desligado, não cria -----------------------------------------------------------------------
let r = await ana.from('roteiro').insert({ experiencia_id: exp.id, dia: '2026-12-12', periodo: 'manha', texto: 'Café' }).select('id');
confere('com o roteiro desligado, não cria item', Boolean(r.error), j(r));

r = await bia.from('experiencias').update({ roteiro_ativo: true }).eq('id', exp.id).select('roteiro_ativo');
confere('a outra pessoa liga o roteiro', r.data?.[0]?.roteiro_ativo === true, j(r));
r = await ana.from('experiencias').insert({ titulo: 'Já com roteiro', roteiro_ativo: true }).select('id, roteiro_ativo');
confere('dá para criar a experiência com o roteiro ligado', r.data?.[0]?.roteiro_ativo === true, j(r));
const outraExp = r.data?.[0];

// --- Criar -------------------------------------------------------------------------------------
r = await bia
  .from('roteiro')
  .insert({ experiencia_id: exp.id, dia: '2026-12-12', periodo: 'tarde', horario: '14:00', texto: 'Trilha da pedra', ordem: 1 })
  .select(COLUNAS);
const trilha = r.data?.[0];
confere('a outra pessoa guarda um item com horário', trilha?.horario?.startsWith('14:00') && trilha?.ordem === 1, j(r));
confere('o autor é quem criou', trilha?.autor_id === membroDeBia, j(r));
r = await ana.from('roteiro').insert({ experiencia_id: exp.id, dia: '2026-12-12', periodo: 'manha', texto: 'Café na pousada' }).select(COLUNAS);
const cafe = r.data?.[0];
confere('dia, período e texto bastam (ordem 0)', cafe?.horario === null && cafe?.ordem === 0, j(r));
r = await ana.from('roteiro').insert({ experiencia_id: exp.id, dia: '2026-12-12', periodo: 'noite', horario: '00:00', texto: 'X' }).select('id');
confere('meia-noite é madrugada, não noite', Boolean(r.error), j(r));
r = await ana.from('roteiro').insert({ experiencia_id: exp.id, dia: '2026-12-12', periodo: 'madrugada', horario: '04:59', texto: 'Estrelas' }).select('id');
confere('04:59 é madrugada', !r.error, j(r));
r = await ana.from('roteiro').select('id').eq('experiencia_id', exp.id);
confere('os dois veem o roteiro', r.data?.length === 3, j(r));

for (const [nome, campos] of [
  ['período desconhecido é recusado', { dia: '2026-12-12', periodo: 'almoco', texto: 'X' }],
  ['sem dia é recusado', { periodo: 'manha', texto: 'X' }],
  ['horário fora do período é recusado', { dia: '2026-12-12', periodo: 'manha', horario: '14:00', texto: 'X' }],
  ['texto vazio é recusado', { dia: '2026-12-12', periodo: 'manha', texto: '  ' }],
  ['texto acima de 200 caracteres é recusado', { dia: '2026-12-12', periodo: 'manha', texto: 'x'.repeat(201) }],
]) {
  r = await ana.from('roteiro').insert({ experiencia_id: exp.id, ...campos }).select('id');
  confere(nome, Boolean(r.error), j(r));
}

// --- Editar e reordenar ------------------------------------------------------------------------
r = await ana
  .from('roteiro')
  .update({ texto: 'Trilha', dia: '2026-12-13', periodo: 'manha', horario: '09:30', ordem: 0.5 })
  .eq('id', trilha.id)
  .select(COLUNAS);
confere('editar o item da outra pessoa (dia, período, horário, ordem)', r.data?.[0]?.dia === '2026-12-13' && r.data?.[0]?.ordem === 0.5, j(r));
confere('editar preserva o autor', r.data?.[0]?.autor_id === membroDeBia, j(r));
r = await ana.from('roteiro').update({ periodo: 'noite' }).eq('id', trilha.id).select('id');
confere('mudar o período sem tirar o horário incompatível é recusado', Boolean(r.error), j(r));
r = await ana.from('roteiro').update({ autor_id: null }).eq('id', trilha.id).select('id');
confere('o autor não é editável', Boolean(r.error), j(r));

// --- Outro Laço --------------------------------------------------------------------------------
r = await caio.from('roteiro').select('id').eq('experiencia_id', exp.id);
confere('outro Laço não lê', r.data?.length === 0, j(r));
r = await caio.from('roteiro').insert({ experiencia_id: exp.id, dia: '2026-12-12', periodo: 'manha', texto: 'Invasão' }).select('id');
confere('outro Laço não cria na experiência de Ana', Boolean(r.error), j(r));
r = await caio.from('roteiro').update({ texto: 'Invadido' }).eq('id', cafe.id).select('id');
confere('outro Laço não edita', !r.error && r.data?.length === 0, j(r));
r = await caio.from('roteiro').delete().eq('id', cafe.id).select('id');
confere('outro Laço não exclui', !r.error && r.data?.length === 0, j(r));
await caio.from('experiencias').update({ roteiro_ativo: false }).eq('id', exp.id);
r = await ana.from('roteiro').select('id').eq('experiencia_id', exp.id);
confere('outro Laço não desliga o roteiro de Ana', r.data?.length === 3, j(r));

r = await bia.from('roteiro').delete().eq('id', cafe.id).select('id');
confere('excluir um item', r.data?.length === 1, j(r));

// --- Desligar exclui ---------------------------------------------------------------------------
await ana.from('experiencias').update({ titulo: 'Serra', roteiro_ativo: true }).eq('id', exp.id);
r = await ana.from('roteiro').select('id').eq('experiencia_id', exp.id);
confere('salvar com o botão ainda ligado mantém o roteiro', r.data?.length === 2, j(r));
r = await bia.from('experiencias').update({ roteiro_ativo: false }).eq('id', exp.id).select('roteiro_ativo');
confere('desligar o roteiro', r.data?.[0]?.roteiro_ativo === false, j(r));
r = await ana.from('roteiro').select('id').eq('experiencia_id', exp.id);
confere('desligar exclui os itens', r.data?.length === 0, j(r));

// --- Links nos itens ---------------------------------------------------------------------------
const passeio = (await ana.from('roteiro').insert({ experiencia_id: outraExp.id, dia: '2026-12-20', periodo: 'tarde', texto: 'Museu' }).select('id')).data[0];
const ingresso = (await ana.from('links').insert({ experiencia_id: outraExp.id, titulo: 'Ingresso', url: 'https://museu.com' }).select('id')).data[0];
const mapa = (await ana.from('links').insert({ experiencia_id: outraExp.id, titulo: 'Mapa', url: 'https://maps.google.com/x' }).select('id')).data[0];
const linkDeOutra = (await ana.from('links').insert({ experiencia_id: exp.id, titulo: 'Serra', url: 'https://serra.com' }).select('id')).data[0];
r = await bia.from('roteiro_links').insert([{ item_id: passeio.id, link_id: ingresso.id }, { item_id: passeio.id, link_id: mapa.id }]).select('item_id');
confere('a outra pessoa associa dois links ao item', r.data?.length === 2, j(r));
r = await ana.from('roteiro').select('id, links:roteiro_links(link_id)').eq('id', passeio.id);
confere('o item traz os links associados', r.data?.[0]?.links?.length === 2, j(r));
r = await ana.from('roteiro_links').insert({ item_id: passeio.id, link_id: ingresso.id }).select('item_id');
confere('o mesmo link duas vezes é recusado', Boolean(r.error), j(r));
r = await ana.from('roteiro_links').insert({ item_id: passeio.id, link_id: linkDeOutra.id }).select('item_id');
confere('link de outra experiência é recusado', Boolean(r.error), j(r));
r = await caio.from('roteiro_links').select('item_id').eq('item_id', passeio.id);
confere('outro Laço não lê as associações', r.data?.length === 0, j(r));
r = await caio.from('roteiro_links').delete().eq('item_id', passeio.id).select('item_id');
confere('outro Laço não desfaz as associações', !r.error && r.data?.length === 0, j(r));
await ana.from('links').delete().eq('id', mapa.id);
r = await ana.from('roteiro_links').select('link_id').eq('item_id', passeio.id);
confere('excluir o link só desfaz a associação', r.data?.length === 1 && r.data[0].link_id === ingresso.id, j(r));
r = await ana.from('roteiro_links').delete().eq('item_id', passeio.id).eq('link_id', ingresso.id).select('item_id');
confere('desassociar um link', r.data?.length === 1, j(r));
r = await ana.from('links').select('id').eq('id', ingresso.id);
confere('desassociar não exclui o link', r.data?.length === 1, j(r));

// --- Cascata e sem sessão ----------------------------------------------------------------------
await ana.from('roteiro').insert({ experiencia_id: outraExp.id, dia: '2026-12-20', periodo: 'noite', texto: 'Jantar' });
await ana.from('experiencias').delete().eq('id', outraExp.id);
r = await ana.from('roteiro').select('id').eq('experiencia_id', outraExp.id);
confere('excluir a experiência leva o roteiro', r.data?.length === 0, j(r));
r = await aparelho().from('roteiro').select('id');
confere('sem sessão, nada', (r.data ?? []).length === 0, j(r));

console.log(falhas === 0 ? '\nTODOS OS TESTES DO ROTEIRO PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
