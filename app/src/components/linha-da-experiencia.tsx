import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Experiencia } from '@/services/experiencias';
import { descreverReferencia } from '@/services/referencia-temporal';

type LinhaDaExperienciaProps = {
  experiencia: Experiencia;
  /** Destaque de Início (Vivendo agora): título maior e convite para continuar. */
  destaque?: boolean;
  /**
   * Nossa História: URL assinada da foto de destaque (nula enquanto carrega). Só aparece quando a
   * experiência tem destaque; sem ele, fica a composição tipográfica.
   */
  fotoDestaqueUrl?: string | null;
};

/** Item de lista editorial: título, quando e onde. Abre a experiência. Sem cartão, só filete. */
export function LinhaDaExperiencia({ experiencia, destaque = false, fotoDestaqueUrl }: LinhaDaExperienciaProps) {
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
      {fotoDestaqueUrl !== undefined && experiencia.fotoDestaque ? (
        // O espaço da foto existe desde o início, para a lista não pular quando ela carregar.
        <View
          style={{
            width: '100%',
            aspectRatio: 3 / 2,
            borderRadius: Radius.button,
            overflow: 'hidden',
            backgroundColor: theme.backgroundSelected,
            marginBottom: Spacing.two,
          }}>
          {fotoDestaqueUrl ? (
            <Image
              testID="historia-foto"
              source={{ uri: fotoDestaqueUrl }}
              contentFit="cover"
              style={{ flex: 1 }}
              transition={200}
              accessible={false}
            />
          ) : null}
        </View>
      ) : null}
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
