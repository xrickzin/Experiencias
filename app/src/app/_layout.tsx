import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { TelaAviso } from '@/components/tela-aviso';
import { FontFamily } from '@/constants/theme';
import { ExperienciasProvider } from '@/hooks/use-experiencias';
import { SessaoProvider, useSessao } from '@/hooks/use-sessao';
import { useTheme } from '@/hooks/use-theme';
import { aplicarTema, lerPreferenciaDeTema } from '@/services/tema';

SplashScreen.preventAutoHideAsync();

// O tema de navegação padrão tem fundo cinza; aqui ele usa os tokens do Laço, no tema do sistema.
function useTemaDeNavegacao() {
  const escuro = useColorScheme() === 'dark';
  const theme = useTheme();
  const base = escuro ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.text,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
    },
  };
}

export default function RootLayout() {
  const navigationTheme = useTemaDeNavegacao();
  // O tema escolhido em Ajustes vale desde a abertura, sem piscar no outro tema.
  const [temaPronto, setTemaPronto] = useState(false);
  useEffect(() => {
    void lerPreferenciaDeTema().then((preferencia) => {
      aplicarTema(preferencia);
      setTemaPronto(true);
    });
  }, []);
  const [fontsLoaded, fontError] = useFonts({
    [FontFamily.display]: require('@/assets/fonts/Fraunces-SemiBold.ttf'),
    [FontFamily.body]: require('@/assets/fonts/Figtree-Medium.ttf'),
    [FontFamily.bodyStrong]: require('@/assets/fonts/Figtree-SemiBold.ttf'),
  });

  // Se as fontes falharem, o app abre mesmo assim e o sistema usa a fonte padrão no lugar.
  if ((!fontsLoaded && !fontError) || !temaPronto) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      {/* Ícones das barras do sistema acompanham o tema (claros no escuro, escuros no claro). */}
      <StatusBar style="auto" />
      <NavigationBar style="auto" />
      <SessaoProvider>
        <ExperienciasProvider>
          <Navegacao />
        </ExperienciasProvider>
      </SessaoProvider>
    </ThemeProvider>
  );
}

function Navegacao() {
  const { estado, acessoLiberado, atualizar } = useSessao();

  // A abertura só some quando as fontes estão prontas e a sessão foi verificada.
  useEffect(() => {
    if (estado !== 'carregando') {
      SplashScreen.hideAsync();
    }
  }, [estado]);

  if (estado === 'carregando') {
    return null;
  }

  if (estado === 'sem-configuracao') {
    return (
      <TelaAviso
        eyebrow="Laço"
        title="Falta conectar ao servidor"
        description="Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY em app/.env.local e reinicie o app."
      />
    );
  }

  if (estado === 'erro') {
    return (
      <TelaAviso
        eyebrow="Laço"
        title="Não foi possível conectar"
        description="Verifique sua internet. Sua sessão continua guardada neste aparelho."
        actionLabel="Tentar de novo"
        onAction={() => {
          atualizar();
        }}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={acessoLiberado}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="criar" options={{ presentation: 'modal' }} />
        <Stack.Screen name="experiencia/[id]" />
        <Stack.Screen name="lista/[tipo]" />
        <Stack.Screen name="ajustes" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!acessoLiberado}>
        <Stack.Screen name="entrada" />
      </Stack.Protected>
      {/* Link de recuperação de senha: acessível com ou sem sessão. Precisa ficar por último: quando
          a sessão muda, a navegação cai na primeira tela disponível, que deve ser Início ou a entrada. */}
      <Stack.Screen name="redefinir-senha" />
    </Stack>
  );
}
