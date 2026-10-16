// Integração da foto de destaque contra o Supabase LOCAL: escolher, trocar, limpar, foto de outra
// experiência recusada, outro Laço sem acesso e ponteiro limpo quando a foto é excluída (ADR 020).
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/destaque.mjs

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

const ana = await pessoa('ana');
const bia = await pessoa('bia');
const caio = await pessoa('caio');
await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `destaque ${sufixo}`, p_fuso: null });
await bia.rpc('vincular_laco', { p_palavra: `destaque ${sufixo}` });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outrodest ${sufixo}`, p_fuso: null });
const lacoId = (await ana.rpc('meu_perfil')).data.laco_id;

async function experienciaComFotos(titulo, nomes) {
  const exp = (await ana.from('experiencias').insert({ titulo }).select('id')).data[0];
  await ana.rpc('mudar_estado', { p_experiencia: exp.id, p_estado: 'planejamento' });
  await ana.rpc('mudar_estado', { p_experiencia: exp.id, p_estado: 'vivendo' });
  const fotos = [];
  for (const nome of nomes) {
    const caminho = `${lacoId}/${exp.id}/${nome}`;
    await ana.storage.from('experiencias').upload(caminho, JPEG, { contentType: 'image/jpeg' });
    fotos.push((await ana.from('registros').insert({ experiencia_id: exp.id, caminho }).select('id, caminho')).data[0]);
  }
  return { exp, fotos };
}

const { exp, fotos } = await experienciaComFotos('Fim de semana', ['a.jpg', 'b.jpg']);
const outra = await experienciaComFotos('Outra', ['c.jpg']);
const destaque = (cliente, id, fotoId) =>
  cliente.from('experiencias').update({ foto_destaque_id: fotoId }).eq('id', id).select('id, foto_destaque_id');

let r = await destaque(bia, exp.id, fotos[0].id);
confere('Bia escolhe a foto de destaque (compartilhada)', r.data?.[0]?.foto_destaque_id === fotos[0].id, JSON.stringify(r.data ?? r.error));

r = await ana.from('experiencias').select('id, foto_destaque:registros!experiencias_foto_destaque_id_fkey(caminho)').eq('id', exp.id);
confere('a lista traz o caminho do destaque junto', r.data?.[0]?.foto_destaque?.caminho === fotos[0].caminho, JSON.stringify(r.data ?? r.error));

r = await destaque(ana, exp.id, fotos[1].id);
confere('Ana troca o destaque', r.data?.[0]?.foto_destaque_id === fotos[1].id, JSON.stringify(r.data ?? r.error));

r = await destaque(ana, exp.id, outra.fotos[0].id);
confere('foto de outra experiência não pode ser destaque', Boolean(r.error), JSON.stringify(r.data));

r = await destaque(caio, exp.id, fotos[0].id);
confere('outro Laço não muda o destaque', !r.error && r.data?.length === 0, JSON.stringify(r.data ?? r.error));

r = await destaque(ana, exp.id, null);
confere('tirar o destaque', r.data?.[0]?.foto_destaque_id === null, JSON.stringify(r.data ?? r.error));

await destaque(ana, exp.id, fotos[1].id);
await ana.storage.from('experiencias').remove([fotos[1].caminho]);
await ana.from('registros').delete().eq('id', fotos[1].id);
r = await ana.from('experiencias').select('foto_destaque_id').eq('id', exp.id);
confere('excluir a foto limpa o destaque, sem substituta', r.data?.[0]?.foto_destaque_id === null, JSON.stringify(r.data));

// Limpeza: arquivos antes das linhas.
for (const { exp: e, fotos: fs } of [{ exp, fotos }, outra]) {
  await ana.storage.from('experiencias').remove(fs.map((f) => f.caminho));
  await ana.from('experiencias').delete().eq('id', e.id);
}

console.log(falhas === 0 ? '\nTODOS OS TESTES DA FOTO DE DESTAQUE PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
