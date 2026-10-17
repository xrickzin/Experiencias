import { createURL } from 'expo-linking';

import { apagarSessaoLocal, supabase } from '@/services/supabase';

export type Perfil = {
  membro_id: string;
  nome: string;
  laco_id: string;
  companheiro_vinculado: boolean;
  companheiro_nome: string | null;
};

export type Falha = { ok: false; codigo: string; mensagem: string };
export type Resultado<T = object> = ({ ok: true } & T) | Falha;

// Mensagens da interface (UX). Para o código do casal, a vinculação nunca revela se ele existe.
const MENSAGENS: Record<string, string> = {
  bloqueado: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
  palavra_em_uso: 'Esse código já está em uso. Escolha outro.',
  palavra_invalida: 'Esse código não pode ser usado. Escolha outro, com pelo menos 4 caracteres.',
  nao_encontrado: 'Não encontramos um Laço com esse código.',
  ja_tem_laco: 'Esta conta já faz parte de um Laço.',
  dados_invalidos: 'Confira os nomes e tente de novo.',
  email_invalido: 'Confira o e-mail: ele parece incompleto.',
  email_ja_cadastrado: 'Já existe uma conta com esse e-mail.',
  senha_fraca: 'A senha deve ter pelo menos 8 caracteres.',
  credenciais_invalidas:
    'Não conseguimos validar seus dados de acesso. Confira o e-mail e a senha e tente de novo.',
  sem_sessao: 'Sua sessão terminou. Entre de novo para continuar.',
  sessao_nao_iniciada: 'A conta foi criada, mas não foi possível iniciar a sessão. Tente entrar com o e-mail e a senha.',
  rede: 'Não foi possível conectar. Verifique sua internet e tente de novo.',
  sem_configuracao: 'O aplicativo ainda não está conectado ao servidor.',
  senha_igual: 'Escolha uma senha diferente da atual.',
  link_invalido: 'Esse link não é mais válido. Peça um novo.',
  link_expirado: 'Esse link expirou ou já foi usado. Peça um novo.',
  desejo_invalido: 'Confira os dados do desejo: o título é obrigatório e os textos têm limite de tamanho.',
  desejo_inexistente: 'Esse desejo não existe mais.',
  transicao_invalida: 'Essa mudança não é possível a partir do estado atual.',
  destaque_invalido: 'Não foi possível usar essa foto como destaque. Tente de novo.',
  referencia_obrigatoria: 'Digam quando vocês viveram isso para guardar como memória.',
  referencia_invalida: 'Confira a data informada e tente de novo.',
  memoria_invalida: 'Confira os dados da memória: o título e quando aconteceu são obrigatórios.',
  experiencia_inexistente: 'Essa experiência não existe mais.',
  nao_e_memoria: 'Isso só pode ser feito depois que a experiência vira memória.',
  observacao_invalida: 'Escreva algo na observação, com até 2.000 caracteres.',
  observacao_inexistente: 'Essa observação não existe mais.',
  observacao_nao_salva: 'Não foi possível guardar a observação. Tente de novo.',
  impressao_longa: 'A impressão pode ter até 4.000 caracteres.',
  favorito_invalido: 'Não foi possível usar essa foto como seu momento favorito. Tente de novo.',
  legenda_longa: 'A legenda pode ter até 300 caracteres.',
  legenda_nao_salva: 'Não foi possível guardar a legenda. Tente de novo.',
  data_nao_salva: 'Não foi possível guardar quando a foto foi tirada. Tente de novo.',
  compartilhar: 'Não foi possível preparar a foto para compartilhar. Tente de novo.',
  categoria_vazia: 'Dê um nome à categoria.',
  categoria_longa: 'O nome da categoria pode ter até 40 caracteres.',
  categoria_repetida: 'Já existe uma categoria com esse nome.',
  categoria_inexistente: 'Essa categoria não existe mais.',
  link_sem_titulo: 'Dê um nome ao link.',
  link_titulo_longo: 'O nome do link pode ter até 60 caracteres.',
  link_endereco_invalido: 'Cole um endereço válido, como https://exemplo.com.',
  link_inexistente: 'Esse link não existe mais.',
  link_nao_salvo: 'Não foi possível guardar o link. Tente de novo.',
  reserva_sem_nome: 'Dê um nome à reserva.',
  reserva_nome_longo: 'O nome da reserva pode ter até 80 caracteres.',
  reserva_data_invalida: 'Informe o dia como DD/MM/AAAA, por exemplo 12/12/2026.',
  reserva_horario_invalido: 'Informe o horário como HH:MM, por exemplo 14:00.',
  reserva_horario_sem_dia: 'Para pôr um horário, informe também o dia.',
  reserva_codigo_longo: 'O código pode ter até 60 caracteres.',
  reserva_invalida: 'Confira os dados da reserva e tente de novo.',
  reserva_inexistente: 'Essa reserva não existe mais.',
  reserva_nao_salva: 'Não foi possível guardar a reserva. Tente de novo.',
  roteiro_sem_texto: 'Escrevam o que vão fazer.',
  roteiro_texto_longo: 'Cada item do roteiro pode ter até 200 caracteres.',
  roteiro_dia_invalido: 'Informe o dia como DD/MM/AAAA, por exemplo 12/12/2026.',
  roteiro_horario_invalido: 'Informe o horário como HH:MM, por exemplo 14:00.',
  roteiro_horario_fora_do_periodo: 'Esse horário não fica no período escolhido.',
  roteiro_invalido: 'Confira o item do roteiro e tente de novo.',
  roteiro_desligado: 'O roteiro desta experiência foi desligado.',
  roteiro_inexistente: 'Esse item do roteiro não existe mais.',
  roteiro_nao_salvo: 'Não foi possível guardar o item do roteiro. Tente de novo.',
  roteiro_nao_movido: 'Não foi possível mudar a ordem do roteiro. Tente de novo.',
  orcamento_alto: 'O orçamento pode ir até R$ 100.000,00.',
  orcamento_invalido: 'Confira o valor e tente de novo. O orçamento pode ir até R$ 100.000,00.',
  orcamento_nao_salvo: 'Não foi possível guardar o orçamento. Tente de novo.',
  salvar: 'Não foi possível salvar a foto no celular. Confira se o Laço pode acessar as fotos e tente de novo.',
  foto_inexistente: 'Essa foto não existe mais.',
  foto_grande: 'Essa foto é grande demais. Tente outra.',
  foto_nao_enviada: 'Não foi possível guardar a foto. Tente de novo.',
  foto_nao_removida: 'Não foi possível apagar a foto. Tente de novo.',
  fotos_nao_removidas: 'Não foi possível apagar as fotos desta experiência. Nada foi excluído; tente de novo.',
};

