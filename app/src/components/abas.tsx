import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedProps, useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { FIO } from '@/components/fio';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AbasProps<T extends string> = {
  abas: { valor: T; rotulo: string }[];
  atual: T;
  onChange: (valor: T) => void;
  /**
   * Onde as páginas estão, de 0 até a última aba (1,5 é o meio do caminho entre a segunda e a
   * terceira). O laço segue esse valor: o dedo ou o toque o movem, e ele vai junto.
   */
  progresso: SharedValue<number>;
};

const ALTURA_DO_FIO = 22;
const BASE = 17; // altura do fio dentro da faixa
const LACO = 56; // largura reservada ao laço
// Onde o laço sai do fio e volta para ele, a partir do começo do espaço reservado.
const ENTRADA = 14;
const SAIDA = 42;
const ONDA = 16; // comprimento de cada meia onda do fio

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * O fio ondulado de ponta a ponta, com uma abertura onde o laço está: o laço é o próprio fio dando a
 * volta, não um desenho por cima. As ondas ficam paradas no lugar enquanto a abertura anda.
 */
export function fioComAbertura(largura: number, inicio: number) {
  'worklet';
  const a = inicio + ENTRADA;
  const b = inicio + SAIDA;
  let d = `M0 ${BASE}`;
  let x = 0;
  for (let i = 0; x < largura; x += ONDA, i++) {
    const fim = x + ONDA;
    const crista = BASE + (i % 2 ? 1.5 : -1.5);
    if (fim <= a) d += ` Q${x + ONDA / 2} ${crista} ${fim} ${BASE}`;
    else if (x < a) d += ` L${a} ${BASE}`;
    // Depois da abertura, a caneta recomeça no início da onda.
    if (x >= b) d += `${x - ONDA < b ? ` M${x} ${BASE}` : ''} Q${x + ONDA / 2} ${crista} ${fim} ${BASE}`;
    else if (fim > b) d += ` M${b} ${BASE} L${fim} ${BASE}`;
  }
  return d;
}

/**
 * O laço: da abertura, o fio sobe, dá a volta e cruza a própria passagem. `aperto` 1 é o laço dado;
 * 0, o fio esticado (no meio do caminho entre duas abas).
 */
function laco(inicio: number, aperto: number) {
  'worklet';
  const y = (dy: number) => BASE - dy * aperto;
  const x = (dx: number) => inicio + dx;
  return (
    `M${x(ENTRADA)} ${BASE} C${x(18)} ${BASE} ${x(20)} ${y(2)} ${x(23)} ${y(4)}` +
    ` C${x(28)} ${y(8)} ${x(29)} ${y(15)} ${x(23)} ${y(15)}` +
    ` C${x(17)} ${y(15)} ${x(17)} ${y(8)} ${x(25)} ${y(3)}` +
    ` C${x(30)} ${BASE} ${x(34)} ${BASE} ${x(SAIDA)} ${BASE}`
  );
}

/**
 * Abas dentro de uma tela. Um fio atravessa a faixa e, sob a aba ativa, dá um laço. Entre uma aba e
 * outra o laço se desfaz no caminho e se refaz ao chegar, no ritmo do dedo que arrasta as páginas
 * (ou do toque). A ativa também fica em negrito: a seleção não depende só da cor. Cada aba tem a
 * largura do seu nome; quando não cabem (cinco abas na memória), a faixa rola.
 */
export function Abas<T extends string>({ abas, atual, onChange, progresso }: AbasProps<T>) {
  const theme = useTheme();
  const [largura, setLargura] = useState(0);
  const [medidas, setMedidas] = useState<Partial<Record<T, { x: number; w: number }>>>({});
  // O começo do laço sob cada aba, na ordem (lido no thread da UI).
  const centros = useSharedValue<number[]>([]);
  const prontas = abas.every((a) => medidas[a.valor]);

  useEffect(() => {
    if (!prontas) return;
    centros.set(abas.map((a) => medidas[a.valor]!.x + medidas[a.valor]!.w / 2 - LACO / 2));
  }, [prontas, abas, medidas, centros]);

  const larguraNaUI = useSharedValue(0);
  // Onde está o laço e quão apertado: dado em cima de uma aba, desfeito no meio do caminho
  // (|cos(π·t)| vai de 1 a 0 e volta a 1). Tudo calculado no thread da UI, a cada quadro.
  const lugar = useDerivedValue(() => {
    const c = centros.get();
    if (!c.length) return { inicio: -LACO * 2, aperto: 1 };
    const p = Math.min(Math.max(progresso.get(), 0), c.length - 1);
    const i = Math.floor(p);
    const t = p - i;
    const inicio = i + 1 < c.length ? c[i] + (c[i + 1] - c[i]) * t : c[i];
    return { inicio, aperto: Math.abs(Math.cos(Math.PI * t)) };
  });
  const fio = useAnimatedProps(() => ({ d: fioComAbertura(larguraNaUI.get(), lugar.get().inicio) }));
  // Desfeito, o laço volta a ser fio comum: afina e ganha a cor da onda. Não sobra traço por cima.
  const corDoFio = theme.accentSoft;
  const corDoLaco = theme.accent;
  const voltaDoLaco = useAnimatedProps(() => {
    const { inicio, aperto } = lugar.get();
    return {
      d: laco(inicio, aperto),
      strokeWidth: 1.5 + (FIO - 1.5) * aperto,
      stroke: interpolateColor(aperto, [0, 1], [corDoFio, corDoLaco]),
    };
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      style={{ flexGrow: 0, marginBottom: Spacing.four }}
      contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={{ flexGrow: 1, paddingBottom: Spacing.one }}
        onLayout={(e) => {
          setLargura(e.nativeEvent.layout.width);
          larguraNaUI.set(e.nativeEvent.layout.width);
        }}>
        <View style={{ flexDirection: 'row' }}>
          {abas.map(({ valor, rotulo }) => {
            const selecionada = valor === atual;
            return (
              <Pressable
                key={valor}
                accessibilityRole="tab"
                accessibilityLabel={rotulo}
                accessibilityState={{ selected: selecionada }}
                onPress={() => onChange(valor)}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  setMedidas((atuais) => ({ ...atuais, [valor]: { x, w: width } }));
                }}
                style={({ pressed }) => ({
                  flexGrow: 1,
                  minHeight: 48,
                  paddingHorizontal: Spacing.three,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}>
                <ThemedText
                  type={selecionada ? 'smallBold' : 'small'}
                  themeColor={selecionada ? 'text' : 'textSecondary'}
                  numberOfLines={1}
                  style={{ fontSize: 16 }}>
                  {rotulo}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Só desenho: a seleção já está no estado de cada aba para o leitor de tela. */}
        <View
          pointerEvents="none"
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={{ height: ALTURA_DO_FIO }}>
          {largura ? (
            <Svg width={largura} height={ALTURA_DO_FIO}>
              <AnimatedPath animatedProps={fio} stroke={theme.accentSoft} strokeWidth={1.5} fill="none" strokeLinecap="round" />
              <AnimatedPath
                animatedProps={voltaDoLaco}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
