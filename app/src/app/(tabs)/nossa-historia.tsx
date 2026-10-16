import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LinhaDaExperiencia } from '@/components/linha-da-experiencia';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { useExperiencias } from '@/hooks/use-experiencias';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Experiencia } from '@/services/experiencias';
import { assinarCaminhos } from '@/services/fotos';
import { agruparPorMes } from '@/services/nossa-historia';

/**
 * O álbum do casal: as memórias agrupadas pelo mês de início, do mês mais recente ao mais antigo,
 * com a foto de destaque quando existir. Um fio sutil na lateral liga os meses (ux/our-story.md).
 */
export default function NossaHistoria() {
  const theme = useTheme();
  const { experiencias, carregando, erro, recarregar } = useExperiencias();
  const memorias = experiencias.filter((e) => e.estado === 'memoria');
  const meses = agruparPorMes(memorias);

  // As fotos de destaque de todas as memórias, numa só chamada ao Storage.
  const caminhos = memorias.flatMap((m) => (m.fotoDestaque ? [m.fotoDestaque.caminho] : []));
  const chaveDosCaminhos = caminhos.join('|');
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    if (!chaveDosCaminhos) return;
    let ativo = true;
    void assinarCaminhos(chaveDosCaminhos.split('|')).then((novas) => {
      if (ativo) setUrls(novas);
    });
    return () => {
      ativo = false;
    };
  }, [chaveDosCaminhos]);

  const item = (m: Experiencia, semQuando = false) => (
    <LinhaDaExperiencia
      key={m.id}
      experiencia={m}
      fotoDestaqueUrl={m.fotoDestaque ? (urls.get(m.fotoDestaque.caminho) ?? null) : null}
      semQuando={semQuando}
    />
  );

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
        description="Tudo o que já vivemos juntos."
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
        <View>
          <View style={{ borderLeftWidth: 1, borderLeftColor: theme.accent, paddingLeft: Spacing.three }}>
            {meses.map((mes) => (
              <View key={mes.chave} style={{ marginBottom: Spacing.four }}>
                {/* Cada mês é um capítulo do álbum: título na voz editorial. */}
                <ThemedText
                  type="subtitle"
                  accessibilityRole="header"
                  style={{ fontSize: 22, lineHeight: 30, marginBottom: Spacing.one }}>
                  {mes.rotulo}
                </ThemedText>
                {mes.comDia.map((m) => item(m))}
                {mes.semDia.length > 0 ? (
                  <>
                    <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.three }}>
                      {`Em algum dia de ${mes.rotulo.split(' de ')[0].toLowerCase()}`}
                    </ThemedText>
                    {mes.semDia.map((m) => item(m, true))}
                  </>
                ) : null}
              </View>
            ))}
          </View>
          {/* Não existe fim da história: o fio continua. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two }}>
            <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: 'italic' }}>
              E ainda tem muito por viver.
            </ThemedText>
            <View
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={{ flex: 1, height: 1, backgroundColor: theme.accent }}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}
