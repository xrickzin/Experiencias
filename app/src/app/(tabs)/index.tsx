import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { Image } from 'expo-image';

import { Button } from '@/components/button';
import { CartaoVivendo } from '@/components/cartao-vivendo';
import { LinhaDaExperiencia } from '@/components/linha-da-experiencia';
import { Moldura } from '@/components/moldura';
import { Retrato } from '@/components/retrato';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useSessao } from '@/hooks/use-sessao';
import { useTheme } from '@/hooks/use-theme';
import { useUrlAssinada } from '@/hooks/use-url-assinada';
import type { Experiencia } from '@/services/experiencias';
import { LIMITES, organizarInicio } from '@/services/inicio';
import { agruparPorMes } from '@/services/nossa-historia';
import { descreverReferencia } from '@/services/referencia-temporal';

/**
 * Início responde "o que está acontecendo com a gente agora e o que vem pela frente?" (ADR 014):
 * Vivendo, depois as próximas com data, depois o que está em preparação. No pé, a última página de
 * Nossa História e o caminho para o céu de desejos, na voz do álbum (docs/ux/album.md).
 */
export default function Inicio() {
  const theme = useTheme();
  const { perfil } = useSessao();
  const { experiencias, recarregar } = useExperiencias();

  // A outra pessoa pode ter mudado algo: relê quando Início aparece.
  useFocusEffect(
    useCallback(() => {
      void recarregar();
    }, [recarregar])
  );

  const inicio = organizarInicio(experiencias, new Date());
  const temAndamento = inicio.vivendo.length + inicio.todosOsPlanejamentos.length > 0;
  const { totalDeDesejos } = inicio;
  // A memória mais recente, a mesma que abre Nossa História.
  const primeiroMes = agruparPorMes(experiencias.filter((e) => e.estado === 'memoria'))[0];
  const ultimaMemoria = primeiroMes ? (primeiroMes.comDia[0] ?? primeiroMes.semDia[0]) : undefined;

  return (
    <Screen>
      <ScreenHeader
        antesDoTitulo={perfil ? <RetratosDoCasal /> : null}
        title={perfil?.companheiro_nome ? `${perfil.nome} & ${perfil.companheiro_nome}` : (perfil?.nome ?? 'Laço')}
        description={
          perfil && !perfil.companheiro_vinculado && perfil.companheiro_nome
            ? `${perfil.companheiro_nome} ainda não entrou no Laço. Enquanto isso, o app é todo seu.`
            : undefined
        }
        action={{
          icon: 'ajustes',
          label: 'Ajustes',
          onPress: () => router.push('/ajustes'),
        }}
      />

      {inicio.vivendo.length > 0 ? (
        <Bloco titulo="Vivendo agora" filete={false}>
          {/* A primeira em destaque, com a foto de destaque; as demais em formato compacto (ADR 027). */}
          <CartaoVivendo experiencia={inicio.vivendo[0]} />
          {inicio.vivendo.length > 1 ? (
            <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
              {inicio.vivendo.slice(1, LIMITES.vivendo).map((e) => (
                <LinhaDaExperiencia key={e.id} experiencia={e} />
              ))}
            </View>
          ) : null}
          <VerMais total={inicio.vivendo.length} limite={LIMITES.vivendo} rotulo="Ver todas" tipo="vivendo" />
        </Bloco>
      ) : null}

      {inicio.proximas.length > 0 ? (
        <Bloco titulo="Nosso próximo momento">
          {inicio.proximas.slice(0, LIMITES.proximas).map((e) => (
            <LinhaDaExperiencia key={e.id} experiencia={e} />
          ))}
          <VerMais total={inicio.proximas.length} limite={LIMITES.proximas} rotulo="Ver todos" tipo="proximas" />
        </Bloco>
      ) : null}

      {inicio.planejamentos.length > 0 ? (
        <Bloco titulo="Estamos preparando">
          {inicio.planejamentos.slice(0, LIMITES.planejamentos).map((e) => (
            <LinhaDaExperiencia key={e.id} experiencia={e} />
          ))}
        </Bloco>
      ) : null}

      {/* "Ver planejamentos": todos em Planejamento, com ou sem data (ADR 027). */}
      {inicio.todosOsPlanejamentos.length > LIMITES.planejamentos ||
      inicio.planejamentos.length > LIMITES.planejamentos ? (
        <View style={{ alignItems: 'flex-start', marginTop: -Spacing.three, marginBottom: Spacing.four }}>
          <Button label="Ver planejamentos" variant="text" onPress={() => irPara('planejamentos')} />
        </View>
      ) : null}

      {!temAndamento ? (
        <View
          style={{
            gap: Spacing.three,
            paddingVertical: Spacing.four,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.border,
          }}>
          <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz }}>
            Para começar
          </ThemedText>
          <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 34 }}>
            O que vocês querem viver?
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {totalDeDesejos > 0
              ? 'Quando decidirem tentar um desejo, comecem o planejamento dele e ele aparece aqui.'
              : 'Comecem por uma ideia, no tempo de vocês.'}
          </ThemedText>
          <View style={{ marginTop: Spacing.two }}>
            {/* O "+" da barra já cria; aqui, só um caminho discreto para quem não o viu. */}
            <Button label="Criar uma experiência" variant="text" onPress={() => router.push('/criar')} />
          </View>
        </View>
      ) : null}

      {/* Nada de repetir a barra de baixo: a história de vocês e o céu de desejos, como lugares. */}
      <View style={{ marginTop: Spacing.five, gap: Spacing.four }}>
        {ultimaMemoria ? <UltimaPagina memoria={ultimaMemoria} /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            totalDeDesejos === 0 ? 'Desejos. Comecem o céu de vocês.' : `Desejos. ${frasesDeDesejos(totalDeDesejos)}`
          }
          onPress={() => router.push('/desejos')}
          style={({ pressed }) => ({
            minHeight: 56,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.three,
            paddingVertical: Spacing.three,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.border,
            opacity: pressed ? 0.7 : 1,
          })}>
          <ThemedText style={{ flex: 1, fontFamily: FontFamily.voz, fontSize: 17 }}>
            {totalDeDesejos === 0 ? 'Comecem o céu de vocês' : frasesDeDesejos(totalDeDesejos)}
          </ThemedText>
          <ThemedText themeColor="textSecondary">→</ThemedText>
        </Pressable>
      </View>
    </Screen>
  );
}

