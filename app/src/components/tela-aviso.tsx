import { View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Spacing } from '@/constants/theme';

type TelaAvisoProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Tela cheia para estados que impedem o uso: sem conexão com o servidor, falta de configuração. */
export function TelaAviso({ eyebrow, title, description, actionLabel, onAction }: TelaAvisoProps) {
  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader eyebrow={eyebrow} title={title} description={description} />
      {actionLabel && onAction ? (
        <View style={{ marginTop: Spacing.two }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </Screen>
  );
}
