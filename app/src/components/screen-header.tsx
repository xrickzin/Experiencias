import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icone, type NomeDoIcone } from '@/components/icone';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Acao = { icon: NomeDoIcone; label: string; onPress: () => void };

type ScreenHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  /** Telas de detalhe: seta de voltar no topo, onde se procura a saída. */
  onBack?: () => void;
  /** Ação ao lado do título (ex.: Ajustes no Início). */
  action?: Acao;
};

/** Volta para onde a pessoa estava; aberta direto (link, app reaberto), vai para o Início. */
export function voltar() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Cabeçalho das telas. O fio vermelho curto no topo é a assinatura do Laço. */
export function ScreenHeader({ eyebrow, title, description, onBack, action }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: Spacing.two, marginBottom: Spacing.five }}>
      {onBack ? (
        <IconButton icon="voltar" label="Voltar" edge="left" onPress={onBack} />
      ) : null}
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={{ width: 32, height: 2, backgroundColor: theme.accent, marginBottom: Spacing.two }}
      />
      <ThemedText type="smallBold" themeColor="textSecondary" style={{ letterSpacing: 1 }}>
        {eyebrow.toUpperCase()}
      </ThemedText>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two }}>
        <ThemedText type="subtitle" accessibilityRole="header" style={{ flex: 1 }}>
          {title}
        </ThemedText>
        {action ? <IconButton {...action} edge="right" /> : null}
      </View>
      {description ? <ThemedText themeColor="textSecondary">{description}</ThemedText> : null}
    </View>
  );
}

/** Ícone tocável com área de 48 px e rótulo para o leitor de tela; o desenho alinha com a margem do conteúdo. */
function IconButton({ icon, label, onPress, edge }: Acao & { edge: 'left' | 'right' }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.one}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        [edge === 'left' ? 'marginLeft' : 'marginRight']: -Spacing.two,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
        backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
      })}>
      <Icone nome={icon} cor={theme.text} />
    </Pressable>
  );
}
