import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Spacing } from '@/constants/theme';
import { useSessao } from '@/hooks/use-sessao';

/** Conta já criada, mas ainda sem Laço: o código do casal é pedido (um Laço por identidade). */
export default function Continuar() {
  const { sair } = useSessao();

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader
        eyebrow="Quase lá"
        title="Falta só o Laço."
        description="Sua conta está pronta. Comecem um Laço novo ou entrem em um que já existe."
      />
      <View style={{ gap: Spacing.two }}>
        <Button label="Quero começar nosso Laço" onPress={() => router.push('/entrada/criar-laco')} />
        <Button
          label="Tenho o código do casal"
          variant="secondary"
          onPress={() => router.push('/entrada/entrar')}
        />
        <Button label="Sair da conta" variant="text" onPress={sair} />
      </View>
    </Screen>
  );
}
