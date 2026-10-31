import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { PaginaDoAlbum } from '@/components/pagina-do-album';
import { ThemedText } from '@/components/themed-text';
import { useExperiencias } from '@/hooks/use-experiencias';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { assinarCaminhos } from '@/services/fotos';
import { agruparPorMes } from '@/services/nossa-historia';

/**
 * O álbum do casal: as memórias agrupadas pelo mês de início, da mais recente à mais antiga, cada
 * mês uma página com a foto de destaque quando existir. Um fio sutil na lateral liga os meses
 * (ux/our-story.md).
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
          <View style={{ paddingLeft: Spacing.three + Spacing.one, gap: Spacing.five }}>
            <FioLateral />
            {meses.map((mes) => (
              <PaginaDoAlbum key={mes.chave} mes={mes} urls={urls} />
            ))}
          </View>
          {/* Não existe fim da história: o fio continua. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.four }}>
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

/** O fio que liga os meses: o mesmo fio ondulado das guias, descendo pela lateral da história. */
function FioLateral() {
  const theme = useTheme();
  const [altura, setAltura] = useState(0);
  let d = 'M4 0';
  for (let y = 0, i = 0; y < altura; y += 18, i++) d += ` Q${4 + (i % 2 ? 1.5 : -1.5)} ${y + 9} 4 ${y + 18}`;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      onLayout={(e) => setAltura(e.nativeEvent.layout.height)}
      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8 }}>
      {altura ? (
        <Svg width={8} height={altura}>
          <Path d={d} stroke={theme.accentSoft} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        </Svg>
      ) : null}
    </View>
  );
}
