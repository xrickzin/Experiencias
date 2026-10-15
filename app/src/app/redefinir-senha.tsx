import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { MensagemErro } from '@/components/mensagem-erro';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { Spacing } from '@/constants/theme';
import { useSessao } from '@/hooks/use-sessao';
import { abrirSessaoDeRecuperacao, definirNovaSenha } from '@/services/laco';
import { interpretarLinkDeRecuperacao } from '@/services/link-recuperacao';
import { validarConfirmacao, validarSenha } from '@/services/validacao';

type ResultadoDaTroca = 'pendente' | 'ok' | 'invalido' | 'rede';

/**
 * Destino do link do e-mail de recuperação (laco://redefinir-senha). Fica fora dos grupos
 * protegidos da navegação: a pessoa chega aqui com ou sem sessão.
 */
export default function RedefinirSenha() {
  const parametros = useLocalSearchParams();
  const { estado, usuarioId, acessoLiberado, reter, liberar, sair } = useSessao();

  const link = interpretarLinkDeRecuperacao(parametros);
  const codigo = link.tipo === 'codigo' ? link.codigo : null;
  const flowId = link.tipo === 'codigo' ? link.flowId : undefined;

  const [troca, setTroca] = useState<ResultadoDaTroca>('pendente');
  const [tentativa, setTentativa] = useState(0);
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<{ senha?: string; confirmacao?: string }>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [linkPerdido, setLinkPerdido] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const jaTrocado = useRef<string | null>(null);

  // A sessão de recuperação não deve levar a pessoa à área principal antes de a senha ser definida.
  // Só vale quando há um código de recuperação; sem ele, esta tela não segura ninguém.
  useEffect(() => {
    if (!codigo) return;
    reter(true);
    return () => reter(false);
  }, [codigo, reter]);

  // Troca o código de uso único por uma sessão: uma vez por código e por tentativa. O resultado
  // chega mesmo que a tela seja remontada; repetir a troca com o mesmo código a invalidaria.
  useEffect(() => {
    if (!codigo) return;
    const chave = `${codigo}:${tentativa}`;
    if (jaTrocado.current === chave) return;
    jaTrocado.current = chave;
    abrirSessaoDeRecuperacao(codigo, flowId).then((r) => {
      setTroca(r.ok ? 'ok' : r.codigo === 'rede' ? 'rede' : 'invalido');
    });
  }, [codigo, flowId, tentativa]);

  // Depois de "Continuar": segue para o estado da sessão já atualizado.
  useEffect(() => {
    if (!saindo || estado === 'carregando') return;
    router.replace(acessoLiberado ? '/' : '/entrada');
  }, [saindo, estado, acessoLiberado]);

  const invalido = link.tipo === 'invalido' || troca === 'invalido' || linkPerdido;
  const motivoExpirado = link.tipo === 'invalido' && link.motivo === 'expirado';

  async function salvar() {
    const novos = {
      senha: validarSenha(senha),
      confirmacao: validarConfirmacao(senha, confirmacao),
    };
    if (novos.senha || novos.confirmacao) return setErros(novos);
    setEnviando(true);
    setErroGeral(undefined);
    const r = await definirNovaSenha(senha);
    setEnviando(false);
    if (r.ok) {
      setSenha('');
      setConfirmacao('');
      setConcluido(true);
    } else if (r.codigo === 'link_invalido') {
      setLinkPerdido(true);
    } else {
      setErroGeral(r.mensagem);
    }
  }

  async function continuar() {
    setSaindo(false);
    setEnviando(true);
    await liberar();
    setEnviando(false);
    setSaindo(true);
  }

  async function cancelar() {
    setEnviando(true);
    if (troca === 'ok') {
      // Descarta a sessão de recuperação aberta aqui: sem nova senha, ela não vira um acesso comum.
      await sair();
      router.replace('/entrada');
    } else {
      // Nenhuma sessão foi aberta por esta tela: não encerra a de quem já estava dentro.
      router.replace('/');
    }
  }

  async function pedirOutroLink() {
    setEnviando(true);
    if (usuarioId) await sair();
    router.replace('/entrada/esqueci-senha');
  }

  if (concluido) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader
          eyebrow="Recuperar acesso"
          title="Senha atualizada."
          description="Use a nova senha nas próximas vezes que entrar. O seu Laço continua exatamente como estava."
        />
        <Button label="Continuar" loading={enviando} onPress={continuar} />
      </Screen>
    );
  }

  if (invalido) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader
          eyebrow="Recuperar acesso"
          title="Esse link não vale mais."
          description={
            motivoExpirado
              ? 'Ele expirou ou já foi usado. Peça um novo link para criar a senha.'
              : 'Ele pode ter sido aberto em outro aparelho, estar incompleto ou ter expirado. Peça um novo link.'
          }
        />
        <View style={{ gap: Spacing.two }}>
          <Button label="Pedir outro link" loading={enviando} onPress={pedirOutroLink} />
          <Button label="Voltar para a entrada" variant="text" disabled={enviando} onPress={cancelar} />
        </View>
      </Screen>
    );
  }

  if (troca === 'rede') {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader
          eyebrow="Recuperar acesso"
          title="Não foi possível conectar."
          description="Verifique sua internet e tente de novo. O link continua valendo."
        />
        <View style={{ gap: Spacing.two }}>
          <Button
            label="Tentar de novo"
            onPress={() => {
              setTroca('pendente');
              setTentativa((atual) => atual + 1);
            }}
          />
          <Button label="Voltar para a entrada" variant="text" onPress={cancelar} />
        </View>
      </Screen>
    );
  }

  if (troca !== 'ok') {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader eyebrow="Recuperar acesso" title="Verificando o link…" />
      </Screen>
    );
  }

  const acaoSenha = {
    label: mostrarSenha ? 'Ocultar' : 'Mostrar',
    onPress: () => setMostrarSenha((atual) => !atual),
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader
        eyebrow="Recuperar acesso"
        title="Escolha uma nova senha."
        description="Depois disso, você volta ao seu Laço."
      />
      <View style={{ gap: Spacing.three }}>
        <TextField
          label="Nova senha"
          value={senha}
          onChangeText={(v) => {
            setSenha(v);
            if (erros.senha) setErros((atuais) => ({ ...atuais, senha: undefined }));
            if (erroGeral) setErroGeral(undefined);
          }}
          error={erros.senha}
          action={acaoSenha}
          secureTextEntry={!mostrarSenha}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TextField
          label="Confirme a nova senha"
          value={confirmacao}
          onChangeText={(v) => {
            setConfirmacao(v);
            if (erros.confirmacao) setErros((atuais) => ({ ...atuais, confirmacao: undefined }));
            if (erroGeral) setErroGeral(undefined);
          }}
          error={erros.confirmacao}
          secureTextEntry={!mostrarSenha}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={salvar}
        />
        {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
      </View>
      <View style={{ gap: Spacing.two, marginTop: Spacing.four }}>
        <Button label="Salvar nova senha" loading={enviando} onPress={salvar} />
        <Button label="Cancelar" variant="text" disabled={enviando} onPress={cancelar} />
      </View>
    </Screen>
  );
}
