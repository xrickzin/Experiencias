import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Experiencia } from '@/services/experiencias';
import { descreverReferencia } from '@/services/referencia-temporal';

export type Horizonte = 'Em breve' | 'Um dia' | 'Sem pressa';
export const HORIZONTES: Horizonte[] = ['Em breve', 'Um dia', 'Sem pressa'];
const DIAS_EM_BREVE = 90;

/**
 * Quão perto está um desejo: com data nos próximos três meses (ou já passada), "Em breve"; com data
 * mais longe, "Um dia"; sem data, "Sem pressa". Só apresentação: não muda o desejo.
 */
export function horizonteDe(desejo: Experiencia, hoje: Date): Horizonte {
  if (desejo.referencia.precisao === 'sem_data' || !desejo.referencia.inicio) return 'Sem pressa';
  const dias = (Date.parse(`${desejo.referencia.inicio}T00:00:00`) - hoje.getTime()) / 86_400_000;
  return dias <= DIAS_EM_BREVE ? 'Em breve' : 'Um dia';
}

const LINHA = 76; // altura de cada par de estrelas
const DEGRAU = 30; // a estrela da direita fica um pouco abaixo da da esquerda
const TOPO_DA_FAIXA = 30; // espaço do nome da faixa
const ALTURA_MINIMA = 240;
// Estrelinhas apagadas de fundo (x em %, y em fração da altura): sempre nos mesmos lugares.
const POEIRA = [
  [12, 0.08], [38, 0.04], [71, 0.11], [90, 0.06], [24, 0.3], [83, 0.27], [56, 0.42],
  [8, 0.55], [66, 0.62], [93, 0.5], [31, 0.74], [78, 0.83], [16, 0.92], [50, 0.95],
];

/** Um número estável de 0 a 1 a partir do id, para cada estrela ter o seu lugar sempre. */
function sorte(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h / 997;
}

type Props = {
  /** Todos os desejos, já separados por horizonte e na ordem em que aparecem. */
  porHorizonte: Record<Horizonte, Experiencia[]>;
  /** Os que combinam com a busca e os filtros; os outros ficam apagados no céu. */
  acesos: Set<string>;
  /** Há busca digitada: os acesos ganham a cor do fio. */
  procurando: boolean;
};

/**
 * O céu de desejos: cada desejo é uma estrela com o título ao lado; o fio liga os desejos da mesma
 * categoria, como constelações. Em cima, o que está perto; embaixo, o que é sem pressa. Tocar numa
 * estrela abre o desejo. Uma estrela cintila de vez em quando (nunca com menos movimento pedido).
 */
