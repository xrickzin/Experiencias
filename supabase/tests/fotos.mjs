// Integração da Fase 4 contra o Supabase LOCAL: fotos como registros, bucket privado, URLs assinadas,
// autoria pelo servidor, isolamento entre Laços e exclusão (arquivo antes da linha, ADR 020).
// Rodar a partir da raiz (com `supabase start` e as migrações aplicadas):
//   node supabase/tests/fotos.mjs

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

// Uma "foto" mínima: os bytes de um JPEG pequeno bastam para o Storage (ele confere o tipo declarado).
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
const enviar = (cliente, caminho, corpo = JPEG, contentType = 'image/jpeg') =>
  cliente.storage.from('experiencias').upload(caminho, corpo, { contentType, upsert: false });

const ana = await pessoa('ana');
const bia = await pessoa('bia');
const caio = await pessoa('caio');
await ana.rpc('criar_laco', { p_nome: 'Ana', p_nome_companheiro: 'Bia', p_palavra: `fotos ${sufixo}`, p_fuso: null });
await bia.rpc('vincular_laco', { p_palavra: `fotos ${sufixo}` });
await caio.rpc('criar_laco', { p_nome: 'Caio', p_nome_companheiro: 'Dani', p_palavra: `outrofoto ${sufixo}`, p_fuso: null });

const perfilAna = (await ana.rpc('meu_perfil')).data;
const lacoId = perfilAna.laco_id;
const exp = (await ana.from('experiencias').insert({ titulo: 'Viagem' }).select('id')).data[0];
const caminho = (nome) => `${lacoId}/${exp.id}/${nome}`;

// --- em Desejo não há registros -----------------------------------------------------------------
let r = await enviar(ana, caminho('desejo.jpg'));
confere('em Desejo, o Storage recusa a foto', Boolean(r.error), JSON.stringify(r.data));
r = await ana.from('registros').insert({ experiencia_id: exp.id, caminho: caminho('desejo.jpg') }).select('id');
confere('em Desejo, o registro é recusado', Boolean(r.error), JSON.stringify(r.data));

await ana.rpc('mudar_estado', { p_experiencia: exp.id, p_estado: 'planejamento' });

// --- enviar ------------------------------------------------------------------------------------
r = await enviar(ana, caminho('a.jpg'));
confere('em Planejamento, Ana envia a foto', !r.error, r.error?.message);
r = await ana.from('registros').insert({ experiencia_id: exp.id, caminho: caminho('a.jpg') }).select('id, autor_id, tipo, laco_id');
const registro = r.data?.[0];
confere('o registro nasce com autor, Laço e tipo definidos pelo servidor',
  registro?.autor_id === perfilAna.membro_id && registro?.tipo === 'foto' && registro?.laco_id === lacoId,
  JSON.stringify(r.data ?? r.error));

r = await enviar(ana, caminho('texto.jpg'), Buffer.from('não é imagem'), 'text/plain');
confere('arquivo que não é imagem é recusado pelo bucket', Boolean(r.error), JSON.stringify(r.data));
r = await enviar(ana, caminho('a.jpg'));
confere('não sobrescreve um arquivo existente', Boolean(r.error), JSON.stringify(r.data));
r = await ana.from('registros').insert({ experiencia_id: exp.id, caminho: `${lacoId}/00000000-0000-0000-0000-000000000000/x.jpg` }).select('id');
confere('o caminho precisa ser da mesma experiência', Boolean(r.error), JSON.stringify(r.data));
r = await ana.from('registros').insert({ experiencia_id: exp.id, caminho: caminho('b.jpg'), autor_id: perfilAna.membro_id }).select('id');
confere('o cliente não escolhe o autor', Boolean(r.error), JSON.stringify(r.data));
r = await ana.from('registros').insert({ experiencia_id: exp.id, caminho: caminho('../../fora.jpg') }).select('id');
confere('caminho com "../" é recusado', Boolean(r.error), JSON.stringify(r.data));

// --- quando a foto foi tirada --------------------------------------------------------------------
r = await enviar(ana, caminho('capturada.jpg'));
r = await ana.from('registros').insert({ experiencia_id: exp.id, caminho: caminho('capturada.jpg'), capturada_em: '2026-03-10T23:15:00Z' }).select('id, capturada_em');
confere('guarda o momento em que a foto foi tirada', r.data?.[0] && new Date(r.data[0].capturada_em).toISOString() === '2026-03-10T23:15:00.000Z', JSON.stringify(r.data ?? r.error));
const capturadaId = r.data?.[0]?.id;
r = await enviar(ana, caminho('futuro.jpg'));
r = await ana.from('registros').insert({ experiencia_id: exp.id, caminho: caminho('futuro.jpg'), capturada_em: '2099-01-01T00:00:00Z' }).select('id');
confere('momento de captura no futuro é recusado', Boolean(r.error), JSON.stringify(r.data));
await ana.storage.from('experiencias').remove([caminho('futuro.jpg'), caminho('capturada.jpg')]);
await ana.from('registros').delete().eq('id', capturadaId);

