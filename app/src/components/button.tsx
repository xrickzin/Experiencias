import { Pressable, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  /**
   * `destructive`: botão pastel que inicia uma ação irreversível (excluir, apagar, sair).
   * `destructiveConfirm`: o "Sim, excluir" cheio, só dentro da confirmação (ADR 036).
   */
  variant?: 'primary' | 'secondary' | 'text' | 'destructive' | 'destructiveConfirm';
  /** Impede novos toques e avisa que há uma operação em andamento. */
  loading?: boolean;
};

/** O botão primário é grafite: o vermelho do Laço não preenche botões. */
export function Button({ label, variant = 'primary', loading = false, disabled, ...rest }: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const text = variant === 'text';
  // Ação irreversível: pastel para começar, cheio para confirmar (padrão de mercado; ADR 036).
  const destructive = variant === 'destructive';
  const confirmar = variant === 'destructiveConfirm';
  const inativo = loading || Boolean(disabled);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inativo, busy: loading }}
      disabled={inativo}
      style={({ pressed }) => ({
        minHeight: text ? 44 : 52,
        // Sem borda, o botão de texto alinha com a margem do conteúdo, como um link.
        paddingHorizontal: text ? 0 : Spacing.four,
        borderRadius: Radius.button,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: primary
          ? theme.text
          : confirmar
            ? theme.destructive
            : destructive
              ? theme.destructiveSoft
              : 'transparent',
        borderWidth: primary || text || destructive || confirmar ? 0 : 1,
        borderColor: theme.outline,
        opacity: inativo ? 0.4 : pressed ? 0.7 : 1,
      })}
      {...rest}>
      <ThemedText
        type="smallBold"
        themeColor={primary || confirmar ? 'background' : destructive ? 'destructive' : 'text'}
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
