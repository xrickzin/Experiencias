// Reservas das experiências (ADR 038, etapa 3) contra o Supabase LOCAL.
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/reservas.mjs

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
await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `reserva ${sufixo}`, p_fuso: null });
await bia.rpc('vincular_laco', { p_palavra: `reserva ${sufixo}` });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outrareserva ${sufixo}`, p_fuso: null });

const exp = (await ana.from('experiencias').insert({ titulo: 'Fim de semana na serra' }).select('id')).data[0];
const membroDeBia = (await bia.rpc('meu_membro_id')).data;
const COLUNAS = 'id, tipo, nome, data, horario, codigo, url, autor_id';

// --- Criar -------------------------------------------------------------------------------------
let r = await bia
  .from('reservas')
  .insert({ experiencia_id: exp.id, tipo: 'hospedagem', nome: 'Pousada da serra', data: '2026-12-12', horario: '14:00', codigo: 'ABC123', url: 'https://pousada.com.br' })
  .select(COLUNAS);
const reserva = r.data?.[0];
confere('a outra pessoa guarda uma reserva completa', reserva?.codigo === 'ABC123' && reserva?.horario?.startsWith('14:00'), j(r));
confere('o autor é quem criou', reserva?.autor_id === membroDeBia, j(r));
r = await ana.from('reservas').insert({ experiencia_id: exp.id, tipo: 'mesa', nome: 'Jantar' }).select(COLUNAS);
confere('só tipo e nome bastam', r.data?.[0]?.data === null && r.data?.[0]?.codigo === null, j(r));
const jantar = r.data?.[0];
r = await ana.from('reservas').select('id').eq('experiencia_id', exp.id);
confere('os dois veem as reservas', r.data?.length === 2, j(r));

for (const [nome, campos] of [
  ['tipo desconhecido é recusado', { tipo: 'aviao', nome: 'X' }],
  ['nome vazio é recusado', { tipo: 'outro', nome: '  ' }],
  ['nome acima de 80 caracteres é recusado', { tipo: 'outro', nome: 'x'.repeat(81) }],
  ['horário sem dia é recusado', { tipo: 'mesa', nome: 'X', horario: '20:00' }],
  ['código vazio é recusado (use nulo)', { tipo: 'outro', nome: 'X', codigo: ' ' }],
  ['código acima de 60 caracteres é recusado', { tipo: 'outro', nome: 'X', codigo: 'x'.repeat(61) }],
  ['endereço que não é web é recusado', { tipo: 'outro', nome: 'X', url: 'javascript:alert(1)' }],
]) {
  r = await ana.from('reservas').insert({ experiencia_id: exp.id, ...campos }).select('id');
  confere(nome, Boolean(r.error), j(r));
}

// --- Editar e excluir --------------------------------------------------------------------------
r = await ana.from('reservas').update({ nome: 'Pousada', codigo: null, data: null, horario: null }).eq('id', reserva.id).select(COLUNAS);
confere('editar a reserva da outra pessoa (e limpar campos)', r.data?.[0]?.nome === 'Pousada' && r.data?.[0]?.codigo === null, j(r));
confere('editar preserva o autor', r.data?.[0]?.autor_id === membroDeBia, j(r));

// --- Outro Laço --------------------------------------------------------------------------------
r = await caio.from('reservas').select('id').eq('experiencia_id', exp.id);
confere('outro Laço não lê', r.data?.length === 0, j(r));
r = await caio.from('reservas').insert({ experiencia_id: exp.id, tipo: 'outro', nome: 'Invasão' }).select('id');
confere('outro Laço não cria na experiência de Ana', Boolean(r.error), j(r));
r = await caio.from('reservas').update({ nome: 'Invadida' }).eq('id', jantar.id).select('id');
confere('outro Laço não edita', !r.error && r.data?.length === 0, j(r));
r = await caio.from('reservas').delete().eq('id', jantar.id).select('id');
confere('outro Laço não exclui', !r.error && r.data?.length === 0, j(r));

r = await bia.from('reservas').delete().eq('id', jantar.id).select('id');
confere('excluir uma reserva', r.data?.length === 1, j(r));

// --- Cascata e sem sessão ----------------------------------------------------------------------
await ana.from('experiencias').delete().eq('id', exp.id);
r = await ana.from('reservas').select('id').eq('experiencia_id', exp.id);
confere('excluir a experiência leva as reservas', r.data?.length === 0, j(r));
r = await aparelho().from('reservas').select('id');
confere('sem sessão, nada', (r.data ?? []).length === 0, j(r));

console.log(falhas === 0 ? '\nTODOS OS TESTES DE RESERVAS PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
