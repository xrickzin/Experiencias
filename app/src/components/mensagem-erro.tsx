import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Erro com ícone e texto: nunca comunicado só pela cor. */
export function MensagemErro({ children }: { children: string }) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: theme.error,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ThemedText type="smallBold" themeColor="error" style={{ fontSize: 12, lineHeight: 16 }}>
          !
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="error" style={{ flex: 1 }}>
        {children}
      </ThemedText>
    </View>
  );
}
