import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// A chave anônima é pública por desenho: quem protege os dados são as políticas de acesso
// do banco. Chaves privilegiadas (service role) nunca entram no aplicativo.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chaveAnonima = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// O SecureStore limita o tamanho de cada valor (cerca de 2 KB) e a sessão do Supabase é maior;
// por isso ela é guardada em blocos.
const TAMANHO_BLOCO = 1500;

async function removerBlocos(chave: string) {
  const total = await SecureStore.getItemAsync(`${chave}.n`);
  if (total === null) return;
  for (let i = 0; i < Number(total); i++) {
    await SecureStore.deleteItemAsync(`${chave}.${i}`);
  }
  await SecureStore.deleteItemAsync(`${chave}.n`);
}

const armazenamentoSeguro = {
  async getItem(chave: string) {
    const total = await SecureStore.getItemAsync(`${chave}.n`);
    if (total === null) return null;
    const blocos: string[] = [];
    for (let i = 0; i < Number(total); i++) {
      const bloco = await SecureStore.getItemAsync(`${chave}.${i}`);
      if (bloco === null) return null;
      blocos.push(bloco);
    }
    return blocos.join('');
  },
  async setItem(chave: string, valor: string) {
    await removerBlocos(chave);
    const total = Math.ceil(valor.length / TAMANHO_BLOCO);
    for (let i = 0; i < total; i++) {
      await SecureStore.setItemAsync(`${chave}.${i}`, valor.slice(i * TAMANHO_BLOCO, (i + 1) * TAMANHO_BLOCO));
    }
    await SecureStore.setItemAsync(`${chave}.n`, String(total));
  },
  async removeItem(chave: string) {
    await removerBlocos(chave);
  },
};

export const supabaseConfigurado = Boolean(url && chaveAnonima);

// Mesma chave que o `supabase-js` usa por padrão para a sessão (`sb-<projeto>-auth-token`).
const chaveDaSessao = url ? `sb-${new URL(url).hostname.split('.')[0]}-auth-token` : null;

/** Apaga a sessão deste aparelho sem falar com o servidor. Último recurso da saída da conta. */
export async function apagarSessaoLocal() {
  if (chaveDaSessao) await armazenamentoSeguro.removeItem(chaveDaSessao);
}

export const supabase =
  url && chaveAnonima
    ? createClient(url, chaveAnonima, {
        auth: {
          storage: armazenamentoSeguro,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          // Links de e-mail (recuperação de senha) trazem um código de uso único, não os tokens.
          flowType: 'pkce',
        },
      })
    : null;