export function CeuDeDesejos({ porHorizonte, acesos, procurando }: Props) {
  const theme = useTheme();
  const estrelas: { desejo: Experiencia; x: number; y: number; largura: number }[] = [];
  const faixas: { nome: Horizonte; y: number }[] = [];
  let y = 0;
  for (const nome of HORIZONTES) {
    const lista = porHorizonte[nome];
    if (!lista.length) continue;
    faixas.push({ nome, y });
    lista.forEach((desejo, i) => {
      const direita = i % 2 === 1;
      // Duas colunas, cada estrela com um pequeno desvio próprio, para não parecer grade. Sozinha na
      // faixa, a estrela ganha a largura toda, para o título não ser cortado.
      const sozinha = lista.length === 1;
      const x = sozinha ? 6 + sorte(desejo.id) * 10 : (direita ? 52 : 4) + sorte(desejo.id) * 8;
      const largura = sozinha ? 80 : 44;
      estrelas.push({ desejo, x, y: y + TOPO_DA_FAIXA + Math.floor(i / 2) * LINHA + (direita ? DEGRAU : 0), largura });
    });
    y += TOPO_DA_FAIXA + Math.ceil(lista.length / 2) * LINHA + (lista.length % 2 === 0 ? DEGRAU : 0) + Spacing.three;
  }
  // Mesmo com poucos desejos, o céu tem altura de céu.
  const altura = Math.max(y, ALTURA_MINIMA);

  // O fio: por categoria, liga as estrelas de cima para baixo com curvas suaves.
  const porCategoria = new Map<string, typeof estrelas>();
  for (const e of estrelas) {
    const cat = e.desejo.categorias[0];
    if (!cat) continue;
    porCategoria.set(cat, [...(porCategoria.get(cat) ?? []), e]);
  }
  const fios = [...porCategoria.values()]
    .filter((grupo) => grupo.length > 1)
    .map((grupo) => {
      const pontos = grupo.map((e) => ({ x: e.x + 1.5, y: e.y + 9 }));
      let d = `M${pontos[0].x} ${pontos[0].y}`;
      for (let i = 1; i < pontos.length; i++) {
        const a = pontos[i - 1];
        const b = pontos[i];
        d += ` Q${(a.x + b.x) / 2 + (i % 2 ? 6 : -6)} ${(a.y + b.y) / 2} ${b.x} ${b.y}`;
      }
      return { d, aceso: grupo.some((e) => acesos.has(e.desejo.id)) };
    });

  const quemCintila = estrelas.find((e) => acesos.has(e.desejo.id))?.desejo.id;

  return (
    <View
      style={{
        height: altura,
        marginHorizontal: -Spacing.two,
        borderRadius: Radius.photo,
        overflow: 'hidden',
        // Um brilho de céu no alto, que some no fundo da tela.
        experimental_backgroundImage: `radial-gradient(130% 70% at 50% 0%, ${theme.backgroundSelected} 0%, ${theme.background} 75%)`,
      }}>
      <Svg
        width="100%"
        height={altura}
        viewBox={`0 0 100 ${altura || 1}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute' }}
        accessible={false}
        importantForAccessibility="no-hide-descendants">
        {POEIRA.map(([px, py], i) => (
          <Path
            key={`p${i}`}
            d={`M${px} ${py * altura} h0.01`}
            stroke={theme.textSecondary}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.35}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {fios.map((f, i) => (
          <Path
            key={i}
            d={f.d}
            stroke={f.aceso ? theme.accent : theme.accentSoft}
            strokeWidth={f.aceso ? 1.2 : 0.8}
            opacity={f.aceso ? 0.8 : 0.45}
            fill="none"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </Svg>

      {faixas.map((f) => (
        <ThemedText
          key={f.nome}
          accessibilityRole="header"
          themeColor="textSecondary"
          // Largura explícita: o Android media o itálico como texto reto e cortava o nome.
          style={{ position: 'absolute', top: f.y + Spacing.one, left: '4%', width: '90%', fontFamily: FontFamily.display, fontStyle: 'italic', fontSize: 14 }}>
          {f.nome}
        </ThemedText>
      ))}

      {estrelas.map(({ desejo, x, y: topo, largura }) => (
        <Estrela
          key={desejo.id}
          desejo={desejo}
          x={x}
          y={topo}
          largura={largura}
          aceso={acesos.has(desejo.id)}
          achado={procurando && acesos.has(desejo.id)}
          cintila={desejo.id === quemCintila}
        />
      ))}
    </View>
  );
}

const DESENHO_DA_ESTRELA = 'M6 0.6 L7.3 4.6 L11.4 4.7 L8.1 7.2 L9.3 11.2 L6 8.8 L2.7 11.2 L3.9 7.2 L0.6 4.7 L4.7 4.6 Z';

type EstrelaProps = { desejo: Experiencia; x: number; y: number; largura: number; aceso: boolean; achado: boolean; cintila: boolean };

function Estrela({ desejo, x, y, largura, aceso, achado, cintila }: EstrelaProps) {
  const theme = useTheme();
  const semData = desejo.referencia.precisao === 'sem_data';
  const quando = descreverReferencia(desejo.referencia);
  const detalhes = [quando, desejo.local].filter(Boolean).join(' · ');
  const brilho = useSharedValue(1);
  const menosMovimento = useReducedMotion();

  useEffect(() => {
    if (!cintila || menosMovimento) return;
    // Uma piscada lenta de vez em quando: viva, sem chamar atenção.
    brilho.set(withRepeat(withDelay(4200, withSequence(withTiming(0.3, { duration: 500 }), withTiming(1, { duration: 700 }))), -1));
  }, [cintila, menosMovimento, brilho]);
  const estiloDoBrilho = useAnimatedStyle(() => ({ opacity: brilho.get() }));

  const cor = achado ? theme.accent : semData ? theme.textSecondary : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detalhes ? `${desejo.titulo}, ${detalhes}` : desejo.titulo}
      onPress={() => router.push({ pathname: '/experiencia/[id]', params: { id: desejo.id } })}
      hitSlop={6}
      // Apagada pelo filtro ou pela busca: fica como contexto no céu, sem ser anunciada.
      importantForAccessibility={aceso ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!aceso}
      style={({ pressed }) => ({
        position: 'absolute',
        left: `${x}%`,
        top: y,
        width: `${largura}%`,
        flexDirection: 'row',
        gap: Spacing.two,
        opacity: aceso ? (pressed ? 0.6 : 1) : 0.2,
      })}>
      <Animated.View style={[{ marginTop: 3 }, estiloDoBrilho]}>
        <Svg width={13} height={13} viewBox="0 0 12 12">
          <Path d={DESENHO_DA_ESTRELA} fill={cor} />
        </Svg>
      </Animated.View>
      <View style={{ flex: 1, gap: 1 }}>
        <ThemedText
          numberOfLines={2}
          style={{
            fontFamily: FontFamily.display,
            fontStyle: semData ? 'italic' : 'normal',
            fontSize: 15,
            lineHeight: 19,
            color: achado ? theme.accent : semData ? theme.textSecondary : theme.text,
          }}>
          {desejo.titulo}
        </ThemedText>
        {detalhes ? (
          <ThemedText numberOfLines={1} themeColor="textSecondary" style={{ fontFamily: FontFamily.display, fontStyle: 'italic', fontSize: 12 }}>
            {detalhes}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}
