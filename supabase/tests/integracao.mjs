// Testes de integração contra o Supabase LOCAL (Docker): Auth, funções, RLS, limite de tentativas e
// recuperação de senha de ponta a ponta, lendo o e-mail no Mailpit.
//
// Pré-requisito: `npx supabase@2.119.0 start` na raiz do repositório.
// Rodar a partir da raiz:  node supabase/tests/integracao.mjs
//
// Nunca aponte este script para o projeto real: ele cria contas e lê a caixa de e-mail local.
// As chaves vêm do `supabase status` local e não são impressas.

import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

import { interpretarLinkDeRecuperacao } from '../../app/src/services/link-recuperacao.ts';

const require = createRequire(new URL('../../app/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');

// --- ambiente local -------------------------------------------------------------------------
const status = Object.fromEntries(
  execSync('npx --yes supabase@2.119.0 status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split(/\r?\n/)
    .map((linha) => linha.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map(([, k, v]) => [k, v])
);
const URL_API = status.API_URL;
const CHAVE = status.PUBLISHABLE_KEY || status.ANON_KEY;
const MAILPIT = status.MAILPIT_URL || status.INBUCKET_URL;
if (!URL_API?.startsWith('http://127.0.0.1') && !URL_API?.startsWith('http://localhost')) {
  console.error('Abortado: a URL não é do Supabase local.');
  process.exit(2);
}
const DB_CONTAINER = execSync('docker ps --filter "name=supabase_db_" --format "{{.Names}}"', { encoding: 'utf8' }).trim();

function sql(consulta) {
  return execSync(`docker exec -i ${DB_CONTAINER} psql -U postgres -At -c "${consulta.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8',
  }).trim();
}

// --- utilidades -----------------------------------------------------------------------------
let falhas = 0;
function confere(nome, condicao, detalhe = '') {
  if (!condicao) falhas++;
  console.log(condicao ? 'ok   ' : 'FALHA', nome, condicao ? '' : detalhe);
}

function memoria() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

/** Um "aparelho": cliente com armazenamento próprio, como o app (PKCE). */
function aparelho() {
  return createClient(URL_API, CHAVE, {
    auth: { storage: memoria(), persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'pkce' },
  });
}

const sufixo = Date.now().toString(36);
const email = (nome) => `${nome}-${sufixo}@exemplo.test`;
const SENHA = 'senha-forte-1';

// Limpa o limite de tentativas antes de começar (o IP local é o mesmo em todas as chamadas).
sql('delete from public.tentativas_vinculo; delete from public.bloqueios_vinculo;');

// --- cadastro e criação do Laço -------------------------------------------------------------
const ana = aparelho();
let r = await ana.auth.signUp({ email: email('ana'), password: SENHA });
confere('cadastro devolve sessão (confirmação de e-mail desligada, PKCE)', Boolean(r.data.session), r.error?.message);

r = await ana.auth.signUp({ email: email('curta'), password: '1234567' });
confere('senha com 7 caracteres é recusada pelo servidor', Boolean(r.error), 'aceitou senha curta');

const codigo = `Nosso Código ${sufixo}`;
r = await ana.rpc('palavra_disponivel', { p_palavra: codigo });
confere('código livre está disponível', r.data?.ok === true, JSON.stringify(r.data ?? r.error));

r = await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: codigo, p_fuso: 'America/Sao_Paulo' });
confere('criar_laco ok', r.data?.ok === true, JSON.stringify(r.data ?? r.error));

r = await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `outro ${sufixo}`, p_fuso: null });
confere('segundo Laço para a mesma conta é recusado', r.data?.codigo === 'ja_tem_laco', JSON.stringify(r.data ?? r.error));

r = await aparelho().rpc('palavra_disponivel', { p_palavra: codigo.toUpperCase() });
confere('mesmo código em maiúsculas aparece em uso', r.data?.codigo === 'palavra_em_uso', JSON.stringify(r.data ?? r.error));

r = await ana.rpc('meu_perfil');
confere('perfil de Ana: sozinha, com o nome provisório da outra pessoa',
  r.data?.nome === 'Ana' && r.data?.companheiro_vinculado === false && r.data?.companheiro_nome === 'Bia',
  JSON.stringify(r.data ?? r.error));

// --- e-mail --------------------------------------------------------------------------------
r = await aparelho().rpc('verificar_email', { p_email: email('ana').toUpperCase() });
confere('verificar_email encontra a conta (sem sessão)', r.data?.existe === true, JSON.stringify(r.data ?? r.error));
r = await aparelho().rpc('verificar_email', { p_email: email('ninguem') });
confere('verificar_email não encontra conta inexistente', r.data?.existe === false, JSON.stringify(r.data ?? r.error));

// --- vínculo -------------------------------------------------------------------------------
r = await aparelho().rpc('verificar_palavra_vinculo', { p_palavra: `  ${codigo.toLowerCase()} ` });
confere('código válido para vínculo (sem sessão, normalizado)', r.data?.ok === true, JSON.stringify(r.data ?? r.error));

const bia = aparelho();
r = await bia.auth.signUp({ email: email('bia'), password: SENHA });
confere('cadastro da Bia', Boolean(r.data.session), r.error?.message);
r = await bia.rpc('vincular_laco', { p_palavra: codigo });
confere('Bia vincula e recebe o nome que a Ana digitou', r.data?.ok === true && r.data?.nome === 'Bia', JSON.stringify(r.data ?? r.error));

r = await ana.rpc('meu_perfil');
confere('Ana passa a ver a Bia vinculada', r.data?.companheiro_vinculado === true && r.data?.companheiro_nome === 'Bia', JSON.stringify(r.data));

const caio = aparelho();
await caio.auth.signUp({ email: email('caio'), password: SENHA });
r = await caio.rpc('vincular_laco', { p_palavra: codigo });
confere('terceira pessoa recebe a resposta genérica', r.data?.codigo === 'nao_encontrado', JSON.stringify(r.data ?? r.error));

// --- RLS -----------------------------------------------------------------------------------
r = await bia.from('membros').select('nome');
confere('Bia lê os dois membros do próprio Laço', r.data?.length === 2, JSON.stringify(r.data ?? r.error));
r = await caio.from('membros').select('nome');
confere('quem não tem Laço não lê membros', r.data?.length === 0, JSON.stringify(r.data ?? r.error));
r = await bia.from('lacos').select('palavra_hmac');
confere('cliente não lê o HMAC do código', Boolean(r.error), JSON.stringify(r.data));
r = await bia.from('configuracao_servidor').select('*');
confere('cliente não lê a configuração (segredo)', Boolean(r.error) || r.data?.length === 0, JSON.stringify(r.data));
r = await bia.from('membros').update({ nome: 'Bianca' }).eq('nome', 'Bia').select('nome');
confere('Bia edita o próprio nome', r.data?.length === 1 && r.data[0].nome === 'Bianca', JSON.stringify(r.data ?? r.error));
r = await bia.from('membros').update({ nome: 'Hack' }).eq('nome', 'Ana').select('nome');
confere('Bia não edita o nome da Ana', r.data?.length === 0, JSON.stringify(r.data ?? r.error));
r = await aparelho().rpc('meu_perfil');
confere('sem sessão, meu_perfil não devolve nada de ninguém', r.data == null, JSON.stringify(r.data));

// --- recuperação de senha de ponta a ponta --------------------------------------------------
await fetch(`${MAILPIT}/api/v1/messages`, { method: 'DELETE' });
const celular = aparelho(); // o aparelho que pede é o que abre o link (PKCE)
r = await celular.auth.resetPasswordForEmail(email('ana'), { redirectTo: 'laco://redefinir-senha' });
confere('pedido de recuperação aceito', !r.error, r.error?.message);
// Outro aparelho: um segundo pedido no mesmo aparelho substitui o verificador do primeiro, e o link
// do primeiro e-mail deixa de valer (o redirecionamento não traz `sb_flow_id`).
r = await aparelho().auth.resetPasswordForEmail(email('ninguem2'), { redirectTo: 'laco://redefinir-senha' });
confere('pedido para e-mail inexistente responde igual (sem revelar)', !r.error, r.error?.message);

let mensagem;
for (let i = 0; i < 20 && !mensagem; i++) {
  const lista = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email('ana')}`)}`)).json();
  mensagem = lista.messages?.[0];
  if (!mensagem) await new Promise((ok) => setTimeout(ok, 500));
}
confere('e-mail de recuperação chegou ao Mailpit', Boolean(mensagem));
const lista2 = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email('ninguem2')}`)}`)).json();
confere('nenhum e-mail para conta inexistente', (lista2.messages?.length ?? 0) === 0);

const corpo = mensagem ? await (await fetch(`${MAILPIT}/api/v1/message/${mensagem.ID}`)).json() : {};
const link = (corpo.Text || corpo.HTML || '').match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]*/)?.[0]?.replace(/&amp;/g, '&');
confere('e-mail contém o link de verificação', Boolean(link));

const resposta = link ? await fetch(link, { redirect: 'manual' }) : null;
const destino = resposta?.headers.get('location') ?? '';
confere('link redireciona para laco://redefinir-senha (URL permitida)', destino.startsWith('laco://redefinir-senha'), destino.split('?')[0]);

const params = Object.fromEntries(new URL(destino.replace('laco://', 'http://x/')).searchParams);
const lido = interpretarLinkDeRecuperacao(params);
confere('o app reconheceria o código do link', lido.tipo === 'codigo', JSON.stringify(lido.tipo === 'codigo' ? { tipo: lido.tipo, flowId: Boolean(lido.flowId) } : lido));

if (lido.tipo === 'codigo') {
  const outroAparelho = aparelho();
  r = await outroAparelho.auth.exchangeCodeForSession(lido.codigo, lido.flowId ? { flowId: lido.flowId } : undefined);
  confere('o link aberto em outro aparelho não abre sessão', Boolean(r.error));

  r = await celular.auth.exchangeCodeForSession(lido.codigo, lido.flowId ? { flowId: lido.flowId } : undefined);
  confere('troca do código no mesmo aparelho abre a sessão de recuperação',
    !r.error && r.data?.redirectType === 'recovery', r.error?.message ?? String(r.data?.redirectType));

  r = await celular.auth.updateUser({ password: SENHA });
  confere('mesma senha antiga é recusada', Boolean(r.error), 'aceitou a mesma senha');
  r = await celular.auth.updateUser({ password: 'nova-senha-2' });
  confere('nova senha salva', !r.error, r.error?.message);

  r = await aparelho().auth.signInWithPassword({ email: email('ana'), password: SENHA });
  confere('senha antiga deixa de funcionar', Boolean(r.error));
  const depois = aparelho();
  r = await depois.auth.signInWithPassword({ email: email('ana'), password: 'nova-senha-2' });
  confere('nova senha funciona', !r.error, r.error?.message);
  r = await depois.rpc('meu_perfil');
  confere('Laço e vínculo continuam depois da troca de senha', r.data?.companheiro_vinculado === true, JSON.stringify(r.data));

  r = await aparelho().auth.exchangeCodeForSession(lido.codigo);
  confere('o mesmo código não pode ser usado de novo', Boolean(r.error));
}

// --- limite de tentativas (por último, porque bloqueia o IP local) ---------------------------
const chaves = sql("select distinct chave from public.tentativas_vinculo where chave like 'email:ip:%' limit 1");
confere('o IP da requisição chega às funções', chaves !== '' && !chaves.endsWith(':desconhecido'), chaves || '(nenhuma chave)');

sql('delete from public.tentativas_vinculo; delete from public.bloqueios_vinculo;');
for (let i = 1; i <= 5; i++) {
  r = await aparelho().rpc('verificar_palavra_vinculo', { p_palavra: `errado ${i} ${sufixo}` });
}
confere('5ª tentativa errada ainda responde genérico', r.data?.codigo === 'nao_encontrado', JSON.stringify(r.data));
r = await aparelho().rpc('verificar_palavra_vinculo', { p_palavra: codigo });
confere('depois de 5 erros, bloqueia mesmo o código certo', r.data?.codigo === 'bloqueado', JSON.stringify(r.data));
sql('delete from public.tentativas_vinculo; delete from public.bloqueios_vinculo;');

console.log(falhas === 0 ? '\nTODOS OS TESTES DE INTEGRAÇÃO PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
