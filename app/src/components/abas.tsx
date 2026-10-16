import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AbasProps<T extends string> = {
  abas: { valor: T; rotulo: string }[];
  atual: T;
  onChange: (valor: T) => void;
};

/**
 * Abas dentro de uma tela. A ativa tem texto em negrito e o fio vermelho embaixo (o mesmo gesto da
 * barra de navegação): a seleção não depende só da cor.
 */
export function Abas<T extends string>({ abas, atual, onChange }: AbasProps<T>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: Spacing.four }}>
      {abas.map(({ valor, rotulo }) => {
        const ativa = valor === atual;
        return (
          <Pressable
            key={valor}
            accessibilityRole="tab"
            accessibilityLabel={rotulo}
            accessibilityState={{ selected: ativa }}
            onPress={() => onChange(valor)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: -1,
              borderBottomWidth: ativa ? 2 : 0,
              borderBottomColor: theme.accent,
              opacity: pressed ? 0.7 : 1,
            })}>
            <ThemedText type={ativa ? 'smallBold' : 'small'} themeColor={ativa ? 'text' : 'textSecondary'} style={{ fontSize: 16 }}>
              {rotulo}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
