import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useTheme } from '@/hooks/use-theme';

export default function Desejos() {
  const theme = useTheme();
  const { desejos } = useExperiencias();

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Desejos"
        title="O que queremos viver"
        description="Coisas que ainda queremos viver juntos."
      />

      {desejos.length === 0 ? (
        <EmptyState
          title="Nenhum desejo ainda"
          description="Aqui ficam as experiências que vocês querem viver. Comecem pela primeira: um título basta."
          actionLabel="Adicionar o primeiro desejo"
          onAction={() => router.push('/criar')}
        />
      ) : (
        <View style={{ gap: Spacing.four }}>
          <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
            {desejos.map((desejo) => (
              <View
                key={desejo.id}
                style={{
                  paddingVertical: Spacing.three,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                }}>
                <ThemedText type="subtitle" style={{ fontSize: 22, lineHeight: 30 }}>
                  {desejo.titulo}
                </ThemedText>
              </View>
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Por enquanto os desejos ficam só neste aparelho e somem ao fechar o app. Guardá-los no
            Laço vem na próxima entrega.
          </ThemedText>
          <Button
            label="Adicionar desejo"
            variant="secondary"
            onPress={() => router.push('/criar')}
          />
        </View>
      )}
    </Screen>
  );
}
