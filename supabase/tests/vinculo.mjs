// Testes da migração da Fase 1 em um Postgres real (PGlite), com um ambiente que IMITA o Supabase
// (papéis anon/authenticated, schema auth, auth.uid() e cabeçalhos da requisição).
// Não substitui um teste no projeto Supabase de verdade: confirma a lógica de vínculo, os
// privilégios, a RLS e o bloqueio de tentativas.
//
// Como rodar (a partir de supabase/):  npm install --no-save @electric-sql/pglite  &&  node tests/vinculo.mjs
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import { readFileSync } from 'node:fs';

const migration = process.argv[2] ?? new URL('../migrations/20261010120000_fase1_laco_membros_vinculo.sql', import.meta.url);
const db = new PGlite({ extensions: { pgcrypto, unaccent } });

let falhas = 0;
function confere(nome, condicao, detalhe = '') {
  if (!condicao) falhas++;
  console.log((condicao ? 'ok   ' : 'FALHA'), nome, condicao ? '' : detalhe);
}

// --- ambiente que imita o Supabase: papéis, schemas e auth ---
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema extensions; create schema auth;
  create extension pgcrypto with schema extensions;
  create extension unaccent with schema extensions;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, deleted_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid $$;
  grant usage on schema public, auth, extensions to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);
await db.exec(readFileSync(migration, 'utf8'));

const ids = {};
for (const [k, e] of [['A', 'ana@exemplo.com'], ['B', 'bia@exemplo.com'], ['C', 'caio@exemplo.com'], ['D', 'dani@exemplo.com']]) {
  ids[k] = (await db.query(`insert into auth.users (email) values ($1) returning id`, [e])).rows[0].id;
}

async function como(papel, uid, ip, sql, params = []) {
  await db.exec(`set role ${papel}`);
  await db.query(`select set_config('request.jwt.claims', $1, false), set_config('request.headers', $2, false)`, [
    JSON.stringify(uid ? { sub: uid, role: papel } : { role: papel }),
    JSON.stringify(ip ? { 'cf-connecting-ip': ip } : {}),
  ]);
  try {
    const r = await db.query(sql, params);
    return { ok: true, rows: r.rows };
  } catch (e) {
    return { ok: false, erro: e.message };
  } finally {
    await db.exec('reset role');
  }
}
const rpc = async (papel, uid, ip, fn, ...args) => {
  const marcas = args.map((_, i) => `$${i + 1}`).join(', ');
  const r = await como(papel, uid, ip, `select public.${fn}(${marcas}) as r`, args);
  return r.ok ? r.rows[0].r : { erroSql: r.erro };
};

// --- e-mail ---
let r = await rpc('anon', null, '1.1.1.1', 'verificar_email', 'ninguem@exemplo.com');
confere('e-mail inexistente: existe=false', r.ok && r.existe === false, JSON.stringify(r));
r = await rpc('anon', null, '1.1.1.1', 'verificar_email', ' ANA@exemplo.com ');
confere('e-mail existente (maiúsculas/espaços): existe=true', r.ok && r.existe === true, JSON.stringify(r));
r = await rpc('anon', null, '1.1.1.1', 'verificar_email', 'sem-arroba');
confere('e-mail inválido rejeitado', r.codigo === 'email_invalido', JSON.stringify(r));

// --- criar Laço ---
r = await rpc('anon', null, '2.2.2.2', 'palavra_disponivel', 'Amor');
confere('palavra livre está disponível', r.ok === true, JSON.stringify(r));
r = await rpc('anon', null, '2.2.2.2', 'criar_laco', 'Ana', 'Bia', 'Amor', 'America/Sao_Paulo');
confere('criar_laco sem sessão é recusado', r.erroSql !== undefined, JSON.stringify(r));
r = await rpc('authenticated', ids.A, '2.2.2.2', 'criar_laco', 'Ana', 'Bia', ' ÁMOR  nosso ', 'Fuso/Invalido');
confere('criar_laco ok (palavra com acento e espaços, fuso inválido vira padrão)', r.ok === true, JSON.stringify(r));
const fuso = (await db.query(`select fuso from public.lacos`)).rows[0].fuso;
confere('fuso inválido cai no padrão', fuso === 'America/Sao_Paulo', fuso);
r = await rpc('authenticated', ids.A, '2.2.2.2', 'criar_laco', 'Ana', 'Bia', 'Outra palavra', null);
confere('segundo Laço para a mesma identidade é recusado', r.codigo === 'ja_tem_laco', JSON.stringify(r));
r = await rpc('anon', null, '3.3.3.3', 'palavra_disponivel', 'amor NOSSO');
confere('palavra equivalente (normalizada) está em uso', r.codigo === 'palavra_em_uso', JSON.stringify(r));
r = await rpc('authenticated', ids.C, '3.3.3.3', 'criar_laco', 'Caio', 'Dani', 'Amor Nosso', null);
confere('criar com palavra em uso é recusado e nada é criado', r.codigo === 'palavra_em_uso', JSON.stringify(r));
confere('nenhum membro de C foi criado', (await db.query(`select count(*)::int n from public.membros where user_id=$1`, [ids.C])).rows[0].n === 0);
confere('nenhum Laço órfão', (await db.query(`select count(*)::int n from public.lacos`)).rows[0].n === 1);
r = await rpc('authenticated', ids.C, '9.9.9.9', 'criar_laco', 'Caio', '   ', 'Palavra', null);
confere('nome da outra pessoa em branco é recusado', r.codigo === 'dados_invalidos', JSON.stringify(r));
r = await rpc('authenticated', ids.C, '9.9.9.9', 'criar_laco', 'Caio', 'Dani', 'ab', null);
confere('palavra curta demais é recusada', r.codigo === 'palavra_invalida', JSON.stringify(r));

