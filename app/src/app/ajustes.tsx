import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/button';
import { MensagemErro } from '@/components/mensagem-erro';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useSessao } from '@/hooks/use-sessao';
import { atualizarMeuNome } from '@/services/laco';
import { validarNome } from '@/services/validacao';

export default function Ajustes() {
  const { perfil, atualizar, sair } = useSessao();
  const [nome, setNome] = useState(perfil?.nome ?? '');
  const [erro, setErro] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);

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

  function confirmarSaida() {
    Alert.alert('Sair da conta?', 'Você volta para a tela de entrada. O Laço continua guardado.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', onPress: () => sair() },
    ]);
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader eyebrow="Ajustes" title="Seu nome no Laço" description="É assim que você aparece para a outra pessoa." />

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
        {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
        {salvo ? (
          <ThemedText type="small" accessibilityLiveRegion="polite">
            Nome atualizado.
          </ThemedText>
        ) : null}
      </View>

      <View style={{ gap: Spacing.two, marginTop: Spacing.four }}>
        <Button label="Salvar nome" loading={enviando} onPress={salvar} />
        <Button label="Sair da conta" variant="secondary" disabled={enviando} onPress={confirmarSaida} />
        <Button label="Fechar" variant="text" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
