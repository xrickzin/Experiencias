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
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Experiencia } from '@/services/experiencias';
import { descreverCurto, descreverReferencia } from '@/services/referencia-temporal';

// "Algum dia", e não "Um dia": a duração "Um dia" usa as mesmas palavras.
export type Horizonte = 'Em breve' | 'Algum dia' | 'Sem pressa';
export const HORIZONTES: Horizonte[] = ['Em breve', 'Algum dia', 'Sem pressa'];
const DIAS_EM_BREVE = 90;

/**
 * Quão perto está um desejo: com data nos próximos três meses (ou já passada), "Em breve"; com data
 * mais longe, "Algum dia"; sem data, "Sem pressa". Só apresentação: não muda o desejo.
 */
export function horizonteDe(desejo: Experiencia, hoje: Date): Horizonte {
  if (desejo.referencia.precisao === 'sem_data' || !desejo.referencia.inicio) return 'Sem pressa';
  const dias = (Date.parse(`${desejo.referencia.inicio}T00:00:00`) - hoje.getTime()) / 86_400_000;
  return dias <= DIAS_EM_BREVE ? 'Em breve' : 'Algum dia';
}

const LINHA = 92; // altura de cada par de estrelas: título e detalhe em até 2 linhas cada, a 1,2x
const DEGRAU = 34; // a estrela da direita fica um pouco abaixo da da esquerda
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
  /** A estrela que acabou de nascer (voltando da criação): é ela que cintila. */
  nova?: string;
};

/**
 * O céu de desejos: cada desejo é uma estrela com o título ao lado; o fio liga os desejos da mesma
 * categoria, como constelações. Em cima, o que está perto; embaixo, o que é sem pressa. Tocar numa
 * estrela abre o desejo. Uma estrela cintila de vez em quando (nunca com menos movimento pedido).
 */
export function CeuDeDesejos({ porHorizonte, acesos, nova }: Props) {
  const theme = useTheme();
  const estrelas: { desejo: Experiencia; horizonte: Horizonte; x: number; y: number; largura: number }[] = [];
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
      // Colunas que não se tocam: a esquerda termina antes de 49%, a direita começa depois de 53%.
      const x = sozinha ? 6 + sorte(desejo.id) * 10 : (direita ? 53 : 3) + sorte(desejo.id) * 3;
      const largura = sozinha ? 80 : 43;
      estrelas.push({ desejo, horizonte: nome, x, y: y + TOPO_DA_FAIXA + Math.floor(i / 2) * LINHA + (direita ? DEGRAU : 0), largura });
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

  const quemCintila = nova && estrelas.some((e) => e.desejo.id === nova) ? nova : estrelas.find((e) => acesos.has(e.desejo.id))?.desejo.id;

  return (
    // O céu sangra até as bordas da tela (sem cantos de cartão); as estrelas ficam dentro da margem.
    <View
      style={{
        height: altura,
        marginHorizontal: -Spacing.four,
        // Um brilho de céu no alto, que some no fundo da tela.
        experimental_backgroundImage: `radial-gradient(130% 70% at 50% 0%, ${theme.backgroundSelected} 0%, ${theme.background} 75%)`,
      }}>
      {/* A borda de cima esmaece no fundo da tela: o céu nasce sem emenda reta. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 72,
          experimental_backgroundImage: `linear-gradient(to bottom, ${theme.background}, transparent)`,
        }}
      />
      <View style={{ flex: 1, marginHorizontal: Spacing.three }}>
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
            // Discreto o bastante para não brigar com os títulos que ele atravessa.
            opacity={f.aceso ? 0.55 : 0.4}
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
          maxFontSizeMultiplier={1.2}
          style={{ position: 'absolute', top: f.y + Spacing.one, left: '4%', fontFamily: FontFamily.voz, fontSize: 14 }}>
          {f.nome}
        </ThemedText>
      ))}

      {/* Vazio, só a frase; as ideias para começar ficam logo abaixo do céu. */}
      {estrelas.length ? null : (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 16, textAlign: 'center' }}>
            O céu de vocês ainda está limpo.
          </ThemedText>
        </View>
      )}

      {estrelas.map(({ desejo, horizonte, x, y: topo, largura }) => (
        <Estrela
          key={desejo.id}
          desejo={desejo}
          horizonte={horizonte}
          x={x}
          y={topo}
          largura={largura}
          aceso={acesos.has(desejo.id)}
          cintila={desejo.id === quemCintila}
          chegando={desejo.id === nova}
        />
      ))}
      </View>
    </View>
  );
}

