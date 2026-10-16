import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Confirmacao } from '@/components/confirmacao';
import { GerenciarCategorias } from '@/components/gerenciar-categorias';
import { MensagemErro } from '@/components/mensagem-erro';
import { Opcoes } from '@/components/opcoes';
import { Screen } from '@/components/screen';
import { ScreenHeader, voltar } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useSessao } from '@/hooks/use-sessao';
import { useTheme } from '@/hooks/use-theme';
import { atualizarMeuNome } from '@/services/laco';
import { escolherTema, lerPreferenciaDeTema, type PreferenciaDeTema } from '@/services/tema';
import { validarNome } from '@/services/validacao';

export default function Ajustes() {
  const theme = useTheme();
  const { perfil, atualizar, sair, acessoLiberado } = useSessao();
  const [nome, setNome] = useState(perfil?.nome ?? '');
  const [erro, setErro] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [tema, setTema] = useState<PreferenciaDeTema>('automatico');

  useEffect(() => {
    void lerPreferenciaDeTema().then(setTema);
  }, []);

  // Depois de encerrar a sessão, leva à entrada de forma explícita: a troca automática de telas
  // da navegação não basta com este modal aberto sobre as abas.
  useEffect(() => {
    if (saindo && !acessoLiberado) router.replace('/entrada');
  }, [saindo, acessoLiberado]);

  // Se a saída não terminar, a tela volta a responder e avisa, em vez de ficar parada.
  useEffect(() => {
    if (!saindo) return;
    const tempo = setTimeout(() => {
      setSaindo(false);
      setEnviando(false);
      setErroGeral('Não foi possível sair agora. Tente de novo.');
    }, 12000);
    return () => clearTimeout(tempo);
  }, [saindo]);

  async function salvar() {
    const invalido = validarNome(nome);
    if (invalido) return setErro(invalido);
    if (!perfil) return;
    setEnviando(true);
    setErroGeral(undefined);
    const r = await atualizarMeuNome(perfil.membro_id, nome);
    if (r.ok) {
      await atualizar();
      setSalvo(true);
    } else {
      setErroGeral(r.mensagem);
    }
    setEnviando(false);
  }

  async function sairDaConta() {
    setEnviando(true);
    setErroGeral(undefined);
    setSaindo(true);
    await sair();
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader
        eyebrow="Ajustes"
        title="Seu nome no Laço"
        description="É assim que você aparece para a outra pessoa."
        onBack={saindo ? undefined : voltar}
      />

      <View style={{ gap: Spacing.three }}>
        <TextField
          label="Seu nome"
          value={nome}
          onChangeText={(v) => {
            setNome(v);
            setSalvo(false);
            setErro(undefined);
            setErroGeral(undefined);
          }}
          error={erro}
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={salvar}
        />
        {erroGeral && !confirmandoSaida ? <MensagemErro>{erroGeral}</MensagemErro> : null}
        {salvo ? (
          <ThemedText type="small" accessibilityLiveRegion="polite">
            Nome atualizado.
          </ThemedText>
        ) : null}
      </View>

      <View style={{ gap: Spacing.two, marginTop: Spacing.four }}>
        <Button label="Salvar nome" loading={enviando && !saindo} disabled={saindo} onPress={salvar} />
      </View>

      {/* Aparência: vale só neste aparelho; cada pessoa escolhe a sua (ADR 037). */}
      <View style={{ gap: Spacing.two, marginTop: Spacing.five, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: Spacing.four }}>
        <ThemedText type="subtitle" accessibilityRole="header" style={{ fontSize: 22, lineHeight: 30 }}>
          Aparência
        </ThemedText>
        <Opcoes<PreferenciaDeTema>
          rotulo="Tema"
          opcoes={[
            { valor: 'automatico', rotulo: 'Automático' },
            { valor: 'claro', rotulo: 'Claro' },
            { valor: 'escuro', rotulo: 'Escuro' },
          ]}
          atual={tema}
          onChange={(escolhido) => {
            setTema(escolhido);
            void escolherTema(escolhido);
          }}
        />
        <ThemedText type="small" themeColor="textSecondary">
          No automático, o Laço segue o tema do celular: fica claro ou escuro conforme o que estiver
          escolhido no sistema. A escolha vale só para este aparelho.
        </ThemedText>
      </View>

      <View style={{ marginTop: Spacing.five, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: Spacing.four }}>
        <GerenciarCategorias />
      </View>

      <View style={{ gap: Spacing.two, marginTop: Spacing.five }}>
        <Button
          label="Sair da conta"
          variant="destructive"
          disabled={enviando}
          onPress={() => {
            setErroGeral(undefined);
            setConfirmandoSaida(true);
          }}
        />
      </View>

      <Confirmacao
        visible={confirmandoSaida}
        title="Sair da conta?"
        description="Você volta para a tela de entrada. O Laço de vocês continua guardado e você entra de novo com o seu e-mail e a sua senha."
        confirmLabel="Sim, sair da conta"
        loading={saindo}
        error={erroGeral}
        onConfirm={sairDaConta}
        onCancel={() => setConfirmandoSaida(false)}
      />
    </Screen>
  );
}
