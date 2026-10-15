// Integração da Fase 2 contra o Supabase LOCAL: desejos, RLS entre Laços, colunas protegidas e limites.
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/experiencias.mjs

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
const SENHA = 'senha-forte-1';

async function pessoa(nome) {
  const c = aparelho();
  const r = await c.auth.signUp({ email: `${nome}-${sufixo}@exemplo.test`, password: SENHA });
  if (r.error) throw new Error(`cadastro de ${nome}: ${r.error.message}`);
  return c;
}

// --- duas pessoas num Laço e uma terceira em outro ------------------------------------------------
const ana = await pessoa('ana');
const bia = await pessoa('bia');
const caio = await pessoa('caio');
const dani = await pessoa('dani');

const codigoDeAna = `desejos ${sufixo}`;
let r = await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: codigoDeAna, p_fuso: null });
confere('Laço da Ana criado', r.data?.ok === true, JSON.stringify(r.data ?? r.error));
r = await bia.rpc('vincular_laco', { p_palavra: codigoDeAna });
confere('Bia vinculada', r.data?.ok === true, JSON.stringify(r.data ?? r.error));
r = await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outro ${sufixo}`, p_fuso: null });
confere('Laço do Caio criado', r.data?.ok === true, JSON.stringify(r.data ?? r.error));

// --- criar ---------------------------------------------------------------------------------------
r = await ana.from('experiencias').insert({ titulo: '  Ver o nascer do sol  ' }).select('id, titulo, estado, laco_id, local, observacoes');
const desejo = r.data?.[0];
confere('Ana cria um desejo só com o título', Boolean(desejo) && desejo.estado === 'desejo' && desejo.local === null, JSON.stringify(r.data ?? r.error));
confere('o Laço vem do servidor', Boolean(desejo?.laco_id));

r = await ana.from('experiencias').insert({ titulo: '   ' }).select();
confere('título em branco é recusado', Boolean(r.error), JSON.stringify(r.data));
r = await ana.from('experiencias').insert({ titulo: 'a'.repeat(121) }).select();
confere('título com 121 caracteres é recusado', Boolean(r.error), JSON.stringify(r.data));
r = await ana.from('experiencias').insert({ titulo: 'x', observacoes: 'o'.repeat(2001) }).select();
confere('observações com 2001 caracteres são recusadas', Boolean(r.error), JSON.stringify(r.data));

r = await ana.from('experiencias').insert({ titulo: 'Tentando outro estado', estado: 'memoria' }).select();
confere('o cliente não escolhe o estado', Boolean(r.error), JSON.stringify(r.data));
r = await ana.from('experiencias').insert({ titulo: 'Tentando outro Laço', laco_id: '00000000-0000-0000-0000-000000000000' }).select();
confere('o cliente não escolhe o Laço', Boolean(r.error), JSON.stringify(r.data));

r = await dani.from('experiencias').insert({ titulo: 'Sem Laço' }).select();
confere('quem não tem Laço não cria', Boolean(r.error), JSON.stringify(r.data));
r = await aparelho().from('experiencias').insert({ titulo: 'Sem sessão' }).select();
confere('sem sessão não cria', Boolean(r.error), JSON.stringify(r.data));

// --- ler -----------------------------------------------------------------------------------------
r = await bia.from('experiencias').select('id, titulo').order('criado_em');
confere('Bia vê o desejo da Ana', r.data?.some((e) => e.id === desejo.id), JSON.stringify(r.data ?? r.error));
r = await caio.from('experiencias').select('id');
confere('outro Laço não vê', r.data?.length === 0, JSON.stringify(r.data ?? r.error));
r = await dani.from('experiencias').select('id');
confere('quem não tem Laço não vê', r.data?.length === 0, JSON.stringify(r.data ?? r.error));
r = await aparelho().from('experiencias').select('id');
confere('sem sessão não vê', Boolean(r.error) || r.data?.length === 0, JSON.stringify(r.data));

// --- editar --------------------------------------------------------------------------------------
r = await bia.from('experiencias').update({ titulo: 'Ver o nascer do sol juntos', local: 'Praia', observacoes: 'Levar café' }).eq('id', desejo.id).select();
confere('Bia edita o desejo da Ana (mesma permissão)', r.data?.length === 1 && r.data[0].local === 'Praia', JSON.stringify(r.data ?? r.error));
r = await bia.from('experiencias').select('criado_em, atualizado_em').eq('id', desejo.id);
confere('atualizado_em acompanha a edição', new Date(r.data[0].atualizado_em) > new Date(r.data[0].criado_em), JSON.stringify(r.data));

r = await caio.from('experiencias').update({ titulo: 'Invadido' }).eq('id', desejo.id).select();
confere('outro Laço não edita', !r.error && r.data?.length === 0, JSON.stringify(r.data ?? r.error));
r = await ana.from('experiencias').update({ estado: 'memoria' }).eq('id', desejo.id).select();
confere('o cliente não muda o estado', Boolean(r.error), JSON.stringify(r.data));
r = await ana.from('experiencias').update({ laco_id: '00000000-0000-0000-0000-000000000000' }).eq('id', desejo.id).select();
confere('o cliente não muda o Laço', Boolean(r.error), JSON.stringify(r.data));
r = await ana.from('experiencias').update({ local: null, observacoes: null }).eq('id', desejo.id).select();
confere('limpar local e observações é permitido', r.data?.[0]?.local === null, JSON.stringify(r.data ?? r.error));

// --- criar já com local e observações (como a tela do `+`) ----------------------------------------
r = await ana.from('experiencias').insert({ titulo: 'Piquenique', local: 'Parque', observacoes: 'Levar cesta' }).select('id, titulo, local, observacoes, estado');
const completo = r.data?.[0];
confere('criar com local e observações grava tudo de uma vez',
  completo?.local === 'Parque' && completo?.observacoes === 'Levar cesta' && completo?.estado === 'desejo',
  JSON.stringify(r.data ?? r.error));

// A lista do app: só desejos, do mais novo para o mais antigo.
await new Promise((ok) => setTimeout(ok, 50));
r = await ana.from('experiencias').insert({ titulo: 'Mais novo' }).select('id');
const maisNovo = r.data?.[0]?.id;
r = await bia.from('experiencias').select('id, titulo').eq('estado', 'desejo').order('criado_em', { ascending: false });
confere('a lista vem do mais novo para o mais antigo', r.data?.[0]?.id === maisNovo, JSON.stringify(r.data ?? r.error));

// Experiência em outro estado (criada pelo banco, como fará a Fase 3) não aparece na lista de desejos
// e o app não a altera nem a exclui pelas rotas de desejo.
const banco = (consulta) =>
  execSync(`docker exec -i ${execSync('docker ps --filter "name=supabase_db_" --format "{{.Names}}"', { encoding: 'utf8' }).trim()} psql -U postgres -At -c "${consulta}"`, { encoding: 'utf8' }).trim();
const planejamentoId = banco(
  `insert into public.experiencias (laco_id, titulo, estado) select m.laco_id, 'Viagem em planejamento', 'planejamento' from public.membros m join auth.users u on u.id = m.user_id where u.email = 'ana-${sufixo}@exemplo.test' returning id`
).split(String.fromCharCode(10))[0];
confere('o banco criou uma experiência em planejamento', /^[0-9a-f-]{36}$/.test(planejamentoId), planejamentoId);

r = await ana.from('experiencias').select('id').eq('estado', 'desejo');
confere('a lista de desejos não traz experiência em planejamento', !r.data?.some((e) => e.id === planejamentoId), JSON.stringify(r.data));
r = await ana.from('experiencias').update({ titulo: 'Alterado' }).eq('id', planejamentoId).eq('estado', 'desejo').select('id');
confere('editar como desejo não toca em planejamento', r.data?.length === 0, JSON.stringify(r.data ?? r.error));
r = await ana.from('experiencias').delete().eq('id', planejamentoId).eq('estado', 'desejo').select('id');
confere('excluir como desejo não toca em planejamento', r.data?.length === 0, JSON.stringify(r.data ?? r.error));
r = await caio.from('experiencias').select('id').eq('id', planejamentoId);
confere('outro Laço também não vê a experiência em planejamento', r.data?.length === 0, JSON.stringify(r.data));
banco(`delete from public.experiencias where id = '${planejamentoId}'`);

// --- excluir -------------------------------------------------------------------------------------
r = await caio.from('experiencias').delete().eq('id', desejo.id).select();
confere('outro Laço não exclui', !r.error && r.data?.length === 0, JSON.stringify(r.data ?? r.error));
r = await bia.from('experiencias').delete().eq('id', desejo.id).select();
confere('Bia exclui o desejo (definitivo)', r.data?.length === 1, JSON.stringify(r.data ?? r.error));
r = await ana.from('experiencias').select('id').eq('id', desejo.id);
confere('some para os dois', r.data?.length === 0, JSON.stringify(r.data));

// --- o Laço apagado leva as experiências junto ---------------------------------------------------
const antes = execSync(`docker exec -i ${execSync('docker ps --filter "name=supabase_db_" --format "{{.Names}}"', { encoding: 'utf8' }).trim()} psql -U postgres -At -c "select count(*) from public.experiencias"`, { encoding: 'utf8' }).trim();
confere('a tabela existe e é consultável pelo banco', Number(antes) >= 0, antes);

console.log(falhas === 0 ? '\nTODOS OS TESTES DA FASE 2 PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