const irPara = (tipo: 'vivendo' | 'proximas' | 'planejamentos') =>
  router.push({ pathname: '/lista/[tipo]', params: { tipo } });

function Bloco({
  titulo,
  children,
  filete = true,
}: {
  titulo: string;
  children: React.ReactNode;
  filete?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: Spacing.four }}>
      <ThemedText
        accessibilityRole="header"
        themeColor="textSecondary"
        style={{ fontFamily: FontFamily.voz, fontSize: 17, marginBottom: Spacing.one }}>
        {titulo}
      </ThemedText>
      <View style={filete ? { borderTopWidth: 1, borderTopColor: theme.border } : null}>{children}</View>
    </View>
  );
}

function VerMais({
  total,
  limite,
  rotulo,
  tipo,
}: {
  total: number;
  limite: number;
  rotulo: string;
  tipo: 'vivendo' | 'proximas';
}) {
  // O Início nunca esconde itens sem caminho de acesso (ADR 027).
  if (total <= limite) return null;
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <Button label={rotulo} variant="text" onPress={() => irPara(tipo)} />
    </View>
  );
}

const frasesDeDesejos = (n: number) => `${n} ${n === 1 ? 'desejo' : 'desejos'} no céu de vocês`;

/** Os dois retratos, um sobre o outro, ao lado de "Rick & Bia" (ADR 043). */
function RetratosDoCasal() {
  const { perfil } = useSessao();
  if (!perfil) return null;
  return (
    <View style={{ flexDirection: 'row' }} accessible={false}>
      <Retrato pessoa="eu" tamanho={40} />
      {perfil.companheiro_vinculado ? (
        <View style={{ marginLeft: -Spacing.three }}>
          <Retrato pessoa="outra" tamanho={40} />
        </View>
      ) : null}
    </View>
  );
}

/** A última página de Nossa História: a memória mais recente, colada no papel. Abre a memória. */
function UltimaPagina({ memoria }: { memoria: Experiencia }) {
  const theme = useTheme();
  const url = useUrlAssinada(memoria.fotoDestaque?.caminho ?? null);
  const quando = descreverReferencia(memoria.referencia);
  return (
    <View style={{ gap: Spacing.two }}>
      <ThemedText accessibilityRole="header" themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 17 }}>
        A última página da nossa história
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={quando ? `${memoria.titulo}, ${quando}` : memoria.titulo}
        onPress={() => router.push({ pathname: '/experiencia/[id]', params: { id: memoria.id } })}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
        <Moldura tamanho="pequena" style={{ flexDirection: 'row', gap: Spacing.three, alignItems: 'center' }}>
          <View style={{ width: 96, aspectRatio: 1, overflow: 'hidden', backgroundColor: theme.backgroundSelected, alignItems: 'center', justifyContent: 'center' }}>
            {url && memoria.fotoDestaque ? (
              <Image source={{ uri: url, cacheKey: `capa:${memoria.fotoDestaque.caminho}` }} contentFit="cover" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
            ) : (
              <View style={{ width: 28, height: 2, backgroundColor: theme.accent }} />
            )}
          </View>
          <View style={{ flex: 1, gap: Spacing.half, paddingRight: Spacing.two }}>
            <ThemedText style={{ fontFamily: FontFamily.display, fontSize: 19, lineHeight: 24 }} numberOfLines={2}>
              {memoria.titulo}
            </ThemedText>
            {quando ? (
              <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 14 }}>
                {quando}
              </ThemedText>
            ) : null}
          </View>
        </Moldura>
      </Pressable>
      <View style={{ alignItems: 'flex-start' }}>
        <Button label="Ver toda a nossa história" variant="text" onPress={() => router.push('/nossa-historia')} />
      </View>
    </View>
  );
}
