// Foto de perfil (ADR 043) contra o Supabase LOCAL.
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/foto-perfil.mjs

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
await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `perfil ${sufixo}`, p_fuso: null });
await bia.rpc('vincular_laco', { p_palavra: `perfil ${sufixo}` });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outroperfil ${sufixo}`, p_fuso: null });
const perfilAna = (await ana.rpc('meu_perfil')).data;
const lacoId = perfilAna.laco_id;
const anaId = perfilAna.membro_id;
const biaId = (await bia.rpc('meu_perfil')).data.membro_id;
const caminhoDaAna = `${lacoId}/perfil/${anaId}-1.jpg`;

let r = await ana.storage.from('experiencias').upload(caminhoDaAna, JPEG, { contentType: 'image/jpeg' });
confere('Ana envia a própria foto de perfil', !r.error, j(r));
r = await ana.from('membros').update({ foto_caminho: caminhoDaAna }).eq('id', anaId).select('foto_caminho');
confere('e passa a usá-la', r.data?.[0]?.foto_caminho === caminhoDaAna, j(r));

r = await bia.rpc('meu_perfil');
confere('Bia vê a foto de Ana no perfil', r.data?.companheiro_foto_caminho === caminhoDaAna && r.data?.foto_caminho === null, j(r));
r = await bia.storage.from('experiencias').createSignedUrl(caminhoDaAna, 60);
confere('e consegue abri-la', Boolean(r.data?.signedUrl), j(r));

r = await bia.storage.from('experiencias').upload(`${lacoId}/perfil/${anaId}-2.jpg`, JPEG, { contentType: 'image/jpeg' });
confere('Bia não envia foto no lugar da de Ana', Boolean(r.error), j(r));
r = await bia.from('membros').update({ foto_caminho: null }).eq('id', anaId).select('id');
confere('nem troca a foto de Ana', Boolean(r.error) || r.data?.length === 0, j(r));
r = await ana.from('membros').update({ foto_caminho: `${lacoId}/outra-pasta/${anaId}-1.jpg` }).eq('id', anaId).select('id');
confere('a foto precisa estar na pasta de perfil da própria pessoa', Boolean(r.error), j(r));
r = await ana.from('membros').update({ foto_caminho: `${lacoId}/perfil/${biaId}-1.jpg` }).eq('id', anaId).select('id');
confere('e com o próprio id no nome', Boolean(r.error), j(r));

r = await caio.storage.from('experiencias').createSignedUrl(caminhoDaAna, 60);
confere('outro Laço não abre a foto', !r.data?.signedUrl, j(r));

r = await ana.from('membros').update({ foto_caminho: null }).eq('id', anaId).select('foto_caminho');
confere('Ana pode tirar a foto', r.data?.[0]?.foto_caminho === null, j(r));
r = await ana.storage.from('experiencias').remove([caminhoDaAna]);
confere('e apagar o arquivo', !r.error, j(r));

console.log(falhas === 0 ? '\nTODOS OS TESTES DA FOTO DE PERFIL PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
