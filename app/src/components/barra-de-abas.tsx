import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Tabs } from 'expo-router/js-tabs';

import { Icone, type NomeDoIcone } from '@/components/icone';
import { ThemedText } from '@/components/themed-text';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0] & {
  /** A ação central (o "+"), que não é uma aba. */
  centro: ReactNode;
  /** Altura do conteúdo, sem a área segura de baixo. */
  altura: number;
};

type Ponto = [number, number];
/** Curva de Bézier cúbica: início, dois controles, fim. */
type Segmento = [Ponto, Ponto, Ponto, Ponto];

const ICONE_Y = 24; // centro do ícone na barra
const ENTRADA: Ponto = [-22, 16]; // onde o fio chega e sai de cada ícone (relativo ao centro)

/**
 * O laço de cada aba, relativo ao centro do ícone. Todos começam na mesma entrada, embaixo à
 * esquerda, para o fio poder sair de um e chegar ao outro.
 */
const LACOS: Record<string, Segmento[]> = {
  // Casa: o fio dá a volta por cima e se amarra embaixo, como uma fita.
  index: [
    [ENTRADA, [-16, 16], [-20, -17], [0, -17]],
    [[0, -17], [18, -17], [19, 10], [6, 15]],
    [[6, 15], [-4, 19], [-9, 9], [-2, 11]],
    [[-2, 11], [4, 13], [6, 20], [12, 21]],
  ],
  // Estrela: o fio sobe, dá um nó em cima (a estrela fica pendurada) e desce contornando.
  desejos: [
    [ENTRADA, [-18, 4], [-12, -16], [-2, -17]],
    [[-2, -17], [6, -18], [6, -10], [0, -11]],
    [[0, -11], [-6, -12], [-4, -21], [3, -20]],
    [[3, -20], [16, -18], [18, 14], [0, 16]],
    [[0, 16], [-10, 17], [-15, 8], [-13, 2]],
  ],
  // Álbum: o fio contorna o livro por fora e termina num laço de fita no canto de baixo, à direita.
  'nossa-historia': [
    [ENTRADA, [-19, 10], [-17, 4], [-17, -2]],
    [[-17, -2], [-17, -12], [-8, -15], [0, -15]],
    [[0, -15], [9, -15], [17, -12], [17, -2]],
    [[17, -2], [17, 6], [16, 9], [14, 10]],
    [[14, 10], [19, 6], [24, 10], [20, 14]],
    [[20, 14], [17, 17], [13, 13], [14, 10]],
    [[14, 10], [12, 15], [16, 19], [20, 21]],
  ],
};

const ICONES: Record<string, NomeDoIcone> = { index: 'inicio', desejos: 'desejos', 'nossa-historia': 'historia' };

// O fio se desloca de uma aba para a outra: tempo para o movimento ser visto, saída suave.
const VIAGEM = { duration: 650, easing: Easing.bezier(0.65, 0, 0.35, 1), useNativeDriver: false };

const mover = (s: Segmento[], dx: number, dy: number): Segmento[] =>
  s.map((seg) => seg.map(([x, y]) => [x + dx, y + dy]) as Segmento);
const inverter = (s: Segmento[]): Segmento[] => [...s].reverse().map(([a, b, c, d]) => [d, c, b, a]);
const desenhar = (s: Segmento[]) =>
  s.length ? `M${s[0][0].join(' ')} ` + s.map(([, b, c, d]) => `C${b.join(' ')} ${c.join(' ')} ${d.join(' ')}`).join(' ') : '';

/** Comprimento aproximado (amostrando a curva), para o traço que se desenha. */
function comprimento(s: Segmento[]) {
  let total = 0;
  for (const [a, b, c, d] of s) {
    let antes = a;
    for (let i = 1; i <= 24; i++) {
      const t = i / 24;
      const u = 1 - t;
      const p: Ponto = [
        u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
        u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
      ];
      total += Math.hypot(p[0] - antes[0], p[1] - antes[1]);
      antes = p;
    }
  }
  return total;
}

/**
 * Barra de abas própria (no lugar da padrão): ícones em traço e um único fio vermelho que vive na
 * barra. Na aba ativa ele forma o laço daquele ícone; ao trocar de aba, se desenrola, atravessa a
 * barra (por trás do "+") e se enrola no ícone novo. Com menos movimento pedido pelo sistema, o
 * laço só muda de lugar. O toque fica contido no espaço da aba.
 */
