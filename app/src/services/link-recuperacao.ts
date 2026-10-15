// Interpreta os parâmetros do link de recuperação de senha. Sem dependências: pode ser testado
// fora do aplicativo. Nunca registra nem devolve o link inteiro.

export type ParametrosDoLink = Record<string, string | string[] | undefined>;

export type ResultadoDoLink =
  | { tipo: 'codigo'; codigo: string; flowId?: string }
  | { tipo: 'invalido'; motivo: 'expirado' | 'negado' | 'ausente' };

// Códigos e identificadores do Supabase usam só estes caracteres; o limite barra entradas absurdas.
const FORMATO_VALIDO = /^[A-Za-z0-9._~-]{1,512}$/;

function primeiro(valor: string | string[] | undefined): string | undefined {
  const v = Array.isArray(valor) ? valor[0] : valor;
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export function interpretarLinkDeRecuperacao(params: ParametrosDoLink): ResultadoDoLink {
  // O Supabase devolve falhas (link expirado, já usado) como parâmetros de erro no mesmo endereço.
  const erro = primeiro(params.error) ?? primeiro(params.error_code);
  if (erro) {
    const codigoDoErro = primeiro(params.error_code);
    return { tipo: 'invalido', motivo: codigoDoErro === 'otp_expired' ? 'expirado' : 'negado' };
  }

  const codigo = primeiro(params.code);
  if (!codigo || !FORMATO_VALIDO.test(codigo)) {
    return { tipo: 'invalido', motivo: 'ausente' };
  }

  const flowId = primeiro(params.sb_flow_id);
  return flowId && FORMATO_VALIDO.test(flowId) ? { tipo: 'codigo', codigo, flowId } : { tipo: 'codigo', codigo };
}