const MENSAGEM_PADRAO = 'Algo deu errado. Tente novamente.';

export function falha(codigo: string): Falha {
  return { ok: false, codigo, mensagem: MENSAGENS[codigo] ?? MENSAGEM_PADRAO };
}

export type ErroServico = { message?: string; code?: string; name?: string; status?: number } | null;

export function ehErroDeRede(erro: NonNullable<ErroServico>) {
  return (
    erro.name === 'AuthRetryableFetchError' ||
    erro.status === 0 ||
    /network|fetch|timeout/i.test(erro.message ?? '')
  );
}

function falhaDeAuth(erro: NonNullable<ErroServico>): Falha {
  if (ehErroDeRede(erro)) return falha('rede');
  // Recuperação de senha: sessão ausente ou verificador do PKCE perdido (link aberto em outro aparelho).
  if (erro.name === 'AuthSessionMissingError' || erro.name === 'AuthPKCECodeVerifierMissingError') {
    return falha('link_invalido');
  }
  switch (erro.code) {
    case 'same_password':
      return falha('senha_igual');
    case 'session_not_found':
    case 'session_expired':
    case 'refresh_token_not_found':
    case 'bad_jwt':
      return falha('link_invalido');
    case 'invalid_credentials':
      return falha('credenciais_invalidas');
    case 'user_already_exists':
    case 'email_exists':
      return falha('email_ja_cadastrado');
    case 'weak_password':
      return falha('senha_fraca');
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return falha('bloqueado');
    default:
      return falha('desconhecido');
  }
}

type RespostaFuncao = {
  ok: boolean;
  codigo?: string;
  existe?: boolean;
  nome?: string;
};

async function chamar(
  funcao: string,
  argumentos?: Record<string, unknown>
): Promise<Resultado<RespostaFuncao>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.rpc(funcao, argumentos);
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    const resposta = data as RespostaFuncao;
    return resposta.ok ? { ...resposta, ok: true } : falha(resposta.codigo ?? 'desconhecido');
  } catch {
    return falha('rede');
  }
}

const normalizarEmail = (email: string) => email.trim().toLowerCase();

/** Primeiro passo de "Quero entrar no nosso Laço". */
export async function consultarEmail(email: string): Promise<Resultado<{ existe: boolean }>> {
  const r = await chamar('verificar_email', { p_email: email });
  return r.ok ? { ok: true, existe: Boolean(r.existe) } : r;
}

/** Etapa do código na criação: informa se o código já está em uso (de propósito, ADR 016). */
export async function verificarCodigoDisponivel(codigo: string): Promise<Resultado> {
  const r = await chamar('palavra_disponivel', { p_palavra: codigo });
  return r.ok ? { ok: true } : r;
}