export function BarraDeAbas({ state, descriptors, navigation, insets, centro, altura }: Props) {
  const theme = useTheme();
  const [largura, setLargura] = useState(0);
  const atual = state.routes[state.index].name;
  const fio = useFio(atual, largura, state.routes.map((r) => r.name));

  return (
    <View
      style={{
        backgroundColor: theme.background,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingBottom: insets.bottom,
      }}>
      <View style={{ height: altura }} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
        {/* O fio fica por trás dos ícones (parece passar entre os traços) e do "+". */}
        {largura > 0 && fio ? (
          <Svg
            width={largura}
            height={altura}
            style={{ position: 'absolute' }}
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants">
            <Path
              d={fio.d}
              stroke={theme.accent}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={fio.traco}
              strokeDashoffset={fio.deslocamento}
            />
          </Svg>
        ) : null}

        <View style={{ flex: 1, flexDirection: 'row' }}>
          {state.routes.map((route, i) => {
            const icone = ICONES[route.name];
            if (!icone) {
              return (
                <View key={route.key} style={{ flex: 1 }}>
                  {centro}
                </View>
              );
            }
            const selecionada = state.index === i;
            const rotulo = descriptors[route.key].options.title ?? route.name;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={rotulo}
                accessibilityState={{ selected: selecionada }}
                onPress={() => {
                  const evento = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!selecionada && !evento.defaultPrevented) navigation.navigate(route.name, route.params);
                }}
                style={({ pressed }) => ({ flex: 1, alignItems: 'center', opacity: pressed ? 0.6 : 1 })}>
                <View style={{ marginTop: ICONE_Y - 12 }}>
                  <Icone nome={icone} cor={selecionada ? theme.text : theme.textSecondary} />
                </View>
                <ThemedText
                  themeColor={selecionada ? 'text' : 'textSecondary'}
                  style={{ fontFamily: FontFamily.bodyStrong, fontSize: 12, lineHeight: 16, marginTop: 14 }}>
                  {rotulo}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

type Fio = { d: string; traco?: number[]; deslocamento?: number };

/** O caminho do fio e quanto dele aparece, quadro a quadro, ao trocar de aba. */
function useFio(atual: string, largura: number, rotas: string[]): Fio | null {
  const anterior = useRef(atual);
  const [fio, setFio] = useState<Fio | null>(null);

  useEffect(() => {
    if (!largura) return;
    const slot = largura / rotas.length;
    const lacoEm = (nome: string) => mover(LACOS[nome] ?? [], slot * (rotas.indexOf(nome) + 0.5), ICONE_Y);
    const de = anterior.current;
    anterior.current = atual;
    const destino = lacoEm(atual);

    // Primeira vez, mesma aba ou a aba anterior não tem laço: o laço já aparece pronto.
    if (de === atual || !LACOS[de] || !LACOS[atual]) {
      setFio({ d: desenhar(destino) });
      return;
    }

    // O caminho todo: desfaz o laço de origem, atravessa a barra e faz o laço de destino.
    const saida = inverter(lacoEm(de));
    const a = saida[saida.length - 1][3];
    const b = destino[0][0];
    const passo = (b[0] - a[0]) / 3;
    const travessia: Segmento[] = [[a, [a[0] + passo, a[1] + 6], [b[0] - passo, b[1] + 6], b]];
    const caminho = [...saida, ...travessia, ...destino];
    const [lenSaida, lenTravessia, lenDestino] = [comprimento(saida), comprimento(travessia), comprimento(destino)];
    const total = lenSaida + lenTravessia + lenDestino;
    const d = desenhar(caminho);

    // O trecho visível escorrega pelo caminho: a cauda come o laço de origem enquanto a ponta
    // enrola o de destino; o fio mantém quase o mesmo comprimento o tempo todo.
    const quadro = (p: number) => {
      const cauda = p * (lenSaida + lenTravessia);
      const ponta = lenSaida + p * (lenTravessia + lenDestino);
      setFio({ d, traco: [ponta - cauda, total + 1], deslocamento: -cauda });
    };

    let ativo = true;
    const progresso = new Animated.Value(0);
    const ouvinte = progresso.addListener(({ value }) => quadro(value));
    const viagem = Animated.timing(progresso, { toValue: 1, ...VIAGEM });
    quadro(0);
    // Promise.resolve: nos testes, a consulta pode não devolver promessa.
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled()).then((reduzir) => {
      if (!ativo) return;
      if (reduzir) setFio({ d: desenhar(destino) });
      else viagem.start(({ finished }) => finished && ativo && setFio({ d: desenhar(destino) }));
    });
    return () => {
      ativo = false;
      viagem.stop();
      progresso.removeListener(ouvinte);
    };
    // As rotas da barra não mudam; o efeito só depende da aba atual e da largura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atual, largura]);

  return fio;
}
