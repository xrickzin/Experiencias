import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { CartaoVivendo } from '@/components/cartao-vivendo';
import { LinhaDaExperiencia } from '@/components/linha-da-experiencia';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useSessao } from '@/hooks/use-sessao';
import { useTheme } from '@/hooks/use-theme';
import { LIMITES, organizarInicio } from '@/services/inicio';

/**
 * Início responde "o que está acontecendo com a gente agora e o que vem pela frente?" (ADR 014):
 * Vivendo, depois as próximas com data, depois o que está em preparação; Desejos só como atalho.
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

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Laço"
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
        <Bloco titulo="VIVENDO AGORA" filete={false}>
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
        <Bloco titulo="NOSSO PRÓXIMO MOMENTO">
          {inicio.proximas.slice(0, LIMITES.proximas).map((e) => (
            <LinhaDaExperiencia key={e.id} experiencia={e} />
          ))}
          <VerMais total={inicio.proximas.length} limite={LIMITES.proximas} rotulo="Ver todos" tipo="proximas" />
        </Bloco>
      ) : null}

      {inicio.planejamentos.length > 0 ? (
        <Bloco titulo="ESTAMOS PREPARANDO">
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
          <ThemedText type="smallBold" themeColor="textSecondary" style={{ letterSpacing: 1 }}>
            PARA COMEÇAR
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
            <Button label="Criar uma experiência" onPress={() => router.push('/criar')} />
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: Spacing.five }}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={{ letterSpacing: 1 }}>
          POR ONDE SEGUIR
        </ThemedText>
        <Atalho
          titulo="Desejos"
          descricao={
            totalDeDesejos === 0
              ? 'Tudo o que queremos viver.'
              : `${totalDeDesejos} ${totalDeDesejos === 1 ? 'desejo' : 'desejos'} para viver juntos.`
          }
          onPress={() => router.push('/desejos')}
        />
        <Atalho
          titulo="Nossa História"
          descricao="As memórias que vamos guardar."
          onPress={() => router.push('/nossa-historia')}
        />
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
      <ThemedText type="smallBold" themeColor="textSecondary" style={{ letterSpacing: 1, marginBottom: Spacing.one }}>
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

type AtalhoProps = { titulo: string; descricao: string; onPress: () => void };

function Atalho({ titulo, descricao, onPress }: AtalhoProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${descricao}`}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.three,
        paddingVertical: Spacing.three,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
      })}>
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold" style={{ fontSize: 16, lineHeight: 22 }}>
          {titulo}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {descricao}
        </ThemedText>
      </View>
      <ThemedText themeColor="textSecondary">→</ThemedText>
    </Pressable>
  );
}

