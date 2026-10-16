import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { BarraDeAbas } from '@/components/barra-de-abas';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// A altura padrão da barra (49 pt) é menor que o círculo; a barra recorta o que passa dela.
// Por isso a altura do conteúdo é definida aqui e o círculo cabe com folga dentro dela.
const ALTURA_CONTEUDO_BARRA = 72;
const TAMANHO_BOTAO_CRIAR = 48;

/**
 * Ação central: não é uma aba com conteúdo. Oferece as duas formas de criar (navigation.md):
 * um desejo ou uma memória de algo vivido antes do aplicativo.
 */
function CriarExperienciaButton() {
  const theme = useTheme();
  const [escolhendo, setEscolhendo] = useState(false);
  // O modal desenha por baixo da barra de navegação do Android: a folha sobe acima dela.
  const { bottom } = useSafeAreaInsets();

  function ir(destino: '/criar' | '/criar?tipo=memoria') {
    setEscolhendo(false);
    router.push(destino);
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Modal
        testID="escolha-de-criacao"
        visible={escolhendo}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setEscolhendo(false)}>
        <View
          accessibilityViewIsModal
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            padding: Spacing.four,
            paddingBottom: Spacing.four + bottom,
            backgroundColor: 'rgba(43, 39, 36, 0.55)',
          }}>
          <Pressable
            accessibilityLabel="Fechar"
            accessibilityRole="button"
            onPress={() => setEscolhendo(false)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              alignSelf: 'center',
              gap: Spacing.two,
              padding: Spacing.four,
              borderRadius: Radius.button,
              backgroundColor: theme.background,
              borderWidth: 1,
              borderColor: theme.border,
            }}>
            <ThemedText type="subtitle" style={{ fontSize: 24, lineHeight: 32 }} accessibilityRole="header">
              O que vocês querem guardar?
            </ThemedText>
            <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
              <Button label="Criar um desejo" onPress={() => ir('/criar')} />
              <Button label="Registrar uma memória" variant="secondary" onPress={() => ir('/criar?tipo=memoria')} />
              <Button label="Cancelar" variant="text" onPress={() => setEscolhendo(false)} />
            </View>
          </View>
        </View>
      </Modal>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Criar experiência"
        onPress={() => setEscolhendo(true)}
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

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BarraDeAbas {...props} altura={ALTURA_CONTEUDO_BARRA} centro={<CriarExperienciaButton />} />}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="desejos" options={{ title: 'Desejos' }} />
      <Tabs.Screen name="novo" options={{ title: 'Criar' }} />
      <Tabs.Screen name="nossa-historia" options={{ title: 'Nossa História' }} />
    </Tabs>
  );
}
