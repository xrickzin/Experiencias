import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/button';
import {
  atras,
  CORTE,
  frente,
  parado,
  partesDaFrente,
  tracoDeTras,
  medir,
  type Fio,
  type Ponto,
  type Trecho,
} from '@/components/fio';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Estado } from '@/services/experiencias';

/** O marco de cada fase que avança (ADR 036). Voltar de fase não tem marco. */
export type Marco = Extract<Estado, 'planejamento' | 'vivendo' | 'memoria'>;

const TEXTOS: Record<Marco, { frase: string; detalhe: string; palavra: string }> = {
  planejamento: {
    frase: 'Próximo passo dado.',
    detalhe: 'Agora vamos transformar esse desejo em realidade.',
    palavra: 'Planejamento',
  },
  vivendo: {
    frase: 'Chegou a hora.',
    detalhe: 'O que vocês planejaram começou a acontecer.',
    palavra: 'Vivendo',
  },
  memoria: {
    frase: 'A experiência termina.',
    detalhe: 'A memória continua, agora na história de vocês.',
    palavra: 'Memória',
  },
};

const FIO_DO_MARCO = 3.5; // mais grosso que o da barra: aqui o fio é o protagonista
const DESENHO = { duration: 1700, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: false };

type Caixa = { x: number; y: number; largura: number; altura: number };

/**
 * Uma fita de presente na palavra: o fio chega pela esquerda, por baixo, sobe por trás das letras
 * até um nó logo acima delas, faz duas alças achatadas, desce pela frente das letras e segue até sair
 * pela direita. Sem ponta solta: o fio continua (a palavra está centralizada, então a borda direita
 * da tela fica em 2x + w).
 */
function lacoNaPalavra({ x, y, largura: w, altura: h }: Caixa): Trecho[] {
  const cx = x + w / 2;
  const topo = y + h * 0.12; // um pouco acima do alto das letras: onde fica o nó
  const baixo = y + h * 1.02; // abaixo da linha de base
  const alca = Math.min(w * 0.16, h * 1.05); // largura de cada alça
  const alto = h * 0.5; // quanto a alça sobe acima do nó
  const p = (px: number, py: number): Ponto => [px, py];
  const no = p(cx, topo);
  return [
    // Chega pela esquerda da tela, por baixo da palavra, em onda.
    atras([p(-10, baixo + h * 0.25), p(x * 0.5, baixo + h * 0.45), p(cx - w * 0.3, baixo + h * 0.05), p(cx - w * 0.06, baixo)]),
    // Sobe por trás das letras até o nó.
    atras([p(cx - w * 0.06, baixo), p(cx + w * 0.01, baixo), p(cx - w * 0.01, y + h * 0.45), no]),
    // Alça da esquerda, achatada, com a ponta um pouco para cima.
    frente([no, p(cx - alca * 0.3, topo - alto), p(cx - alca * 1.15, topo - alto * 1.1), p(cx - alca, topo - alto * 0.25)]),
    frente([p(cx - alca, topo - alto * 0.25), p(cx - alca * 0.85, topo + h * 0.05), p(cx - alca * 0.3, topo + h * 0.02), no]),
    // Alça da direita, espelhada.
    frente([no, p(cx + alca * 0.3, topo - alto), p(cx + alca * 1.15, topo - alto * 1.1), p(cx + alca, topo - alto * 0.25)]),
    frente([p(cx + alca, topo - alto * 0.25), p(cx + alca * 0.85, topo + h * 0.05), p(cx + alca * 0.3, topo + h * 0.02), no]),
    // Desce pela frente das letras e segue, por baixo, até sair pela direita da tela.
    frente([no, p(cx + w * 0.02, y + h * 0.4), p(cx + w * 0.04, y + h * 0.8), p(cx + w * 0.1, baixo + h * 0.05)]),
    atras([p(cx + w * 0.1, baixo + h * 0.05), p(cx + w * 0.16, baixo + h * 0.25), p(x + w * 1.1, baixo + h * 0.45), p(2 * x + w + 10, baixo + h * 0.3)]),
  ];
}

