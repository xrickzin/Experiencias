// Validações de formulário. O servidor valida de novo: estas só dão resposta rápida à pessoa.

export const TAMANHO_MINIMO_SENHA = 8;
// Mesmo valor de `palavra_tamanho_minimo` em `configuracao_servidor` (migração da Fase 1).
export const TAMANHO_MINIMO_CODIGO = 4;
export const TAMANHO_MAXIMO_NOME = 60;
export const TAMANHO_MAXIMO_CODIGO = 60;

export function validarNome(valor: string): string | undefined {
  const nome = valor.trim();
  if (!nome) return 'Escreva um nome para continuar.';
  if (nome.length > TAMANHO_MAXIMO_NOME) return `O nome deve ter até ${TAMANHO_MAXIMO_NOME} caracteres.`;
}

export function validarEmail(valor: string): string | undefined {
  const email = valor.trim();
  if (!email) return 'Escreva seu e-mail para continuar.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Confira o e-mail: ele parece incompleto.';
}

export function validarSenha(valor: string): string | undefined {
  if (!valor) return 'Escreva uma senha para continuar.';
  if (valor.length < TAMANHO_MINIMO_SENHA) {
    return `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
  }
}

export function validarConfirmacao(senha: string, confirmacao: string): string | undefined {
  if (!confirmacao) return 'Confirme a senha para continuar.';
  if (senha !== confirmacao) return 'As senhas não são iguais.';
}

export function validarCodigo(valor: string): string | undefined {
  const codigo = valor.trim();
  if (!codigo) return 'Escreva o código do casal para continuar.';
  if (codigo.length < TAMANHO_MINIMO_CODIGO) {
    return `O código deve ter pelo menos ${TAMANHO_MINIMO_CODIGO} caracteres.`;
  }
  if (codigo.length > TAMANHO_MAXIMO_CODIGO) {
    return `O código deve ter até ${TAMANHO_MAXIMO_CODIGO} caracteres.`;
  }
}
