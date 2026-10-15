import { Pressable, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'text' | 'destructive';
  /** Impede novos toques e avisa que há uma operação em andamento. */
  loading?: boolean;
};

/** O botão primário é grafite: o vermelho do Laço não preenche botões. */
export function Button({ label, variant = 'primary', loading = false, disabled, ...rest }: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const text = variant === 'text';
  // Vermelho de ação irreversível: só dentro de uma confirmação, sempre com texto explícito.
  const destructive = variant === 'destructive';
  const inativo = loading || Boolean(disabled);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inativo, busy: loading }}
      disabled={inativo}
      style={({ pressed }) => ({
        minHeight: text ? 44 : 52,
        paddingHorizontal: Spacing.four,
        borderRadius: Radius.button,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary ? theme.text : 'transparent',
        borderWidth: primary || text ? 0 : 1,
        borderColor: destructive ? theme.destructive : theme.outline,
        opacity: inativo ? 0.4 : pressed ? 0.7 : 1,
      })}
      {...rest}>
      <ThemedText
        type="smallBold"
        themeColor={primary ? 'background' : destructive ? 'destructive' : 'text'}
        style={{
          fontSize: 16,
          lineHeight: 22,
          textDecorationLine: text ? 'underline' : 'none',
        }}>
        {loading ? 'Aguarde…' : label}
      </ThemedText>
    </Pressable>
  );
}
