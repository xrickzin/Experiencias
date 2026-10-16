import { Image } from 'expo-image';
import { useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, View, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icone } from '@/components/icone';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ZOOM_MAXIMO = 4;
const ZOOM_DO_TOQUE_DUPLO = 2;
const INTERVALO_DO_TOQUE_DUPLO = 280;

type Props = { url: string | null; cacheKey: string; legenda?: string | null; onFechar: () => void };

const distancia = (e: GestureResponderEvent) => {
  const [a, b] = e.nativeEvent.touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
};

/**
 * Pinça, arrastar e dois toques sobre uma área. O estado do gesto muda a cada quadro e vive fora
 * da renderização: só os valores animados chegam à tela.
 */
function criarZoom() {
  const escala = new Animated.Value(1);
  const x = new Animated.Value(0);
  const y = new Animated.Value(0);
  const area = { largura: 0, altura: 0 };
  let atual = { escala: 1, x: 0, y: 0 };
  let inicio = { escala: 1, x: 0, y: 0, distancia: 0 };
  let ultimoToque = 0;

  // A foto ampliada não sai da tela: o deslocamento máximo é o que sobra para cada lado.
  const limitar = (valor: number, s: number, lado: number) => {
    const folga = (lado * (s - 1)) / 2;
    return Math.max(-folga, Math.min(folga, valor));
  };

  const aplicar = (s: number, nx: number, ny: number) => {
    atual = { escala: s, x: limitar(nx, s, area.largura), y: limitar(ny, s, area.altura) };
    escala.setValue(atual.escala);
    x.setValue(atual.x);
    y.setValue(atual.y);
  };

  const animarPara = (s: number) => {
    atual = { escala: s, x: 0, y: 0 };
    Animated.parallel([
      Animated.spring(escala, { toValue: s, useNativeDriver: true, friction: 8 }),
      Animated.spring(x, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.spring(y, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();
  };

  const gestos = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      inicio = { ...atual, distancia: e.nativeEvent.touches.length >= 2 ? distancia(e) : 0 };
    },
    onPanResponderMove: (e, g) => {
      if (e.nativeEvent.touches.length >= 2) {
        // O segundo dedo pode chegar no meio do gesto: a pinça começa dali.
        if (!inicio.distancia) inicio = { ...atual, distancia: distancia(e) };
        const s = Math.min(ZOOM_MAXIMO, Math.max(1, (inicio.escala * distancia(e)) / inicio.distancia));
        aplicar(s, atual.x, atual.y);
      } else if (atual.escala > 1 && !inicio.distancia) {
        aplicar(atual.escala, inicio.x + g.dx, inicio.y + g.dy);
      }
    },
    onPanResponderRelease: (_e, g) => {
      const foiToque = Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8 && !inicio.distancia;
      inicio.distancia = 0;
      if (foiToque) {
        const agora = Date.now();
        if (agora - ultimoToque < INTERVALO_DO_TOQUE_DUPLO) {
          ultimoToque = 0;
          animarPara(atual.escala > 1 ? 1 : ZOOM_DO_TOQUE_DUPLO);
          return;
        }
        ultimoToque = agora;
      }
      // Quase sem zoom: volta à foto inteira, centralizada.
      if (atual.escala < 1.05) animarPara(1);
    },
  });

  const medir = (largura: number, altura: number) => {
    area.largura = largura;
    area.altura = altura;
  };

  return { escala, x, y, gestos: gestos.panHandlers, medir };
}

/**
 * A foto na tela inteira, para ver detalhes: pinça aproxima (até 4×), arrastar move a foto
 * ampliada e dois toques alternam entre 2× e a foto inteira. Fecha pelo X ou pelo voltar.
 * Gestos do próprio React Native (sem o Reanimated): bastam para uma imagem.
 */
export function FotoEmTelaCheia({ url, cacheKey, legenda, onFechar }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [zoom] = useState(criarZoom);

  return (
    <Modal
      testID="foto-em-tela-cheia"
      visible
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onFechar}>
      <View style={{ flex: 1, backgroundColor: theme.photoBackdrop }}>
        <View
          style={{ flex: 1, overflow: 'hidden' }}
          onLayout={(e) => zoom.medir(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}
          {...zoom.gestos}>
          {url ? (
            <Animated.View
              style={{ flex: 1, transform: [{ translateX: zoom.x }, { translateY: zoom.y }, { scale: zoom.escala }] }}>
              <Image
                source={{ uri: url, cacheKey }}
                contentFit="contain"
                style={{ flex: 1 }}
                accessibilityLabel={legenda ? `Foto em tela cheia: ${legenda}` : 'Foto em tela cheia'}
                accessibilityHint="Pinça para aproximar; dois toques alternam o zoom."
              />
            </Animated.View>
          ) : (
            <ThemedText themeColor="onPhoto" style={{ margin: Spacing.four }}>
              Não foi possível mostrar esta foto agora.
            </ThemedText>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar tela cheia"
          hitSlop={Spacing.two}
          onPress={onFechar}
          style={({ pressed }) => ({
            position: 'absolute',
            top: insets.top + Spacing.two,
            right: Spacing.three,
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.scrim,
            opacity: pressed ? 0.7 : 1,
          })}>
          <Icone nome="fechar" cor={theme.onPhoto} />
        </Pressable>
      </View>
    </Modal>
  );
}
