import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Moldura } from '@/components/moldura';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Experiencia } from '@/services/experiencias';
import type { MesDaHistoria } from '@/services/nossa-historia';
import { descreverReferencia } from '@/services/referencia-temporal';

type Props = {
  mes: MesDaHistoria;
  /** URLs assinadas das fotos de destaque, pelo caminho; ausente enquanto carrega. */
  urls: Map<string, string>;
};

/**
 * Um mês de Nossa História como página de álbum (ux/our-story.md): a memória mais recente em foto
 * grande, com o título sobre ela, e as outras em duas colunas. As só com mês/ano ficam no fim, sob
 * "Em algum dia de {mês}" (ADR 031).
 */
export function PaginaDoAlbum({ mes, urls }: Props) {
  const theme = useTheme();
  const [nome, ano] = mes.rotulo.split(' de ');
  const [capa, ...resto] = mes.comDia;
  const url = (m: Experiencia) => (m.fotoDestaque ? (urls.get(m.fotoDestaque.caminho) ?? null) : undefined);

  return (
    <View style={{ gap: Spacing.three }}>
      {/* Cada mês é um capítulo: o mês na voz editorial, o ano ao lado, mais baixo. */}
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={mes.rotulo}
        style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two }}>
        <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 34 }}>
          {nome}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ letterSpacing: 2 }}>
          {ano}
        </ThemedText>
      </View>

      {capa ? <Capa experiencia={capa} url={url(capa)} /> : null}
      {resto.length ? <Grade memorias={resto} url={url} /> : null}

      {mes.semDia.length ? (
        <View style={{ gap: Spacing.two }}>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: 'italic' }}>
            {`Em algum dia de ${nome.toLowerCase()}`}
          </ThemedText>
          <Grade memorias={mes.semDia} url={url} semQuando />
        </View>
      ) : null}

      <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ height: 1, backgroundColor: theme.border }} />
    </View>
  );
}

/** Abre a memória; o rótulo diz o título, quando e onde, como nas listas. */
function Cartao({ experiencia, children }: { experiencia: Experiencia; children: React.ReactNode }) {
  const detalhes = [descreverReferencia(experiencia.referencia), experiencia.local].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detalhes ? `${experiencia.titulo}, ${detalhes}` : experiencia.titulo}
      onPress={() => router.push({ pathname: '/experiencia/[id]', params: { id: experiencia.id } })}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.8 : 1 })}>
      {children}
    </Pressable>
  );
}

/**
 * A foto de destaque. `url` indefinida: a memória não tem destaque, e fica o papel com o fio. Nula:
 * ainda carrega, e o espaço já existe para a página não pular.
 */
function Foto({ experiencia, url, proporcao }: { experiencia: Experiencia; url: string | null | undefined; proporcao: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: '100%',
        aspectRatio: proporcao,
        overflow: 'hidden',
        backgroundColor: theme.backgroundSelected,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {url ? (
        <Image
          testID="historia-foto"
          source={{ uri: url, cacheKey: `capa:${experiencia.fotoDestaque?.caminho}` }}
          contentFit="cover"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          transition={200}
          accessible={false}
        />
      ) : (
        <View style={{ width: 48, height: 2, backgroundColor: theme.accent }} />
      )}
    </View>
  );
}

/** A mais recente do mês: uma foto grande colada no papel, com o título e quando foi escritos no pé. */
function Capa({ experiencia, url }: { experiencia: Experiencia; url: string | null | undefined }) {
  const quando = [descreverReferencia(experiencia.referencia), experiencia.local].filter(Boolean).join(' · ');
  return (
    <Cartao experiencia={experiencia}>
      <Moldura>
        <Foto experiencia={experiencia} url={url} proporcao={4 / 3} />
        <View style={{ gap: Spacing.half, paddingTop: Spacing.three, paddingBottom: Spacing.one }}>
          <ThemedText style={{ fontFamily: FontFamily.display, fontSize: 24, lineHeight: 30 }} numberOfLines={2}>
            {experiencia.titulo}
          </ThemedText>
          {quando ? (
            <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.display, fontStyle: 'italic' }} numberOfLines={1}>
              {quando}
            </ThemedText>
          ) : null}
        </View>
      </Moldura>
    </Cartao>
  );
}

/** As outras memórias do mês, duas por linha: foto quadrada, título e data embaixo. */
function Grade({
  memorias,
  url,
  semQuando = false,
}: {
  memorias: Experiencia[];
  url: (m: Experiencia) => string | null | undefined;
  /** Sob "Em algum dia de {mês}": o mês já foi dito, fica só o local. */
  semQuando?: boolean;
}) {
  const pares: Experiencia[][] = [];
  for (let i = 0; i < memorias.length; i += 2) pares.push(memorias.slice(i, i + 2));
  return (
    <View style={{ gap: Spacing.three }}>
      {pares.map((par) => (
        <View key={par[0].id} style={{ flexDirection: 'row', gap: Spacing.three }}>
          {par.map((m) => {
            const detalhe = semQuando ? m.local : descreverReferencia(m.referencia);
            return (
              <Cartao key={m.id} experiencia={m}>
                <View style={{ gap: Spacing.two }}>
                  <Moldura tamanho="pequena">
                    <Foto experiencia={m} url={url(m)} proporcao={1} />
                  </Moldura>
                  <View style={{ gap: Spacing.half }}>
                    {/* Três linhas: títulos de memória costumam ser frases, e cortados perdem o sentido. */}
                    <ThemedText type="subtitle" style={{ fontSize: 17, lineHeight: 23 }} numberOfLines={3}>
                      {m.titulo}
                    </ThemedText>
                    {detalhe ? (
                      <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.display, fontStyle: 'italic', fontSize: 14 }} numberOfLines={1}>
                        {detalhe}
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
              </Cartao>
            );
          })}
          {/* Sozinha na linha, a memória mantém a largura de meia página. */}
          {par.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}