/** Etapa do código na entrada de quem ainda não tem conta: resposta genérica para qualquer falha. */
export async function verificarCodigoDeVinculo(codigo: string): Promise<Resultado> {
  const r = await chamar('verificar_palavra_vinculo', { p_palavra: codigo });
  return r.ok ? { ok: true } : r;
}

export async function criarLaco(dados: {
  nome: string;
  nomeCompanheiro: string;
  codigo: string;
}): Promise<Resultado> {
  const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const r = await chamar('criar_laco', {
    p_nome: dados.nome,
    p_nome_companheiro: dados.nomeCompanheiro,
    p_palavra: dados.codigo,
    p_fuso: fuso,
  });
  return r.ok ? { ok: true } : r;
}

export async function vincularLaco(codigo: string): Promise<Resultado> {
  const r = await chamar('vincular_laco', { p_palavra: codigo });
  return r.ok ? { ok: true } : r;
}

export async function buscarPerfil(): Promise<Resultado<{ perfil: Perfil | null }>> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.rpc('meu_perfil');
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return { ok: true, perfil: (data as Perfil | null) ?? null };
  } catch {
    return falha('rede');
  }
}

export async function entrar(email: string, senha: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizarEmail(email),
      password: senha,
    });
    return error ? falhaDeAuth(error) : { ok: true };
  } catch {
    return falha('rede');
  }
}

/** Cria a identidade (e-mail + senha). A confirmação de e-mail fica desligada no projeto (ADR 017). */
export async function cadastrar(email: string, senha: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalizarEmail(email),
      password: senha,
    });
    if (error) return falhaDeAuth(error);
    if (data.session) return { ok: true };
    // Sem sessão na resposta do cadastro (ex.: fluxo PKCE): a conta já está confirmada, então entra
    // com as mesmas credenciais em vez de pedir que a pessoa faça isso à mão.
    const login = await entrar(email, senha);
    return login.ok ? login : falha('sessao_nao_iniciada');
  } catch {
    return falha('rede');
  }
}

/**
 * Pede o e-mail de redefinição. O Supabase responde com sucesso mesmo quando não há conta com esse
 * e-mail, e a interface mantém a mesma confirmação neutra nos dois casos.
 */
export async function solicitarRecuperacaoDeSenha(email: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizarEmail(email), {
      // Em build: laco://redefinir-senha. No Expo Go: exp://<endereço do servidor>/--/redefinir-senha.
      redirectTo: createURL('redefinir-senha'),
    });
    return error ? falhaDeAuth(error) : { ok: true };
  } catch {
    return falha('rede');
  }
}

/** Troca o código do link (PKCE) por uma sessão de recuperação. Só aceita links de recuperação. */
export async function abrirSessaoDeRecuperacao(codigo: string, flowId?: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      codigo,
      flowId ? { flowId } : undefined
    );
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('link_invalido');
    // `redirectType` vem da resposta, mas não consta na tipagem desta versão.
    const tipo = (data as { redirectType?: string | null }).redirectType;
    if (tipo !== 'recovery') {
      // O código era de outro tipo de fluxo: não deixa uma sessão aberta por esta tela.
      await supabase.auth.signOut();
      return falha('link_invalido');
    }
    return { ok: true };
  } catch {
    return falha('rede');
  }
}

/** Define a nova senha da sessão de recuperação e encerra as sessões desta conta em outros aparelhos. */
export async function definirNovaSenha(senha: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) return falhaDeAuth(error);
    await supabase.auth.signOut({ scope: 'others' });
    return { ok: true };
  } catch {
    return falha('rede');
  }
}

export async function atualizarMeuNome(membroId: string, nome: string): Promise<Resultado> {
  if (!supabase) return falha('sem_configuracao');
  try {
    const { data, error } = await supabase
      .from('membros')
      .update({ nome: nome.trim() })
      .eq('id', membroId)
      .select('id');
    if (error) return ehErroDeRede(error) ? falha('rede') : falha('desconhecido');
    return data.length === 1 ? { ok: true } : falha('desconhecido');
  } catch {
    return falha('rede');
  }
}

const ESPERA_DA_SAIDA_MS = 5000;

/**
 * Encerra a sessão. Se o servidor não responder (sem rede, travado) ou der erro, a sessão é
 * apagada só deste aparelho: sair não pode depender de conexão.
 */
export async function sair(): Promise<void> {
  if (!supabase) return;
  let terminou = false;
  try {
    const limite = new Promise<'tempo'>((resolve) => setTimeout(() => resolve('tempo'), ESPERA_DA_SAIDA_MS));
    const resultado = await Promise.race([supabase.auth.signOut().then(() => 'ok' as const), limite]);
    terminou = resultado === 'ok';
  } catch {
    terminou = false;
  }
  if (!terminou) await apagarSessaoLocal();
}
