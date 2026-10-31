import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

type Props = {
  /** A guia aberta. Muda pelo toque nas abas ou pelo arrasto aqui. */
  indice: number;
  onIndice: (indice: number) => void;
  /** O mesmo valor que move o laço das abas: as páginas e o laço andam juntos. */
  progresso: SharedValue<number>;
  /** Uma página por guia, na ordem das abas. */
  paginas: ReactNode[];
};

// Movimento na tela, sem dedo: ease-in-out forte (expo-animation).
// O respiro entre uma página e outra durante o arrasto.
const RESPIRO = 24;
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

/**
 * As guias de uma tela lado a lado: arrastar para o lado leva a página junto com o dedo (e o laço
 * das abas acompanha); soltando, ela assenta na mais próxima, ou na seguinte se o gesto foi rápido.
 * Tocar numa aba anda até ela. Só a página aberta fala com o leitor de tela. As páginas montam
 * quando ficam ao lado da aberta (para aparecerem no arrasto) e continuam montadas depois.
 */
export function GuiasDeslizantes({ indice, onIndice, progresso, paginas }: Props) {
  const [largura, setLargura] = useState(0);
  const larguraNaUI = useSharedValue(0);
  const [alturas, setAlturas] = useState<number[]>([]);
  // Para onde as páginas estão indo: o arrasto decide no thread da UI e avisa a tela depois.
  const alvo = useSharedValue(indice);
  const inicio = useSharedValue(0);
  const total = paginas.length;
  // As páginas montadas: a aberta, as vizinhas (aparecem no arrasto) e as que já foram abertas.
  // Ajustado durante a renderização quando a guia muda (padrão do React para estado derivado).
  const [visitadas, setVisitadas] = useState(() => new Set([indice - 1, indice, indice + 1]));
  const vizinhas = [indice - 1, indice, indice + 1];
  if (!vizinhas.every((i) => visitadas.has(i))) setVisitadas(new Set([...visitadas, ...vizinhas]));

  // O toque numa aba mudou a guia: as páginas (e o laço) andam até ela.
  useEffect(() => {
    if (alvo.get() === indice) return;
    alvo.set(indice);
    progresso.set(withTiming(indice, { duration: 420, easing: EASE_IN_OUT, reduceMotion: ReduceMotion.System }));
  }, [indice, alvo, progresso]);

  const arrasto = Gesture.Pan()
    // Só na horizontal: a rolagem vertical da tela continua com a lista.
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onStart(() => {
      cancelAnimation(progresso);
      inicio.set(progresso.get());
    })
    .onUpdate((e) => {
      const w = larguraNaUI.get();
      if (!w) return;
      const bruto = inicio.get() - e.translationX / (w + RESPIRO);
      // Nas pontas, resiste como elástico em vez de parar seco.
      const p = bruto < 0 ? bruto / 3 : bruto > total - 1 ? total - 1 + (bruto - (total - 1)) / 3 : bruto;
      progresso.set(p);
    })
    .onEnd((e) => {
      const w = larguraNaUI.get();
      if (!w) return;
      const velocidade = -e.velocityX / (w + RESPIRO);
      // Um gesto rápido conta como intenção de passar, mesmo curto.
      const projetado = progresso.get() + velocidade * 0.25;
      const destino = Math.min(Math.max(Math.round(projetado), 0), total - 1);
      alvo.set(destino);
      progresso.set(withSpring(destino, { duration: 400, dampingRatio: 0.9, velocity: velocidade, reduceMotion: ReduceMotion.System }));
      scheduleOnRN(onIndice, destino);
    });

  const trilho = useAnimatedStyle(() => ({ transform: [{ translateX: -progresso.get() * (larguraNaUI.get() + RESPIRO) }] }));

  return (
    <GestureDetector gesture={arrasto}>
      <View
        collapsable={false}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setLargura(w);
          larguraNaUI.set(w);
        }}
        // A altura é a da página aberta: as outras não esticam a tela.
        style={{ overflow: 'hidden', height: largura ? alturas[indice] : undefined }}>
        {/* Antes de medir a largura, a guia aberta aparece sozinha (sem quadro em branco). */}
        {!largura ? paginas[indice] : null}
        {largura ? (
          <Animated.View style={[{ flexDirection: 'row', alignItems: 'flex-start', gap: RESPIRO, width: largura * total + RESPIRO * (total - 1) }, trilho]}>
            {paginas.map((pagina, i) => (
              <View
                key={i}
                style={{ width: largura }}
                importantForAccessibility={i === indice ? 'auto' : 'no-hide-descendants'}
                accessibilityElementsHidden={i !== indice}
                onLayout={(e) => {
                  const h = e.nativeEvent.layout.height;
                  setAlturas((atuais) => (atuais[i] === h ? atuais : Object.assign([...atuais], { [i]: h })));
                }}>
                {visitadas.has(i) ? pagina : null}
              </View>
            ))}
          </Animated.View>
        ) : null}
      </View>
    </GestureDetector>
  );
}
