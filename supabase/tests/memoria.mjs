// Integração da Fase 5 contra o Supabase LOCAL: observações, finalizar, registrar memória direto,
// impressão pessoal e momento favorito com a regra de privacidade protegida no banco.
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/memoria.mjs

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
await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `memoria ${sufixo}`, p_fuso: null });
await bia.rpc('vincular_laco', { p_palavra: `memoria ${sufixo}` });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outramem ${sufixo}`, p_fuso: null });
const perfilAna = (await ana.rpc('meu_perfil')).data;
const lacoId = perfilAna.laco_id;
const anaId = perfilAna.membro_id;
const biaId = (await bia.rpc('meu_perfil')).data.membro_id;

async function vivendo(titulo) {
  const exp = (await ana.from('experiencias').insert({ titulo }).select('id')).data[0];
  await ana.rpc('mudar_estado', { p_experiencia: exp.id, p_estado: 'planejamento' });
  await ana.rpc('mudar_estado', { p_experiencia: exp.id, p_estado: 'vivendo' });
  return exp;
}
async function foto(exp, nome) {
  const caminho = `${lacoId}/${exp.id}/${nome}`;
  await ana.storage.from('experiencias').upload(caminho, JPEG, { contentType: 'image/jpeg' });
  return (await ana.from('registros').insert({ experiencia_id: exp.id, caminho }).select('id, caminho')).data[0];
}

// --- Observações ---------------------------------------------------------------------------------
const exp = await vivendo('Fim de semana na serra');
let r = await bia
  .from('registros')
  .insert({ experiencia_id: exp.id, tipo: 'observacao', texto: 'Reserva às 20h, mesa 4.' })
  .select('id, tipo, texto, autor_id, caminho');
const obs = r.data?.[0];
confere('Bia escreve uma observação, com ela como autora', obs?.tipo === 'observacao' && obs.autor_id === biaId && obs.caminho === null, j(r));

r = await ana.from('registros').update({ texto: 'Reserva às 20h30, mesa 4.' }).eq('id', obs.id).select('texto, autor_id');
confere('Ana edita a observação; a autoria continua de Bia', r.data?.[0]?.texto === 'Reserva às 20h30, mesa 4.' && r.data[0].autor_id === biaId, j(r));

r = await ana.from('registros').insert({ experiencia_id: exp.id, tipo: 'observacao', texto: '   ' }).select('id');
confere('observação vazia é recusada', Boolean(r.error), j(r));

r = await ana.from('registros').insert({ experiencia_id: exp.id, tipo: 'observacao', texto: 'x', caminho: `${lacoId}/${exp.id}/z.jpg` }).select('id');
confere('observação com arquivo é recusada', Boolean(r.error), j(r));

const f1 = await foto(exp, 'a.jpg');
const f2 = await foto(exp, 'b.jpg');
r = await ana.from('registros').update({ texto: 'legenda' }).eq('id', f1.id).select('id');
confere('foto não ganha texto pela edição', Boolean(r.error) || r.data?.length === 0, j(r));

r = await caio.from('registros').update({ texto: 'invasão' }).eq('id', obs.id).select('id');
confere('outro Laço não edita a observação', !r.error && r.data?.length === 0, j(r));

const desejo = (await ana.from('experiencias').insert({ titulo: 'Ainda desejo' }).select('id')).data[0];
r = await ana.from('registros').insert({ experiencia_id: desejo.id, tipo: 'observacao', texto: 'nada' }).select('id');
confere('em Desejo não há observações', Boolean(r.error), j(r));

// --- Finalizar --------------------------------------------------------------------------------------
r = await ana.rpc('finalizar_experiencia', { p_experiencia: desejo.id });
confere('Desejo não pode ser finalizado', r.data?.codigo === 'transicao_invalida', j(r));

r = await ana.rpc('finalizar_experiencia', { p_experiencia: exp.id });
confere('sem data, finalizar pede a referência', r.data?.codigo === 'referencia_obrigatoria', j(r));

r = await ana.rpc('finalizar_experiencia', { p_experiencia: exp.id, p_precisao: 'mes_ano', p_inicio: '2026-10-15' });
confere('referência incoerente é recusada (mês/ano no dia 15)', r.data?.codigo === 'referencia_invalida', j(r));

r = await bia.rpc('finalizar_experiencia', { p_experiencia: exp.id, p_precisao: 'periodo', p_inicio: '2026-10-10', p_fim: '2026-10-12' });
confere('Bia finaliza informando o período', r.data?.ok === true, j(r));

r = await ana.rpc('finalizar_experiencia', { p_experiencia: exp.id, p_precisao: 'data', p_inicio: '2026-01-01' });
r = await ana.from('experiencias').select('estado, referencia_precisao, referencia_inicio').eq('id', exp.id);
confere('quem define primeiro fixa: a segunda finalização não troca a data', r.data?.[0]?.estado === 'memoria' && r.data[0].referencia_precisao === 'periodo' && r.data[0].referencia_inicio === '2026-10-10', j(r));

r = await ana.rpc('mudar_estado', { p_experiencia: exp.id, p_estado: 'vivendo' });
confere('Memória não volta para Vivendo', r.data?.codigo === 'transicao_invalida', j(r));

r = await ana.from('experiencias').update({ referencia_precisao: 'sem_data', referencia_inicio: null, referencia_fim: null }).eq('id', exp.id).select('id');
confere('Memória não fica sem data', Boolean(r.error), j(r));

r = await ana.from('experiencias').update({ titulo: 'Serra, outubro' }).eq('id', exp.id).select('titulo');
confere('dados gerais da memória continuam editáveis', r.data?.[0]?.titulo === 'Serra, outubro', j(r));

const f3 = await foto(exp, 'c.jpg');
confere('fotos continuam entrando na memória', Boolean(f3?.id));

r = await caio.rpc('finalizar_experiencia', { p_experiencia: exp.id, p_precisao: 'data', p_inicio: '2026-10-10' });
confere('outro Laço não finaliza', r.data?.codigo === 'experiencia_inexistente', j(r));

// --- Registrar uma memória direto -------------------------------------------------------------------
r = await ana.from('experiencias').insert({ titulo: 'Primeiro encontro', estado: 'memoria' }).select('id');
confere('memória direta sem data é recusada', Boolean(r.error), j(r));

r = await ana
  .from('experiencias')
  .insert({ titulo: 'Primeiro encontro', estado: 'memoria', referencia_precisao: 'mes_ano', referencia_inicio: '2019-03-01' })
  .select('id, estado');
const direta = r.data?.[0];
confere('memória direta com título e mês', direta?.estado === 'memoria', j(r));

r = await ana.from('experiencias').insert({ titulo: 'Atalho', estado: 'vivendo' }).select('id');
confere('não se cria direto em Vivendo', Boolean(r.error), j(r));

// --- Impressões e momento favorito ----------------------------------------------------------------
const linhas = async (cliente, id = exp.id) =>
  (await cliente.from('impressoes').select('membro_id, texto, momento_favorito_id').eq('experiencia_id', id)).data ?? [];

r = await ana.rpc('salvar_minha_impressao', { p_experiencia: desejo.id, p_texto: 'cedo demais' });
confere('impressão só em Memória', r.data?.codigo === 'nao_e_memoria', j(r));

r = await bia.rpc('escolher_meu_momento_favorito', { p_experiencia: exp.id, p_foto: f1.id });
confere('Bia escolhe o momento favorito', r.data?.ok === true, j(r));
r = await bia.rpc('salvar_minha_impressao', { p_experiencia: exp.id, p_texto: 'Foi a primeira vez sem pressa.' });
confere('Bia registra a impressão', r.data?.ok === true, j(r));

let vistas = await linhas(ana);
confere('Ana ainda não registrou: não vê nada de Bia (nem que existe)', vistas.length === 0, JSON.stringify(vistas));

r = await ana.rpc('escolher_meu_momento_favorito', { p_experiencia: exp.id, p_foto: f2.id });
vistas = await linhas(ana);
confere('escolher o favorito não revela: Ana vê só o seu', vistas.length === 1 && vistas[0].membro_id === anaId, JSON.stringify(vistas));

r = await ana.rpc('salvar_minha_impressao', { p_experiencia: exp.id, p_texto: '   ' });
vistas = await linhas(ana);
confere('impressão em branco não conta como registrada', vistas.length === 1 && vistas[0].texto === null, JSON.stringify(vistas));

r = await ana.rpc('salvar_minha_impressao', { p_experiencia: exp.id, p_texto: '  Quero lembrar do silêncio.  ' });
vistas = await linhas(ana);
const deBia = vistas.find((v) => v.membro_id === biaId);
confere('depois de registrar, Ana vê impressão e favorito de Bia', deBia?.texto === 'Foi a primeira vez sem pressa.' && deBia.momento_favorito_id === f1.id, JSON.stringify(vistas));
confere('o texto é guardado sem espaços nas pontas', vistas.find((v) => v.membro_id === anaId)?.texto === 'Quero lembrar do silêncio.');

vistas = await linhas(bia);
confere('Bia vê a de Ana', vistas.length === 2, JSON.stringify(vistas));

r = await ana.from('impressoes').select('membro_id, momento_favorito:registros(caminho)').eq('experiencia_id', exp.id).eq('membro_id', biaId);
confere('a leitura traz o caminho da foto favorita junto (como o app pede)', r.data?.[0]?.momento_favorito?.caminho === f1.caminho, j(r));

r = await ana.rpc('salvar_minha_impressao', { p_experiencia: exp.id, p_texto: '' });
vistas = await linhas(ana);
confere('Ana apaga a sua: volta a não ver a de Bia (decidido na leitura)', vistas.length === 1 && vistas[0].membro_id === anaId && vistas[0].momento_favorito_id === f2.id, JSON.stringify(vistas));
vistas = await linhas(bia);
confere('apagar a de Ana não apaga nem esconde a de Bia para ela mesma', vistas.some((v) => v.membro_id === biaId && v.texto), JSON.stringify(vistas));

r = await ana.from('impressoes').update({ texto: 'forjado' }).eq('membro_id', biaId).select('membro_id');
confere('ninguém escreve na impressão da outra pessoa pela tabela', Boolean(r.error) || r.data?.length === 0, j(r));
r = await ana.from('impressoes').insert({ experiencia_id: exp.id, membro_id: biaId, laco_id: lacoId, texto: 'forjado' });
confere('nem cria uma em nome dela', Boolean(r.error), j(r));

const outra = await vivendo('Outra');
const fOutra = await foto(outra, 'd.jpg');
r = await ana.rpc('escolher_meu_momento_favorito', { p_experiencia: exp.id, p_foto: fOutra.id });
confere('favorito precisa ser foto da própria memória', r.data?.codigo === 'favorito_invalido', j(r));
r = await ana.rpc('escolher_meu_momento_favorito', { p_experiencia: exp.id, p_foto: obs.id });
confere('observação não pode ser momento favorito', r.data?.codigo === 'favorito_invalido', j(r));

vistas = await linhas(caio);
r = await caio.rpc('salvar_minha_impressao', { p_experiencia: exp.id, p_texto: 'invasão' });
confere('outro Laço não lê nem escreve impressões', vistas.length === 0 && r.data?.codigo === 'experiencia_inexistente', j(r));

await ana.storage.from('experiencias').remove([f1.caminho]);
await ana.from('registros').delete().eq('id', f1.id);
await ana.rpc('salvar_minha_impressao', { p_experiencia: exp.id, p_texto: 'De volta.' });
vistas = await linhas(ana);
confere('excluir a foto limpa o favorito de Bia, sem substituta', vistas.find((v) => v.membro_id === biaId)?.momento_favorito_id === null, JSON.stringify(vistas));

r = await aparelho().from('impressoes').select('texto');
confere('sem sessão, nada', (r.data ?? []).length === 0, j(r));

// Limpeza: arquivos antes das linhas.
await ana.storage.from('experiencias').remove([f2.caminho, f3.caminho, fOutra.caminho]);
for (const e of [exp, desejo, direta, outra]) if (e) await ana.from('experiencias').delete().eq('id', e.id);
r = await bia.from('impressoes').select('membro_id').eq('experiencia_id', exp.id);
confere('excluir a memória leva as impressões junto', (r.data ?? []).length === 0, j(r));

console.log(falhas === 0 ? '\nTODOS OS TESTES DA FASE 5 PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
