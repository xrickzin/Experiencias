import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// A altura padrão da barra (49 pt) é menor que o círculo; a barra recorta o que passa dela.
// Por isso a altura do conteúdo é definida aqui e o círculo cabe com folga dentro dela.
const ALTURA_CONTEUDO_BARRA = 64;
const TAMANHO_BOTAO_CRIAR = 48;

/** Ação central: abre a criação de uma experiência, não é uma aba com conteúdo. */
function CriarExperienciaButton() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Criar experiência"
        onPress={() => router.push('/criar')}
        style={({ pressed }) => ({
          width: TAMANHO_BOTAO_CRIAR,
          height: TAMANHO_BOTAO_CRIAR,
          borderRadius: TAMANHO_BOTAO_CRIAR / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.text,
          opacity: pressed ? 0.7 : 1,
        })}>
        <ThemedText
          themeColor="background"
          style={{ fontFamily: FontFamily.display, fontSize: 30, lineHeight: 34 }}>
          +
        </ThemedText>
      </Pressable>
    </View>
  );
}

/** Fio vermelho curto sobre o rótulo da aba ativa: a seleção não depende só da cor do texto. */
function tabIndicator(accent: string) {
  return function Indicator({ focused }: { focused: boolean }) {
    return (
      <View
        style={{ width: 20, height: 2, backgroundColor: focused ? accent : 'transparent' }}
      />
    );
  };
}

export default function TabsLayout() {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontFamily: FontFamily.bodyStrong, fontSize: 12 },
        tabBarIcon: tabIndicator(theme.accent),
        // A altura informada é a total: o conteúdo mais a área segura inferior (o padding é da própria barra).
        tabBarStyle: {
          height: ALTURA_CONTEUDO_BARRA + bottom,
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="desejos" options={{ title: 'Desejos' }} />
      <Tabs.Screen name="novo" options={{ title: 'Criar', tabBarButton: CriarExperienciaButton }} />
      <Tabs.Screen name="nossa-historia" options={{ title: 'Nossa História' }} />
    </Tabs>
  );
}
