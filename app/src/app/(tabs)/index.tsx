import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useSessao } from '@/hooks/use-sessao';
import { useTheme } from '@/hooks/use-theme';

export default function Inicio() {
  const theme = useTheme();
  const { perfil } = useSessao();

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Laço"
        title="Vamos construir isso juntos."
        description="Experiências a dois, do desejo à memória, guardadas num só lugar."
      />

      {perfil ? (
        <View style={{ gap: Spacing.one, marginBottom: Spacing.four }}>
          <ThemedText type="subtitle" style={{ fontSize: 22, lineHeight: 30 }}>
            {perfil.companheiro_nome ? `${perfil.nome} & ${perfil.companheiro_nome}` : perfil.nome}
          </ThemedText>
          {!perfil.companheiro_vinculado && perfil.companheiro_nome ? (
            <ThemedText type="small" themeColor="textSecondary">
              {perfil.companheiro_nome} ainda não entrou no Laço. Enquanto isso, o app é todo seu.
            </ThemedText>
          ) : null}
        </View>
      ) : null}

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
          Comecem por uma ideia. Só o título é preciso; o resto vem depois, no tempo de vocês.
        </ThemedText>
        <View style={{ marginTop: Spacing.two }}>
          <Button label="Criar uma experiência" onPress={() => router.push('/criar')} />
        </View>
      </View>

      <View style={{ marginTop: Spacing.five }}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={{ letterSpacing: 1 }}>
          POR ONDE SEGUIR
        </ThemedText>
        <Atalho
          titulo="Desejos"
          descricao="Tudo o que queremos viver."
          onPress={() => router.push('/desejos')}
        />
        <Atalho
          titulo="Nossa História"
          descricao="As memórias que vamos guardar."
          onPress={() => router.push('/nossa-historia')}
        />
      </View>

      <View style={{ marginTop: Spacing.four, alignItems: 'flex-start' }}>
        <Button label="Ajustes" variant="text" onPress={() => router.push('/ajustes')} />
      </View>
    </Screen>
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