// --- ver ---------------------------------------------------------------------------------------
r = await bia.from('registros').select('id, caminho').eq('experiencia_id', exp.id);
confere('Bia vê a foto da Ana', r.data?.length === 1, JSON.stringify(r.data ?? r.error));
r = await bia.storage.from('experiencias').createSignedUrls([caminho('a.jpg')], 60);
const url = r.data?.[0]?.signedUrl;
confere('Bia gera uma URL assinada', Boolean(url) && !r.data?.[0]?.error, JSON.stringify(r.data ?? r.error));
const baixado = url ? Buffer.from(await (await fetch(url)).arrayBuffer()) : Buffer.alloc(0);
confere('a URL assinada entrega o mesmo arquivo', baixado.equals(JPEG), `${baixado.length} bytes`);

const publica = `${status.API_URL}/storage/v1/object/public/experiencias/${caminho('a.jpg')}`;
const respostaPublica = await fetch(publica);
confere('não há acesso público ao arquivo', respostaPublica.status >= 400, String(respostaPublica.status));

// --- outro Laço e sem sessão -------------------------------------------------------------------
r = await caio.from('registros').select('id').eq('experiencia_id', exp.id);
confere('outro Laço não vê os registros', r.data?.length === 0, JSON.stringify(r.data ?? r.error));
r = await caio.storage.from('experiencias').createSignedUrls([caminho('a.jpg')], 60);
confere('outro Laço não gera URL assinada', !r.data?.[0]?.signedUrl, JSON.stringify(r.data ?? r.error));
r = await enviar(caio, caminho('invasao.jpg'));
confere('outro Laço não envia para a pasta do Laço', Boolean(r.error), JSON.stringify(r.data));
r = await caio.storage.from('experiencias').remove([caminho('a.jpg')]);
r = await bia.storage.from('experiencias').createSignedUrls([caminho('a.jpg')], 60);
confere('outro Laço não apaga o arquivo', Boolean(r.data?.[0]?.signedUrl), JSON.stringify(r.data ?? r.error));
r = await aparelho().storage.from('experiencias').createSignedUrls([caminho('a.jpg')], 60);
confere('sem sessão não há URL assinada', !r.data?.[0]?.signedUrl, JSON.stringify(r.data ?? r.error));

// --- voltar a Desejo mantém as fotos, mas não aceita novas ---------------------------------------
await ana.rpc('mudar_estado', { p_experiencia: exp.id, p_estado: 'desejo' });
r = await bia.from('registros').select('id').eq('experiencia_id', exp.id);
confere('voltar a Desejo não apaga registros', r.data?.length === 1, JSON.stringify(r.data));
r = await enviar(bia, caminho('depois.jpg'));
confere('de volta a Desejo, novas fotos são recusadas', Boolean(r.error), JSON.stringify(r.data));
await ana.rpc('mudar_estado', { p_experiencia: exp.id, p_estado: 'planejamento' });
await ana.rpc('mudar_estado', { p_experiencia: exp.id, p_estado: 'vivendo' });
r = await enviar(bia, caminho('vivendo.jpg'));
confere('em Vivendo, Bia envia', !r.error, r.error?.message);
r = await bia.from('registros').insert({ experiencia_id: exp.id, caminho: caminho('vivendo.jpg') }).select('id');
confere('e registra a foto', r.data?.length === 1, JSON.stringify(r.data ?? r.error));

// --- excluir uma foto: arquivo, depois linha -----------------------------------------------------
r = await bia.storage.from('experiencias').remove([caminho('a.jpg')]);
confere('Bia apaga o arquivo da foto da Ana', !r.error && r.data?.length === 1, JSON.stringify(r.data ?? r.error));
r = await bia.from('registros').delete().eq('id', registro.id).select('id');
confere('e depois o registro', r.data?.length === 1, JSON.stringify(r.data ?? r.error));
r = await ana.storage.from('experiencias').createSignedUrls([caminho('a.jpg')], 60);
confere('o arquivo não existe mais', !r.data?.[0]?.signedUrl || Boolean(r.data?.[0]?.error), JSON.stringify(r.data));

// --- excluir a experiência com fotos: arquivos, depois a experiência -----------------------------
const restantes = (await ana.from('registros').select('caminho').eq('experiencia_id', exp.id)).data.map((x) => x.caminho);
r = await ana.storage.from('experiencias').remove(restantes);
confere('remove os arquivos da experiência', !r.error && r.data?.length === restantes.length, JSON.stringify(r.data ?? r.error));
r = await ana.from('experiencias').delete().eq('id', exp.id).select('id');
confere('exclui a experiência', r.data?.length === 1, JSON.stringify(r.data ?? r.error));
r = await ana.from('registros').select('id').eq('experiencia_id', exp.id);
confere('os registros saem junto', r.data?.length === 0, JSON.stringify(r.data));

console.log(falhas === 0 ? '\nTODOS OS TESTES DA FASE 4 PASSARAM' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