// --- a palavra não é guardada em texto ---
const guardado = (await db.query(`select palavra_hmac from public.lacos`)).rows[0].palavra_hmac;
confere('o HMAC não contém a palavra e tem 64 hex', /^[0-9a-f]{64}$/.test(guardado) && !guardado.includes('amor'), guardado);

// --- RLS e privilégios ---
r = await como('authenticated', ids.A, '2.2.2.2', `select id, fuso, nome_companheiro_provisorio from public.lacos`);
confere('A lê o próprio Laço', r.ok && r.rows.length === 1);
r = await como('authenticated', ids.A, '2.2.2.2', `select palavra_hmac from public.lacos`);
confere('A não lê palavra_hmac', !r.ok, JSON.stringify(r));
r = await como('authenticated', ids.A, '2.2.2.2', `select * from public.configuracao_servidor`);
confere('cliente não lê a configuração (segredo do HMAC)', !r.ok, JSON.stringify(r));
r = await como('authenticated', ids.A, '2.2.2.2', `select * from public.tentativas_vinculo`);
confere('cliente não lê tentativas', !r.ok);
r = await como('authenticated', ids.A, '2.2.2.2', `select * from public.bloqueios_vinculo`);
confere('cliente não lê bloqueios', !r.ok);
r = await como('authenticated', ids.A, '2.2.2.2', `insert into public.lacos (palavra_hmac) values ('x')`);
confere('cliente não insere Laço', !r.ok);
r = await como('authenticated', ids.C, '2.2.2.2', `insert into public.membros (laco_id, user_id, nome) select id, $1, 'Invasor' from public.lacos`, [ids.C]);
confere('cliente não insere membro', !r.ok);
r = await como('authenticated', ids.B, '2.2.2.2', `select id from public.lacos`);
confere('quem não tem Laço não vê nenhum', r.ok && r.rows.length === 0, JSON.stringify(r));
r = await como('anon', null, '2.2.2.2', `select * from public.lacos`);
confere('anon não lê Laços', !r.ok);
r = await como('anon', null, '2.2.2.2', `select public.meu_perfil()`);
confere('anon não executa meu_perfil', !r.ok);
r = await como('authenticated', ids.A, '2.2.2.2', `select public.interno_hmac_palavra('amor')`);
confere('cliente não executa funções internas', !r.ok);

// --- vincular ---
r = await rpc('anon', null, '4.4.4.4', 'verificar_palavra_vinculo', 'amor nosso');
confere('verificar_palavra_vinculo aceita palavra existente', r.ok === true, JSON.stringify(r));
r = await rpc('authenticated', ids.B, '4.4.4.4', 'vincular_laco', 'AMOR NOSSO');
confere('B vincula com a palavra (nome vem do provisório)', r.ok === true && r.nome === 'Bia', JSON.stringify(r));
r = await rpc('authenticated', ids.B, '4.4.4.4', 'vincular_laco', 'amor nosso');
confere('B não vincula de novo', r.codigo === 'ja_tem_laco', JSON.stringify(r));
r = await rpc('authenticated', ids.C, '5.5.5.5', 'vincular_laco', 'amor nosso');
confere('terceira pessoa recebe resposta genérica (Laço completo)', r.codigo === 'nao_encontrado', JSON.stringify(r));
r = await rpc('anon', null, '5.5.5.6', 'verificar_palavra_vinculo', 'amor nosso');
confere('Laço completo é indistinguível de inexistente', r.codigo === 'nao_encontrado', JSON.stringify(r));
const inex = await rpc('anon', null, '5.5.5.7', 'verificar_palavra_vinculo', 'palavra que nao existe');
confere('mesma resposta para inexistente', JSON.stringify(inex) === JSON.stringify(r), JSON.stringify(inex));
confere('provisório foi limpo', (await db.query(`select nome_companheiro_provisorio p from public.lacos`)).rows[0].p === null);
r = await db.query(`insert into public.membros (laco_id, user_id, nome) select id, $1, 'Terceiro' from public.lacos`, [ids.D]).then(() => 'inseriu', (e) => e.message);
confere('gatilho impede o terceiro membro mesmo fora das funções', String(r).includes('laco_completo'), String(r));