// O quanto o desejo está perto aparece no brilho da estrela, não no título: todo desejo merece ser lido.
const ESTRELA: Record<Horizonte, { tamanho: number; apagada: boolean }> = {
  'Em breve': { tamanho: 13, apagada: false },
  'Algum dia': { tamanho: 11, apagada: false },
  'Sem pressa': { tamanho: 9, apagada: true },
};

const DESENHO_DA_ESTRELA = 'M6 0.6 L7.3 4.6 L11.4 4.7 L8.1 7.2 L9.3 11.2 L6 8.8 L2.7 11.2 L3.9 7.2 L0.6 4.7 L4.7 4.6 Z';

type EstrelaProps = { desejo: Experiencia; horizonte: Horizonte; x: number; y: number; largura: number; aceso: boolean; cintila: boolean; chegando: boolean };

function Estrela({ desejo, horizonte, x, y, largura, aceso, cintila, chegando }: EstrelaProps) {
  const theme = useTheme();
  // Na tela, a data curta ("12 dez."), para o local caber; o leitor de tela ouve a data inteira.
  const detalhes = [descreverCurto(desejo.referencia, new Date()), desejo.local].filter(Boolean).join(' · ');
  const detalhesPorExtenso = [descreverReferencia(desejo.referencia), desejo.local].filter(Boolean).join(' · ');
  const brilho = useSharedValue(1);
  const menosMovimento = useReducedMotion();

  useEffect(() => {
    if (!cintila || menosMovimento) return;
    // Uma piscada lenta de vez em quando: viva, sem chamar atenção. A estrela que acabou de chegar
    // pisca logo, para a chegada ser vista.
    const piscada = () => withSequence(withTiming(0.3, { duration: 500 }), withTiming(1, { duration: 700 }));
    const sempre = withRepeat(withDelay(4200, piscada()), -1);
    brilho.set(chegando ? withSequence(withDelay(300, piscada()), sempre) : sempre);
  }, [cintila, chegando, menosMovimento, brilho]);
  const estiloDoBrilho = useAnimatedStyle(() => ({ opacity: brilho.get() }));

  // A recém-chegada brilha como as de perto, onde quer que caia.
  const { tamanho, apagada } = ESTRELA[chegando ? 'Em breve' : horizonte];
  const cor = apagada ? theme.textSecondary : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detalhesPorExtenso ? `${desejo.titulo}, ${detalhesPorExtenso}` : desejo.titulo}
      onPress={() => router.push({ pathname: '/experiencia/[id]', params: { id: desejo.id } })}
      hitSlop={8}
      // Apagada pelo filtro ou pela busca: fica como contexto no céu, sem ser anunciada nem tocada.
      disabled={!aceso}
      importantForAccessibility={aceso ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!aceso}
      style={({ pressed }) => ({
        position: 'absolute',
        left: `${x}%`,
        top: y,
        width: `${largura}%`,
        minHeight: 32,
        flexDirection: 'row',
        gap: Spacing.two,
        opacity: aceso ? (pressed ? 0.6 : 1) : 0.2,
      })}>
      {/* Largura fixa: os títulos alinham, seja qual for o tamanho da estrela. */}
      <Animated.View style={[{ width: 13, marginTop: 3 + (13 - tamanho) / 2, alignItems: 'center' }, estiloDoBrilho]}>
        <Svg width={tamanho} height={tamanho} viewBox="0 0 12 12">
          <Path d={DESENHO_DA_ESTRELA} fill={cor} />
        </Svg>
      </Animated.View>
      <View style={{ flex: 1, gap: 1 }}>
        <ThemedText
          numberOfLines={2}
          // As linhas do céu são medidas: a fonte cresce até 1,2x sem invadir a estrela de baixo.
          maxFontSizeMultiplier={1.2}
          style={{ fontFamily: FontFamily.display, fontSize: 15, lineHeight: 19, color: theme.text }}>
          {desejo.titulo}
        </ThemedText>
        {detalhes ? (
          <ThemedText numberOfLines={2} maxFontSizeMultiplier={1.2} themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 13, lineHeight: 17 }}>
            {detalhes}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}
