import { View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        gap: Spacing.three,
        paddingTop: Spacing.four,
        borderTopWidth: 1,
        borderTopColor: theme.border,
      }}>
      <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 34 }}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{description}</ThemedText>
      {actionLabel && onAction ? (
        <View style={{ marginTop: Spacing.two }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
