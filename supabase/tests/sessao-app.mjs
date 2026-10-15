// Confere, contra o Supabase LOCAL, o comportamento da sessão do jeito que o app a usa: armazenamento
// em blocos (como o expo-secure-store, com o limite de ~2 KB por valor), PKCE e saída da conta.
// Rodar a partir da raiz:  node supabase/tests/sessao-app.mjs   (com `supabase start` ligado)

import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../app/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');

// Mesma lógica de app/src/services/supabase.ts, sobre um Map no lugar do SecureStore.
const memoria = new Map();
const LIMITE_DO_SECURE_STORE = 2048;
const TAMANHO_BLOCO = 1500;

const SecureStore = {
  getItemAsync: async (k) => memoria.get(k) ?? null,
  setItemAsync: async (k, v) => {
    if (v.length > LIMITE_DO_SECURE_STORE) throw new Error(`valor de ${v.length} caracteres passa do limite`);
    memoria.set(k, v);
  },
  deleteItemAsync: async (k) => void memoria.delete(k),
};

async function removerBlocos(chave) {
  const total = await SecureStore.getItemAsync(`${chave}.n`);
  if (total === null) return;
  for (let i = 0; i < Number(total); i++) await SecureStore.deleteItemAsync(`${chave}.${i}`);
  await SecureStore.deleteItemAsync(`${chave}.n`);
}

const armazenamento = {
  async getItem(chave) {
    const total = await SecureStore.getItemAsync(`${chave}.n`);
    if (total === null) return null;
    const blocos = [];
    for (let i = 0; i < Number(total); i++) {
      const bloco = await SecureStore.getItemAsync(`${chave}.${i}`);
      if (bloco === null) return null;
      blocos.push(bloco);
    }
    return blocos.join('');
  },
  async setItem(chave, valor) {
    await removerBlocos(chave);
    const total = Math.ceil(valor.length / TAMANHO_BLOCO);
    for (let i = 0; i < total; i++) {
      await SecureStore.setItemAsync(`${chave}.${i}`, valor.slice(i * TAMANHO_BLOCO, (i + 1) * TAMANHO_BLOCO));
    }
    await SecureStore.setItemAsync(`${chave}.n`, String(total));
  },
  async removeItem(chave) {
    await removerBlocos(chave);
  },
};

const saida = execSync('npx --yes supabase@2.119.0 status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const status = {};
for (const linha of saida.split('\n')) {
  const m = linha.trim().match(/^([A-Z_]+)="?(.*?)"?$/);
  if (m) status[m[1]] = m[2];
}

let falhas = 0;
const confere = (nome, ok, detalhe = '') => {
  if (!ok) falhas++;
  console.log(ok ? 'ok   ' : 'FALHA', nome, ok ? '' : detalhe);
};

const cliente = createClient(status.API_URL, status.PUBLISHABLE_KEY, {
  auth: { storage: armazenamento, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'pkce' },
});
const eventos = [];
cliente.auth.onAuthStateChange((evento) => eventos.push(evento));

const email = `sessao-${Date.now()}@exemplo.test`;
let r = await cliente.auth.signUp({ email, password: 'senha-forte-1' });
confere('cadastro abre sessão e grava nos blocos sem estourar o limite', Boolean(r.data.session), r.error?.message);
confere('há blocos guardados', memoria.size > 0, `${memoria.size} chaves`);
confere('a sessão volta íntegra do armazenamento', Boolean((await cliente.auth.getSession()).data.session));

r = await cliente.auth.signOut();
confere('signOut sem erro', !r.error, r.error?.message);
confere('depois de sair não sobra bloco da sessão', [...memoria.keys()].every((k) => !/auth-token/.test(k)), [...memoria.keys()].join(','));
confere('getSession devolve nulo', (await cliente.auth.getSession()).data.session === null);
await new Promise((ok) => setTimeout(ok, 200));
confere('o ouvinte recebe SIGNED_OUT', eventos.includes('SIGNED_OUT'), eventos.join(','));

console.log(falhas === 0 ? '\nOK' : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
