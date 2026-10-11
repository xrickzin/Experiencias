import { router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';

export default function Criar() {
  const { adicionarDesejo } = useExperiencias();
  const [titulo, setTitulo] = useState('');
  const [erro, setErro] = useState<string>();

  function enviar() {
    const limpo = titulo.trim();
    if (!limpo) {
      setErro('Escreva um título para continuar.');
      return;
    }
    adicionarDesejo(limpo);
    AccessibilityInfo.announceForAccessibility('Desejo adicionado');
    router.replace('/desejos');
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader
        eyebrow="Nova experiência"
        title="O que vocês querem viver?"
        description="Comecem pelo título. Data, local e planejamento ficam para depois."
      />

      <View style={{ gap: Spacing.four }}>
        <TextField
          label="Título"
          placeholder="Ex.: Ver o nascer do sol juntos"
          value={titulo}
          onChangeText={(texto) => {
            setTitulo(texto);
            if (erro) setErro(undefined);
          }}
          error={erro}
          maxLength={120}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={enviar}
        />
        <View style={{ gap: Spacing.two }}>
          <Button label="Adicionar desejo" onPress={enviar} />
          <Button label="Cancelar" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
