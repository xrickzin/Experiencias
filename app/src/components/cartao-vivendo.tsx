import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUrlAssinada } from '@/hooks/use-url-assinada';
import type { Experiencia } from '@/services/experiencias';
import { descreverReferencia } from '@/services/referencia-temporal';

/**
 * Destaque de "Vivendo agora" no Início: a foto de destaque grande, título, quando e onde.
 * Sem foto de destaque (ou enquanto ela carrega), um substituto em papel com o fio, nunca vazio.
 */
export function CartaoVivendo({ experiencia }: { experiencia: Experiencia }) {
  const theme = useTheme();
  const url = useUrlAssinada(experiencia.fotoDestaque?.caminho ?? null);
  const quando = descreverReferencia(experiencia.referencia);
  const detalhes = [quando, experiencia.local].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${experiencia.titulo}${detalhes ? `, ${detalhes}` : ''}. Continuar experiência`}
      onPress={() => router.push({ pathname: '/experiencia/[id]', params: { id: experiencia.id } })}
      style={({ pressed }) => ({
        borderRadius: Radius.button,
        overflow: 'hidden',
        backgroundColor: theme.backgroundElement,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: Spacing.three,
        opacity: pressed ? 0.85 : 1,
      })}>
      <View style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: theme.backgroundSelected }}>
        {url ? (
          <Image
            testID="cartao-vivendo-foto"
            source={{ uri: url, cacheKey: `capa:${experiencia.fotoDestaque?.caminho}` }}
            contentFit="cover"
            style={{ flex: 1 }}
            transition={200}
            accessibilityLabel={`Foto de destaque de ${experiencia.titulo}`}
          />
        ) : (
          <View
            testID="cartao-vivendo-substituto"
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four }}>
            <View
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={{ width: 48, height: 2, backgroundColor: theme.accent }}
            />
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              {experiencia.fotoDestaque ? 'Carregando a foto…' : 'Escolham uma foto de destaque para este momento.'}
            </ThemedText>
          </View>
        )}
      </View>
      <View style={{ padding: Spacing.three, gap: Spacing.one }}>
        <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 34 }}>
          {experiencia.titulo}
        </ThemedText>
        {detalhes ? (
          <ThemedText type="small" themeColor="textSecondary">
            {detalhes}
          </ThemedText>
        ) : null}
        <ThemedText type="smallBold" style={{ marginTop: Spacing.one }}>
          Continuar experiência →
        </ThemedText>
      </View>
    </Pressable>
  );
}
