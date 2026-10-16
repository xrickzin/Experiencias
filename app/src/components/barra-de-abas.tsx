import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Tabs } from 'expo-router/js-tabs';

import {
  atras,
  comprimento,
  CORTE,
  FIO,
  frente,
  inverter,
  medir,
  mover,
  parado,
  partesDaFrente,
  tracoDeTras,
  type Fio,
  type Ponto,
  type Segmento,
  type Trecho,
} from '@/components/fio';
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

const ICONE_Y = 24; // centro do ícone na barra
const ENTRADA: Ponto = [-22, 16]; // onde o fio chega e sai de cada ícone (relativo ao centro)
/**
 * Um anel em volta do ícone, como o de Saturno: a metade de cima passa por trás do ícone (sólido,
 * some), a de baixo pela frente. O fio chega da entrada, dá a volta inteira e sai cruzando a
 * própria chegada, formando o nó. Relativo ao centro do ícone (que ocupa de -12 a 12).
 */
type Anel = {
  /** Centro do anel. */
  centro: Ponto;
  /** Raios horizontal e vertical antes da inclinação. */
  raios: Ponto;
  /** Inclinação, em graus (positiva gira no sentido horário). */
  inclinacao: number;
  /** Onde o fio entra no anel e onde fica o nó. */
  no: 'esquerda' | 'direita';
  /** Para onde a ponta solta sai depois do nó. */
  saida: Ponto;
};

const K = 0.5523; // controle de Bézier para um quarto de elipse

function anel({ centro, raios, inclinacao, no, saida }: Anel): Trecho[] {
  const [rx, ry] = raios;
  const g = (inclinacao * Math.PI) / 180;
  const ponto = (x: number, y: number): Ponto => [
    centro[0] + x * Math.cos(g) - y * Math.sin(g),
    centro[1] + x * Math.sin(g) + y * Math.cos(g),
  ];
  // Quatro quartos, sempre passando primeiro por cima (por trás do ícone).
  const sentido = no === 'esquerda' ? 1 : -1;
  const inicio = no === 'esquerda' ? Math.PI : 0;
  const quartos: Trecho[] = [0, 1, 2, 3].map((q) => {
    const a = inicio + sentido * (q * Math.PI) / 2;
    const b = a + (sentido * Math.PI) / 2;
    const [ca, sa, cb, sb] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b)];
    const segmento: Segmento = [
      ponto(rx * ca, ry * sa),
      ponto(rx * (ca - sentido * K * sa), ry * (sa + sentido * K * ca)),
      ponto(rx * (cb + sentido * K * sb), ry * (sb - sentido * K * cb)),
      ponto(rx * cb, ry * sb),
    ];
    // Metade de cima (antes da inclinação) passa por trás; a de baixo, pela frente.
    return { s: segmento, frente: Math.sin((a + b) / 2) > 0 };
  });
  const p = quartos[0].s[0];
  // Direção do fio ao entrar no anel, para a chegada e o nó saírem sem quina.
  const [tx, ty] = [quartos[0].s[1][0] - p[0], quartos[0].s[1][1] - p[1]];
  const chegada = atras([ENTRADA, [ENTRADA[0] + 6, ENTRADA[1] - 2], [p[0] - tx, p[1] - ty], p]);
  const no_ = frente([p, [p[0] + tx * 0.8, p[1] + ty * 0.8], [saida[0] - 2, saida[1] - 3], saida]);
  return [chegada, ...quartos, no_];
}

const LACOS: Record<string, Trecho[]> = {
  // Casa: anel quase deitado, levemente inclinado, com o nó à esquerda.
  index: anel({ centro: [0, 3], raios: [16, 6.5], inclinacao: -10, no: 'esquerda', saida: [-15, 15] }),
  // Estrela: anel inclinado para o outro lado, com o nó à direita.
  desejos: anel({ centro: [0, 1], raios: [15.5, 7], inclinacao: 16, no: 'direita', saida: [17, 17] }),
  // Álbum: anel em pé, como uma fita amarrando o livro pela lombada, com o nó embaixo.
  'nossa-historia': anel({ centro: [1, 1], raios: [15, 5.5], inclinacao: 80, no: 'direita', saida: [8, 21] }),
};

const ICONES: Record<string, NomeDoIcone> = { index: 'inicio', desejos: 'desejos', 'nossa-historia': 'historia' };

// A viagem leva mais tempo quanto mais longe é a aba de destino, para o movimento ser visto.
const duracao = (abas: number) => 800 + 230 * abas;
const SUAVE = Easing.bezier(0.65, 0, 0.35, 1);
const ONDA = 8; // altura das curvas da travessia

