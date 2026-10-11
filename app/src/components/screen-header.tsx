import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

/** Cabeçalho das telas. O fio vermelho curto no topo é a assinatura do Laço. */
export function ScreenHeader({ eyebrow, title, description }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: Spacing.two, marginBottom: Spacing.five }}>
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={{ width: 32, height: 2, backgroundColor: theme.accent, marginBottom: Spacing.two }}
      />
      <ThemedText type="smallBold" themeColor="textSecondary" style={{ letterSpacing: 1 }}>
        {eyebrow.toUpperCase()}
      </ThemedText>
      <ThemedText type="subtitle" accessibilityRole="header">
        {title}
      </ThemedText>
      {description ? <ThemedText themeColor="textSecondary">{description}</ThemedText> : null}
    </View>
  );
}
