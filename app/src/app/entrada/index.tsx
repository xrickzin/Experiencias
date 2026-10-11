import { Redirect, router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useSessao } from '@/hooks/use-sessao';

export default function Entrada() {
  const { estado } = useSessao();

  // Conta existente sem Laço (onboarding interrompido): conduz a criar ou vincular.
  if (estado === 'sem-laco') {
    return <Redirect href="/entrada/continuar" />;
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader
        eyebrow="Laço"
        title="Um lugar para viver, guardar e contar a história de vocês."
      />
      <ThemedText type="subtitle" style={{ fontSize: 22, lineHeight: 30, marginBottom: Spacing.three }}>
        O que traz você até aqui?
      </ThemedText>
      <View style={{ gap: Spacing.two }}>
        <Button label="Quero começar nosso Laço" onPress={() => router.push('/entrada/criar-laco')} />
        <Button
          label="Quero entrar no nosso Laço"
          variant="secondary"
          onPress={() => router.push('/entrada/entrar')}
        />
      </View>
    </Screen>
  );
}
