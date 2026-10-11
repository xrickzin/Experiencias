import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { MensagemErro } from '@/components/mensagem-erro';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  /** Ação curta ao lado do rótulo, como "Mostrar" em campos de senha. */
  action?: { label: string; onPress: () => void };
};

/** Erro e foco mudam a espessura da borda e o erro aparece também como texto, não só como cor. */
export function TextField({ label, error, action, onFocus, onBlur, ...rest }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.error : focused ? theme.focus : theme.outline;

  return (
    <View style={{ gap: Spacing.two }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={12}
            onPress={action.onPress}>
            <ThemedText type="smallBold" style={{ textDecorationLine: 'underline' }}>
              {action.label}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={{
          minHeight: 52,
          paddingHorizontal: Spacing.three,
          paddingVertical: 14,
          borderRadius: Radius.field,
          borderWidth: error || focused ? 2 : 1,
          borderColor,
          backgroundColor: theme.backgroundElement,
          color: theme.text,
          fontFamily: FontFamily.body,
          fontSize: 16,
        }}
        {...rest}
      />
      {error ? <MensagemErro>{error}</MensagemErro> : null}
    </View>
  );
}
