import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  /** Bordas protegidas pela área segura. As abas já cuidam da borda de baixo. */
  edges?: Edge[];
};

export function Screen({ children, edges = ['top'] }: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ padding: Spacing.four, paddingBottom: Spacing.six }}>
        <View style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