// --- perfil e edição do próprio nome ---
r = await rpc('authenticated', ids.A, '2.2.2.2', 'meu_perfil');
confere('perfil de A: vinculado, companheira Bia', r.companheiro_vinculado === true && r.companheiro_nome === 'Bia' && r.nome === 'Ana', JSON.stringify(r));
r = await como('authenticated', ids.B, '2.2.2.2', `update public.membros set nome = 'Bianca' where user_id = $1 returning nome`, [ids.B]);
confere('B edita o próprio nome', r.ok && r.rows.length === 1 && r.rows[0].nome === 'Bianca', JSON.stringify(r));
r = await como('authenticated', ids.B, '2.2.2.2', `update public.membros set nome = 'Hack' where user_id = $1 returning nome`, [ids.A]);
confere('B não edita o nome de A', r.ok && r.rows.length === 0, JSON.stringify(r));
r = await como('authenticated', ids.B, '2.2.2.2', `update public.membros set laco_id = gen_random_uuid() where user_id = $1`, [ids.B]);
confere('B não troca o próprio Laço', !r.ok, JSON.stringify(r));
r = await como('authenticated', ids.B, '2.2.2.2', `update public.membros set nome = '   ' where user_id = $1`, [ids.B]);
confere('nome em branco é recusado', !r.ok);
r = await como('authenticated', ids.B, '2.2.2.2', `select nome from public.membros order by nome`);
confere('B vê os dois membros do próprio Laço', r.ok && r.rows.length === 2, JSON.stringify(r));

// --- limite de tentativas ---
let ultimo;
for (let i = 1; i <= 5; i++) ultimo = await rpc('anon', null, '7.7.7.7', 'verificar_palavra_vinculo', `chute ${i} xx`);
confere('5ª falha ainda responde genérico', ultimo.codigo === 'nao_encontrado', JSON.stringify(ultimo));
r = await rpc('anon', null, '7.7.7.7', 'verificar_palavra_vinculo', 'amor nosso');
confere('depois do limite, bloqueia mesmo a palavra certa', r.codigo === 'bloqueado' && r.bloqueado_ate, JSON.stringify(r));
r = await rpc('anon', null, '7.7.7.7', 'palavra_disponivel', 'qualquer coisa');
confere('o mesmo contador cobre a verificação de criação', r.codigo === 'bloqueado', JSON.stringify(r));
r = await rpc('anon', null, '7.7.7.8', 'verificar_palavra_vinculo', 'amor nosso');
confere('outro IP não é afetado', r.ok === true || r.codigo === 'nao_encontrado', JSON.stringify(r));
const ate = (await db.query(`select (ate - now()) > interval '14 minutes' as ok from public.bloqueios_vinculo where chave = 'palavra:ip:7.7.7.7'`)).rows[0];
confere('bloqueio dura ~15 minutos', ate && ate.ok === true);
await db.exec(`update public.bloqueios_vinculo set ate = now() - interval '1 second'`);
r = await rpc('anon', null, '7.7.7.7', 'verificar_palavra_vinculo', 'amor nosso');
confere('bloqueio expira sozinho', r.codigo !== 'bloqueado', JSON.stringify(r));

// por identidade, mesmo trocando de IP
for (let i = 1; i <= 5; i++) ultimo = await rpc('authenticated', ids.D, `8.8.8.${i}`, 'vincular_laco', `outro chute ${i}`);
r = await rpc('authenticated', ids.D, '8.8.8.99', 'vincular_laco', 'amor nosso');
confere('bloqueio por identidade vale mesmo com outro IP', r.codigo === 'bloqueado', JSON.stringify(r));

// consultas de e-mail
for (let i = 1; i <= 20; i++) ultimo = await rpc('anon', null, '6.6.6.6', 'verificar_email', `p${i}@exemplo.com`);
r = await rpc('anon', null, '6.6.6.6', 'verificar_email', 'ana@exemplo.com');
confere('consulta de e-mail é limitada por IP (contador próprio)', r.codigo === 'bloqueado', JSON.stringify(r));
r = await rpc('anon', null, '6.6.6.6', 'palavra_disponivel', 'livre palavra');
confere('limite de e-mail não bloqueia a palavra', r.ok === true, JSON.stringify(r));

console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
