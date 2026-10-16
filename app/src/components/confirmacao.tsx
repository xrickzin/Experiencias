import { Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { MensagemErro } from '@/components/mensagem-erro';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ConfirmacaoProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Ação irreversível: o botão de confirmar usa a cor de destruição. */
  destructive?: boolean;
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Pop-up de confirmação do app (exclusões, sair da conta). Fica sobre a tela, escurece o fundo,
 * explica o efeito e põe a confirmação e o cancelamento em botões grandes, um sobre o outro.
 * O botão voltar do Android e o toque fora cancelam.
 */
export function Confirmacao({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmacaoProps) {
  const theme = useTheme();

  return (
    <Modal
      testID="confirmacao"
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={loading ? undefined : onCancel}>
      <View
        accessibilityViewIsModal
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: Spacing.four,
          backgroundColor: theme.scrim,
        }}>
        <Pressable
          accessibilityLabel="Fechar"
          accessibilityRole="button"
          disabled={loading}
          onPress={onCancel}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View
          accessibilityRole="alert"
          style={{
            width: '100%',
            maxWidth: 420,
            alignSelf: 'center',
            gap: Spacing.three,
            padding: Spacing.four,
            borderRadius: Radius.button,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
          <ThemedText type="subtitle" style={{ fontSize: 24, lineHeight: 32 }} accessibilityRole="header">
            {title}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{description}</ThemedText>
          {error ? <MensagemErro>{error}</MensagemErro> : null}
          <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
            <Button
              label={confirmLabel}
              variant={destructive ? 'destructiveConfirm' : 'primary'}
              loading={loading}
              onPress={onConfirm}
            />
            <Button label={cancelLabel} variant="secondary" disabled={loading} onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
