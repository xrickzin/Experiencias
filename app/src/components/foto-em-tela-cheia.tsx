import { Image } from 'expo-image';
import { Modal, Pressable, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icone } from '@/components/icone';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ZOOM_MAXIMO = 4;
const ZOOM_DO_TOQUE_DUPLO = 2;
// Assentar depois do gesto, sem quicar (expo-animation: reposicionar após arrastar).
const ASSENTAR = { duration: 400, dampingRatio: 1, reduceMotion: ReduceMotion.System } as const;

type Props = { url: string | null; cacheKey: string; legenda?: string | null; onFechar: () => void };

/**
 * A foto na tela inteira, para ver detalhes: pinça aproxima (até 4×), arrastar move a foto
 * ampliada e dois toques alternam entre 2× e a foto inteira. Fecha pelo X ou pelo voltar.
 * Os gestos rodam no thread da UI (Gesture Handler + Reanimated): não travam com o app ocupado.
 */
export function FotoEmTelaCheia({ url, cacheKey, legenda, onFechar }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const escala = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const area = useSharedValue({ largura: 0, altura: 0 });
  const inicio = useSharedValue({ escala: 1, x: 0, y: 0 });

  // A foto ampliada não sai da tela: o deslocamento máximo é o que sobra para cada lado.
  const limitar = (valor: number, s: number, lado: number) => {
    'worklet';
    const folga = (lado * (s - 1)) / 2;
    return Math.max(-folga, Math.min(folga, valor));
  };

  const pinca = Gesture.Pinch()
    .onStart(() => {
      inicio.set({ escala: escala.get(), x: x.get(), y: y.get() });
    })
    .onUpdate((e) => {
      const s = Math.min(ZOOM_MAXIMO, Math.max(1, inicio.get().escala * e.scale));
      escala.set(s);
      x.set(limitar(x.get(), s, area.get().largura));
      y.set(limitar(y.get(), s, area.get().altura));
    })
    .onEnd(() => {
      // Quase sem zoom: volta à foto inteira, centralizada.
      if (escala.get() < 1.05) {
        escala.set(withSpring(1, ASSENTAR));
        x.set(withSpring(0, ASSENTAR));
        y.set(withSpring(0, ASSENTAR));
      }
    });

  const arrasto = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      inicio.set({ escala: escala.get(), x: x.get(), y: y.get() });
    })
    .onUpdate((e) => {
      const s = escala.get();
      if (s <= 1) return;
      x.set(limitar(inicio.get().x + e.translationX, s, area.get().largura));
      y.set(limitar(inicio.get().y + e.translationY, s, area.get().altura));
    });

  const doisToques = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const ampliar = escala.get() <= 1;
      escala.set(withSpring(ampliar ? ZOOM_DO_TOQUE_DUPLO : 1, ASSENTAR));
      x.set(withSpring(0, ASSENTAR));
      y.set(withSpring(0, ASSENTAR));
    });

  const gestos = Gesture.Simultaneous(pinca, arrasto, doisToques);
  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: escala.get() }],
  }));

  return (
    <Modal
      testID="foto-em-tela-cheia"
      visible
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onFechar}>
      {/* O Modal é outra janela no Android: os gestos precisam da própria raiz. */}
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.photoBackdrop }}>
        <GestureDetector gesture={gestos}>
          <View
            style={{ flex: 1, overflow: 'hidden' }}
            collapsable={false}
            onLayout={(e) => area.set({ largura: e.nativeEvent.layout.width, altura: e.nativeEvent.layout.height })}>
            {url ? (
              <Animated.View style={[{ flex: 1 }, estilo]}>
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
        </GestureDetector>
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
      </GestureHandlerRootView>
    </Modal>
  );
}
