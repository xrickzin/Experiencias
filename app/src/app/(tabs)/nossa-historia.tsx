import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LinhaDaExperiencia } from '@/components/linha-da-experiencia';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useTheme } from '@/hooks/use-theme';
import { chaveDeOrdem } from '@/services/referencia-temporal';

/**
 * As experiências que viraram Memória, da mais recente para a mais antiga (pela referência temporal).
 * ponytail: lista simples; o agrupamento por mês/ano e a foto de destaque entram na Fase 6.
 */
export default function NossaHistoria() {
  const theme = useTheme();
  const { experiencias, carregando, erro, recarregar } = useExperiencias();
  const memorias = experiencias
    .filter((e) => e.estado === 'memoria')
    .sort((a, b) => (chaveDeOrdem(b.referencia) ?? '').localeCompare(chaveDeOrdem(a.referencia) ?? ''));

  useFocusEffect(
    useCallback(() => {
      void recarregar();
    }, [recarregar])
  );

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Nossa História"
        title="O álbum de vocês"
        description="As experiências que viraram memória."
      />
      {carregando ? (
        <ThemedText themeColor="textSecondary" accessibilityLiveRegion="polite">
          Carregando…
        </ThemedText>
      ) : erro && memorias.length === 0 ? (
        <EmptyState
          title="Não foi possível carregar"
          description={erro}
          actionLabel="Tentar de novo"
          onAction={() => {
            void recarregar();
          }}
        />
      ) : memorias.length === 0 ? (
        <EmptyState
          title="Ainda não há memórias"
          description="Quando uma experiência for vivida e finalizada, ela passa a morar aqui, como as páginas de um álbum que vocês montam juntos."
          actionLabel="Registrar uma memória"
          onAction={() => router.push('/criar?tipo=memoria')}
        />
      ) : (
        <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
          {memorias.map((m) => (
            <LinhaDaExperiencia key={m.id} experiencia={m} />
          ))}
        </View>
      )}
    </Screen>
  );
}
