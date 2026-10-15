import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';

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
  const { desejos, carregando, erro, recarregar } = useExperiencias();

  // A outra pessoa pode ter criado, editado ou excluído desde a última vez: relê ao voltar para a aba.
  useFocusEffect(
    useCallback(() => {
      void recarregar();
    }, [recarregar])
  );

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Desejos"
        title="O que queremos viver"
        description="Coisas que ainda queremos viver juntos."
      />

      {carregando ? (
        <ThemedText themeColor="textSecondary" accessibilityLiveRegion="polite">
          Carregando…
        </ThemedText>
      ) : erro && desejos.length === 0 ? (
        <EmptyState
          title="Não foi possível carregar"
          description={erro}
          actionLabel="Tentar de novo"
          onAction={() => {
            void recarregar();
          }}
        />
      ) : desejos.length === 0 ? (
        <EmptyState
          title="Nenhum desejo ainda"
          description="Aqui ficam as experiências que vocês querem viver. Comecem pela primeira."
          actionLabel="Adicionar o primeiro desejo"
          onAction={() => router.push('/criar')}
        />
      ) : (
        <View style={{ gap: Spacing.four }}>
          <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
            {desejos.map((desejo) => (
              <Pressable
                key={desejo.id}
                accessibilityRole="button"
                accessibilityLabel={desejo.local ? `${desejo.titulo}, ${desejo.local}` : desejo.titulo}
                onPress={() => router.push({ pathname: '/desejo/[id]', params: { id: desejo.id } })}
                style={({ pressed }) => ({
                  minHeight: 64,
                  justifyContent: 'center',
                  gap: Spacing.half,
                  paddingVertical: Spacing.three,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                  backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
                })}>
                <ThemedText type="subtitle" style={{ fontSize: 22, lineHeight: 30 }}>
                  {desejo.titulo}
                </ThemedText>
                {desejo.local ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {desejo.local}
                  </ThemedText>
                ) : null}
              </Pressable>
            ))}
          </View>
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
