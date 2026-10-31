import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  testID?: string;
  visivel: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
};

/**
 * Uma escolha rápida que sobe de baixo sobre a tela escurecida (o "+", as ações de uma foto).
 * Tocar fora ou no voltar fecha. O modal desenha por baixo da barra do Android: a folha sobe acima dela.
 */
export function FolhaDeEscolha({ testID, visivel, titulo, onFechar, children }: Props) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <Modal
      testID={testID}
      visible={visivel}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onFechar}>
      <View
        accessibilityViewIsModal
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          padding: Spacing.four,
          paddingBottom: Spacing.four + bottom,
          backgroundColor: theme.scrim,
        }}>
        <Pressable
          accessibilityLabel="Fechar"
          accessibilityRole="button"
          onPress={onFechar}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            alignSelf: 'center',
            gap: Spacing.two,
            padding: Spacing.four,
            borderRadius: Radius.button,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
          <ThemedText type="subtitle" style={{ fontSize: 24, lineHeight: 32 }} accessibilityRole="header">
            {titulo}
          </ThemedText>
          <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}
