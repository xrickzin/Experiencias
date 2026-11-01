import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Moldura } from '@/components/moldura';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUrlAssinada } from '@/hooks/use-url-assinada';
import type { Experiencia } from '@/services/experiencias';
import { descreverReferencia } from '@/services/referencia-temporal';

/**
 * Destaque de "Vivendo agora" no Início: a foto de destaque colada no papel do álbum (a mesma
 * moldura de Nossa História), com título, quando e onde escritos no pé. Sem foto de destaque (ou
 * enquanto ela carrega), o fio no lugar, nunca vazio.
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
      // Apertar afunda o cartão de leve, como quem pega a foto.
      style={({ pressed }) => ({ marginBottom: Spacing.three, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <Moldura>
        <View style={{ width: '100%', aspectRatio: 4 / 3, overflow: 'hidden', backgroundColor: theme.backgroundSelected }}>
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
        <View style={{ paddingTop: Spacing.three, paddingBottom: Spacing.one, gap: Spacing.one }}>
          <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 34 }}>
            {experiencia.titulo}
          </ThemedText>
          {detalhes ? (
            <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz }}>
              {detalhes}
            </ThemedText>
          ) : null}
          <ThemedText type="smallBold" style={{ marginTop: Spacing.one, color: theme.accentStrong }}>
            Continuar experiência →
          </ThemedText>
        </View>
      </Moldura>
    </Pressable>
  );
}
