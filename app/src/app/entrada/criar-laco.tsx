import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Share, View } from 'react-native';

import { Button } from '@/components/button';
import { MensagemErro } from '@/components/mensagem-erro';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useSessao } from '@/hooks/use-sessao';
import {
  buscarPerfil,
  cadastrar,
  criarLaco,
  entrar,
  verificarCodigoDisponivel,
} from '@/services/laco';
import {
  validarCodigo,
  validarConfirmacao,
  validarEmail,
  validarNome,
  validarSenha,
} from '@/services/validacao';
import { useTheme } from '@/hooks/use-theme';

type Etapa = 'nome' | 'companheiro' | 'codigo' | 'acesso' | 'pronto';
type Campo = 'nome' | 'companheiro' | 'codigo' | 'email' | 'senha' | 'confirmacao';

export default function CriarLaco() {
  const theme = useTheme();
  const { usuarioId, reter, liberar } = useSessao();

  const [etapa, setEtapa] = useState<Etapa>('nome');
  const [nome, setNome] = useState('');
  const [companheiro, setCompanheiro] = useState('');
  const [codigo, setCodigo] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [contaPronta, setContaPronta] = useState(false);

  // Quem já tem conta (onboarding interrompido) não passa de novo pela etapa de acesso.
  const logado = contaPronta || usuarioId !== null;

  // Segura a pessoa aqui: o código só aparece uma vez, depois que o Laço já existe.
  useEffect(() => {
    reter(true);
    return () => reter(false);
  }, [reter]);

  function editar(campo: Campo, valor: string, definir: (v: string) => void) {
    definir(valor);
    if (erros[campo]) setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    if (erroGeral) setErroGeral(undefined);
  }

  function continuarNome() {
    const erro = validarNome(nome);
    if (erro) return setErros({ nome: erro });
    setEtapa('companheiro');
  }

  function continuarCompanheiro() {
    const erro = validarNome(companheiro);
    if (erro) return setErros({ companheiro: erro });
    setEtapa('codigo');
  }

  async function continuarCodigo() {
    const erro = validarCodigo(codigo);
    if (erro) return setErros({ codigo: erro });
    setEnviando(true);
    setErroGeral(undefined);
    const r = await verificarCodigoDisponivel(codigo);
    if (!r.ok) {
      setEnviando(false);
      if (r.codigo === 'palavra_em_uso' || r.codigo === 'palavra_invalida') {
        setErros({ codigo: r.mensagem });
      } else {
        setErroGeral(r.mensagem);
      }
      return;
    }
    if (logado) {
      await concluir();
    } else {
      setEnviando(false);
      setEtapa('acesso');
    }
  }

  async function continuarAcesso() {
    const novos = {
      email: validarEmail(email),
      senha: validarSenha(senha),
      confirmacao: validarConfirmacao(senha, confirmacao),
    };
    if (novos.email || novos.senha || novos.confirmacao) return setErros(novos);
    await concluir();
  }

  async function concluir() {
    setEnviando(true);
    setErroGeral(undefined);

    if (!logado) {
      let conta = await cadastrar(email, senha);
      if (!conta.ok && conta.codigo === 'email_ja_cadastrado') {
        // E-mail já existe: tratar como entrada (ADR 017). Nunca cria um segundo Laço.
        const login = await entrar(email, senha);
        if (!login.ok) {
          setEnviando(false);
          setErroGeral(login.mensagem);
          return;
        }
        const existente = await buscarPerfil();
        if (existente.ok && existente.perfil) {
          await liberar();
          return;
        }
        conta = login;
      }
      if (!conta.ok) {
        setEnviando(false);
        setErroGeral(conta.mensagem);
        return;
      }
      setContaPronta(true);
    }

    const r = await criarLaco({ nome, nomeCompanheiro: companheiro, codigo });
    setEnviando(false);
    if (r.ok) {
      setEtapa('pronto');
    } else if (r.codigo === 'palavra_em_uso' || r.codigo === 'palavra_invalida') {
      // Outra pessoa tomou o código no intervalo: nada foi criado, volta à etapa do código.
      setErros({ codigo: r.mensagem });
      setEtapa('codigo');
    } else if (r.codigo === 'ja_tem_laco') {
      await liberar();
    } else {
      setErroGeral(r.mensagem);
    }
  }

  async function compartilhar() {
    await Share.share({
      message: `Vamos viver isso juntos? Entre no nosso Laço com este código do casal: ${codigo.trim()}`,
    });
  }

  const senhaAcao = {
    label: mostrarSenha ? 'Ocultar' : 'Mostrar',
    onPress: () => setMostrarSenha((atual) => !atual),
  };

  if (etapa === 'pronto') {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader
          eyebrow="Laço criado"
          title="O Laço de vocês começou."
          description={`Este é o código do casal. Guardem e passem para ${companheiro.trim()}: é com ele que a outra pessoa entra no Laço.`}
        />
        <View
          style={{
            gap: Spacing.three,
            paddingVertical: Spacing.four,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.border,
          }}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={{ letterSpacing: 1 }}>
            CÓDIGO DO CASAL
          </ThemedText>
          <ThemedText
            selectable
            style={{ fontFamily: FontFamily.display, fontSize: 30, lineHeight: 38 }}>
            {codigo.trim()}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Ele aparece só agora e não dá para recuperar depois.
          </ThemedText>
        </View>
        <View style={{ gap: Spacing.two, marginTop: Spacing.four }}>
          {/* A folha de compartilhamento do sistema já oferece "Copiar" (sem dependência extra). */}
          <Button label="Copiar ou compartilhar" variant="secondary" onPress={compartilhar} />
          <Button label="Entrar no Laço" loading={enviando} onPress={() => {
            setEnviando(true);
            liberar();
          }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      {etapa === 'nome' ? (
        <>
          <ScreenHeader eyebrow="Passo 1 de 4" title="Vamos começar pelo começo." description="Como podemos chamar você?" />
          <TextField
            label="Seu nome"
            value={nome}
            onChangeText={(v) => editar('nome', v, setNome)}
            error={erros.nome}
            autoFocus
            autoComplete="name"
            textContentType="givenName"
            maxLength={60}
            returnKeyType="next"
            onSubmitEditing={continuarNome}
          />
          <Acoes>
            <Button label="Continuar" onPress={continuarNome} />
            <Button label="Voltar" variant="text" onPress={() => router.back()} />
          </Acoes>
        </>
      ) : null}

      {etapa === 'companheiro' ? (
        <>
          <ScreenHeader eyebrow="Passo 2 de 4" title="E quem vai viver tudo isso com você?" />
          <TextField
            label="Nome da outra pessoa"
            value={companheiro}
            onChangeText={(v) => editar('companheiro', v, setCompanheiro)}
            error={erros.companheiro}
            autoFocus
            maxLength={60}
            returnKeyType="next"
            onSubmitEditing={continuarCompanheiro}
          />
          <Acoes>
            <Button label="Continuar" onPress={continuarCompanheiro} />
            <Button label="Voltar" variant="text" onPress={() => setEtapa('nome')} />
          </Acoes>
        </>
      ) : null}

      {etapa === 'codigo' ? (
        <>
          <ScreenHeader
            eyebrow="Passo 3 de 4"
            title="Escolham um código para o casal."
            description="Pode ser uma palavra, uma data, um apelido ou qualquer coisa que vocês dois saibam. Ele serve para a outra pessoa entrar no Laço."
          />
          <View style={{ gap: Spacing.three }}>
            <TextField
              label="Código do casal"
              value={codigo}
              onChangeText={(v) => editar('codigo', v, setCodigo)}
              error={erros.codigo}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={60}
              returnKeyType="next"
              onSubmitEditing={continuarCodigo}
            />
            {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
          </View>
          <Acoes>
            <Button label="Continuar" loading={enviando} onPress={continuarCodigo} />
            <Button label="Voltar" variant="text" disabled={enviando} onPress={() => setEtapa('companheiro')} />
          </Acoes>
        </>
      ) : null}

      {etapa === 'acesso' ? (
        <>
          <ScreenHeader
            eyebrow="Passo 4 de 4"
            title="Nosso Laço está quase pronto."
            description="Agora vamos criar seu acesso, para que você possa reencontrá-lo depois."
          />
          <View style={{ gap: Spacing.three }}>
            <TextField
              label="Seu e-mail"
              value={email}
              onChangeText={(v) => editar('email', v, setEmail)}
              error={erros.email}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="seuemail@email.com"
            />
            <TextField
              label="Crie uma senha"
              value={senha}
              onChangeText={(v) => editar('senha', v, setSenha)}
              error={erros.senha}
              action={senhaAcao}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <TextField
              label="Confirme sua senha"
              value={confirmacao}
              onChangeText={(v) => editar('confirmacao', v, setConfirmacao)}
              error={erros.confirmacao}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={continuarAcesso}
            />
            {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
          </View>
          <Acoes>
            <Button label="Criar acesso" loading={enviando} onPress={continuarAcesso} />
            <Button label="Voltar" variant="text" disabled={enviando} onPress={() => setEtapa('codigo')} />
          </Acoes>
        </>
      ) : null}
    </Screen>
  );
}

function Acoes({ children }: { children: React.ReactNode }) {
  return <View style={{ gap: Spacing.two, marginTop: Spacing.four }}>{children}</View>;
}