/** A travessia entre duas abas: uma onda, com uma crista para cada aba atravessada. */
function travessia(a: Ponto, b: Ponto, abas: number): Trecho[] {
  const meias = Math.max(2, abas * 2);
  const passo = (b[0] - a[0]) / meias;
  return Array.from({ length: meias }, (_, i) => {
    const x0 = a[0] + passo * i;
    const y = a[1] + (b[1] - a[1]) * (i / meias);
    const y1 = a[1] + (b[1] - a[1]) * ((i + 1) / meias);
    const pico = (i % 2 === 0 ? -1 : 1) * ONDA;
    return atras([[x0, y], [x0 + passo / 3, y + pico], [x0 + (2 * passo) / 3, y1 + pico], [x0 + passo, y1]]);
  });
}

/**
 * Barra de abas própria (no lugar da padrão): ícones sólidos e um único fio vermelho que vive na
 * barra. Na aba ativa ele se entrelaça no ícone (passa por trás e cruza por cima); ao trocar de
 * aba, se desenrola, atravessa a barra em ondas (por trás do "+") e se entrelaça no ícone novo.
 * Com menos movimento pedido pelo sistema, o laço só muda de lugar. O toque fica contido no
 * espaço da aba.
 */
export function BarraDeAbas({ state, descriptors, navigation, insets, centro, altura }: Props) {
  const theme = useTheme();
  const [largura, setLargura] = useState(0);
  const atual = state.routes[state.index].name;
  const fio = useFio(atual, largura, state.routes.map((r) => r.name));

  const daFrente = fio ? partesDaFrente(fio) : [];

  const camada = (conteudo: ReactNode) => (
    <Svg
      width={largura}
      height={altura}
      style={{ position: 'absolute' }}
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      {conteudo}
    </Svg>
  );

  return (
    <View
      style={{
        backgroundColor: theme.background,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingBottom: insets.bottom,
      }}>
      <View style={{ height: altura }} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
        {/* Camada de trás: o fio inteiro, por trás dos ícones (sólidos) e do "+". */}
        {largura > 0 && fio
          ? camada(
              <Path
                {...tracoDeTras(fio)}
                stroke={theme.accent}
                strokeWidth={FIO}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )
          : null}

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
                  <Icone
                    nome={icone}
                    cor={selecionada ? theme.text : theme.textSecondary}
                    preenchimento={theme.background}
                  />
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

        {/* Camada da frente: só os trechos que cruzam por cima do ícone, com o corte cor de papel. */}
        {largura > 0 && daFrente.length
          ? camada(
              <>
                {daFrente.map(({ i, ...traco }) => (
                  <Path
                    key={`corte-${i}`}
                    {...traco}
                    stroke={theme.background}
                    strokeWidth={CORTE}
                    strokeLinecap="butt"
                    fill="none"
                  />
                ))}
                {daFrente.map(({ i, ...traco }) => (
                  <Path key={`fio-${i}`} {...traco} stroke={theme.accent} strokeWidth={FIO} strokeLinecap="round" fill="none" />
                ))}
              </>
            )
          : null}
      </View>
    </View>
  );
}

/** O caminho do fio e a parte visível dele, quadro a quadro, ao trocar de aba. */
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
      setFio(parado(destino));
      return;
    }

    // O caminho todo: desfaz o laço de origem, atravessa a barra em ondas e faz o de destino.
    const abas = Math.abs(rotas.indexOf(atual) - rotas.indexOf(de));
    const saida = inverter(lacoEm(de));
    const meio = travessia(saida[saida.length - 1].s[3], destino[0].s[0], abas);
    const caminho = medir([...saida, ...meio, ...destino]);
    const [lenSaida, lenMeio] = [
      saida.reduce((n, t) => n + comprimento(t.s), 0),
      meio.reduce((n, t) => n + comprimento(t.s), 0),
    ];
    const lenDestino = caminho.total - lenSaida - lenMeio;

    // O trecho visível escorrega pelo caminho: a cauda come o laço de origem enquanto a ponta
    // entrelaça o de destino; o fio mantém quase o mesmo comprimento o tempo todo.
    const quadro = (p: number) =>
      setFio({ ...caminho, cauda: p * (lenSaida + lenMeio), ponta: lenSaida + p * (lenMeio + lenDestino) });

    let ativo = true;
    const progresso = new Animated.Value(0);
    const ouvinte = progresso.addListener(({ value }) => quadro(value));
    const viagem = Animated.timing(progresso, {
      toValue: 1,
      duration: duracao(abas),
      easing: SUAVE,
      useNativeDriver: false,
    });
    quadro(0);
    // Promise.resolve: nos testes, a consulta pode não devolver promessa.
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled()).then((reduzir) => {
      if (!ativo) return;
      if (reduzir) setFio(parado(destino));
      else viagem.start(({ finished }) => finished && ativo && setFio(parado(destino)));
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
