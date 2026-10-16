import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * O conteúdo de um Modal com campos (editar um link, uma observação, dizer quando viveram): centrado
 * e rolável. No Android, de ponta a ponta, fica acima do teclado, como em `Screen`.
 */
export function FolhaDeEdicao({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'android' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three }}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
