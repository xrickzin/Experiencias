import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Experiencia } from '@/services/experiencias';
import { descreverReferencia } from '@/services/referencia-temporal';

type LinhaDaExperienciaProps = {
  experiencia: Experiencia;
  /** Destaque de Início (Vivendo agora): título maior e convite para continuar. */
  destaque?: boolean;
};

/** Item de lista editorial: título, quando e onde. Abre a experiência. Sem cartão, só filete. */
export function LinhaDaExperiencia({ experiencia, destaque = false }: LinhaDaExperienciaProps) {
  const theme = useTheme();
  const quando = descreverReferencia(experiencia.referencia);
  const detalhes = [quando, experiencia.local].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detalhes ? `${experiencia.titulo}, ${detalhes}` : experiencia.titulo}
      onPress={() => router.push({ pathname: '/experiencia/[id]', params: { id: experiencia.id } })}
      style={({ pressed }) => ({
        minHeight: 64,
        justifyContent: 'center',
        gap: Spacing.half,
        paddingVertical: Spacing.three,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
      })}>
      <ThemedText
        type="subtitle"
        style={destaque ? { fontSize: 26, lineHeight: 34 } : { fontSize: 22, lineHeight: 30 }}>
        {experiencia.titulo}
      </ThemedText>
      {detalhes ? (
        <ThemedText type="small" themeColor="textSecondary">
          {detalhes}
        </ThemedText>
      ) : null}
      {destaque ? (
        <View style={{ marginTop: Spacing.one }}>
          <ThemedText type="smallBold">Continuar experiência →</ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}
