import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { MensagemErro } from '@/components/mensagem-erro';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { VinculoConfirmado } from '@/components/vinculo-confirmado';
import { Spacing } from '@/constants/theme';
import { useSessao } from '@/hooks/use-sessao';
import {
  buscarPerfil,
  cadastrar,
  consultarEmail,
  entrar,
  verificarCodigoDeVinculo,
  vincularLaco,
  type Perfil,
} from '@/services/laco';
import {
  validarCodigo,
  validarConfirmacao,
  validarEmail,
  validarSenha,
} from '@/services/validacao';

type Etapa = 'email' | 'senha' | 'codigo' | 'nova-senha' | 'vinculado';
type Campo = 'email' | 'senha' | 'codigo' | 'confirmacao';

export default function Entrar() {
  const { usuarioId, reter, liberar } = useSessao();
  // Conta existente sem Laço: não pede e-mail nem senha de novo, só o código do casal.
  const [contaPronta, setContaPronta] = useState(false);
  const logado = contaPronta || usuarioId !== null;

  const [etapa, setEtapa] = useState<Etapa>(usuarioId !== null ? 'codigo' : 'email');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [codigo, setCodigo] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  // Entrar com um e-mail novo termina numa confirmação; até lá a pessoa fica nesta tela.
  useEffect(() => () => reter(false), [reter]);

  function editar(campo: Campo, valor: string, definir: (v: string) => void) {
    definir(valor);
    if (erros[campo]) setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    if (erroGeral) setErroGeral(undefined);
  }

  async function continuarEmail() {
    const erro = validarEmail(email);
    if (erro) return setErros({ email: erro });
    setEnviando(true);
    setErroGeral(undefined);
    const r = await consultarEmail(email);
    setEnviando(false);
    if (!r.ok) return setErroGeral(r.mensagem);
    setEtapa(r.existe ? 'senha' : 'codigo');
  }

  async function entrarComSenha() {
    if (!senha) return setErros({ senha: 'Escreva sua senha para continuar.' });
    setEnviando(true);
    setErroGeral(undefined);
    const r = await entrar(email, senha);
    if (!r.ok) {
      setEnviando(false);
      return setErroGeral(r.mensagem);
    }
    const p = await buscarPerfil();
    if (p.ok && p.perfil) {
      // Já tem Laço: a sessão libera a área principal. O código não é pedido de novo.
      await liberar();
    } else {
      setEnviando(false);
      router.replace('/entrada/continuar');
    }
  }

  async function continuarCodigo() {
    const erro = validarCodigo(codigo);
    if (erro) return setErros({ codigo: erro });
    setEnviando(true);
    setErroGeral(undefined);
    if (logado) {
      await vincular();
      return;
    }
    const r = await verificarCodigoDeVinculo(codigo);
    setEnviando(false);
    if (!r.ok) return setErroGeral(r.mensagem);
    setEtapa('nova-senha');
  }

  async function continuarNovaSenha() {
    const novos = {
      senha: validarSenha(senha),
      confirmacao: validarConfirmacao(senha, confirmacao),
    };
    if (novos.senha || novos.confirmacao) return setErros(novos);
    setEnviando(true);
    setErroGeral(undefined);
    const conta = await cadastrar(email, senha);
    if (!conta.ok) {
      setEnviando(false);
      return setErroGeral(conta.mensagem);
    }
    setContaPronta(true);
    await vincular();
  }

  async function vincular() {
    // Segura a pessoa aqui até a confirmação, mesmo com o Laço já existindo.
    reter(true);
    const r = await vincularLaco(codigo);
    if (!r.ok) {
      reter(false);
      setEnviando(false);
      setErroGeral(r.mensagem);
      // A conta existe, mas o vínculo falhou: volta ao código para tentar de novo.
      setEtapa('codigo');
      return;
    }
    const p = await buscarPerfil();
    setPerfil(p.ok ? p.perfil : null);
    setEnviando(false);
    setEtapa('vinculado');
  }

  const senhaAcao = {
    label: mostrarSenha ? 'Ocultar' : 'Mostrar',
    onPress: () => setMostrarSenha((atual) => !atual),
  };

  return (
    <Screen edges={['top', 'bottom']}>
      {etapa === 'email' ? (
        <>
          <ScreenHeader eyebrow="Entrar" title="Qual é o seu e-mail?" />
          <View style={{ gap: Spacing.three }}>
            <TextField
              label="E-mail"
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
              returnKeyType="next"
              onSubmitEditing={continuarEmail}
            />
            {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
          </View>
          <Acoes>
            <Button label="Continuar" loading={enviando} onPress={continuarEmail} />
            <Button label="Voltar" variant="text" disabled={enviando} onPress={() => router.back()} />
          </Acoes>
        </>
      ) : null}

      {etapa === 'senha' ? (
        <>
          <ScreenHeader eyebrow="Entrar" title="Vamos reencontrar vocês." description={email.trim()} />
          <View style={{ gap: Spacing.three }}>
            <TextField
              label="Senha"
              value={senha}
              onChangeText={(v) => editar('senha', v, setSenha)}
              error={erros.senha}
              action={senhaAcao}
              secureTextEntry={!mostrarSenha}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={entrarComSenha}
            />
            {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
          </View>
          <Acoes>
            <Button label="Entrar" loading={enviando} onPress={entrarComSenha} />
            <Button
              label="Esqueci minha senha"
              variant="text"
              disabled={enviando}
              onPress={() =>
                router.push({ pathname: '/entrada/esqueci-senha', params: { email: email.trim() } })
              }
            />
            <Button
              label="Voltar"
              variant="text"
              disabled={enviando}
              onPress={() => {
                setSenha('');
                setErroGeral(undefined);
                setEtapa('email');
              }}
            />
          </Acoes>
        </>
      ) : null}

      {etapa === 'codigo' ? (
        <>
          <ScreenHeader
            eyebrow="Entrar"
            title="Qual é o código do casal?"
            description="Foi a outra pessoa que criou o Laço quem escolheu esse código."
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
            <Button
              label="Voltar"
              variant="text"
              disabled={enviando}
              onPress={() => (logado ? router.back() : setEtapa('email'))}
            />
          </Acoes>
        </>
      ) : null}

      {etapa === 'nova-senha' ? (
        <>
          <ScreenHeader
            eyebrow="Entrar"
            title="Agora, crie sua senha."
            description="Com ela você reencontra o Laço em qualquer aparelho."
          />
          <View style={{ gap: Spacing.three }}>
            <TextField
              label="Crie uma senha"
              value={senha}
              onChangeText={(v) => editar('senha', v, setSenha)}
              error={erros.senha}
              action={senhaAcao}
              secureTextEntry={!mostrarSenha}
              autoFocus
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
              onSubmitEditing={continuarNovaSenha}
            />
            {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
          </View>
          <Acoes>
            <Button label="Entrar no Laço" loading={enviando} onPress={continuarNovaSenha} />
            <Button label="Voltar" variant="text" disabled={enviando} onPress={() => setEtapa('codigo')} />
          </Acoes>
        </>
      ) : null}

      {etapa === 'vinculado' ? (
        <VinculoConfirmado
          perfil={perfil}
          loading={enviando}
          onContinuar={() => {
            setEnviando(true);
            liberar();
          }}
        />
      ) : null}
    </Screen>
  );
}

function Acoes({ children }: { children: React.ReactNode }) {
  return <View style={{ gap: Spacing.two, marginTop: Spacing.four }}>{children}</View>;
}