type Props = { marco: Marco | null; onFim: () => void };

/**
 * O marco de uma fase nova: frase, "FASE" e o nome da fase, com o fio chegando e se amarrando
 * na palavra num laço de presente (ADR 036). Com menos movimento pedido pelo sistema, o laço
 * aparece pronto. Fecha em "Continuar" ou tocando em qualquer lugar.
 */
export function MarcoDoLaco({ marco, onFim }: Props) {
  const theme = useTheme();
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [fio, setFio] = useState<Fio | null>(null);
  const [entrada] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!marco) return;
    entrada.setValue(0);
    Animated.timing(entrada, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [marco, entrada]);

  useEffect(() => {
    if (!marco || !caixa) return;
    const caminho = medir(lacoNaPalavra(caixa));
    let ativo = true;
    const progresso = new Animated.Value(0);
    const ouvinte = progresso.addListener(({ value }) => setFio({ ...caminho, cauda: 0, ponta: value * caminho.total }));
    const desenho = Animated.timing(progresso, { toValue: 1, ...DESENHO });
    progresso.setValue(0); // começa sem fio (o ouvinte desenha o quadro inicial)
    // Promise.resolve: nos testes, a consulta pode não devolver promessa.
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled()).then((reduzir) => {
      if (!ativo) return;
      if (reduzir) setFio(parado(caminho.trechos));
      else desenho.start();
    });
    return () => {
      ativo = false;
      desenho.stop();
      progresso.removeListener(ouvinte);
    };
  }, [marco, caixa]);

  if (!marco) return null;
  const textos = TEXTOS[marco];
  const daFrente = fio ? partesDaFrente(fio) : [];

  return (
    <Modal
      testID="marco-do-laco"
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onFim}>
      <Animated.View style={{ flex: 1, backgroundColor: theme.background, opacity: entrada }}>
        {/* Por trás das letras. */}
        {fio ? (
          <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
            <Path {...tracoDeTras(fio)} stroke={theme.accent} strokeWidth={FIO_DO_MARCO} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        ) : null}

        <Pressable
          accessibilityViewIsModal
          accessible={false}
          onPress={onFim}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: Spacing.four }}>
          <ThemedText type="subtitle" accessibilityRole="header" style={{ textAlign: 'center', fontSize: 26, lineHeight: 34 }}>
            {textos.frase}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.two, maxWidth: 320 }}>
            {textos.detalhe}
          </ThemedText>
          <ThemedText
            type="smallBold"
            themeColor="textSecondary"
            style={{ letterSpacing: 1, marginTop: Spacing.six }}>
            FASE
          </ThemedText>
          <ThemedText
            onLayout={(e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              setCaixa({ x, y, largura: width, altura: height });
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ fontFamily: FontFamily.display, fontSize: 52, lineHeight: 64, marginTop: Spacing.five }}>
            {textos.palavra}
          </ThemedText>
          <View style={{ marginTop: Spacing.six, alignSelf: 'stretch', maxWidth: 420, width: '100%' }}>
            <Button label="Continuar" onPress={onFim} />
          </View>
        </Pressable>

        {/* Pela frente das letras, com o corte cor de papel. O corte termina reto (butt): ponta redonda
            apagaria um pontinho do trecho de trás onde os dois se encontram. */}
        {daFrente.length ? (
          <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
            {daFrente.map(({ i, ...traco }) => (
              <Path key={`corte-${i}`} {...traco} stroke={theme.background} strokeWidth={CORTE + 1} strokeLinecap="butt" fill="none" />
            ))}
            {daFrente.map(({ i, ...traco }) => (
              <Path key={`fio-${i}`} {...traco} stroke={theme.accent} strokeWidth={FIO_DO_MARCO} strokeLinecap="round" fill="none" />
            ))}
          </Svg>
        ) : null}
      </Animated.View>
    </Modal>
  );
}
