import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MARGEM = { miniatura: Spacing.one, pequena: Spacing.two, retrato: Spacing.three } as const;

type Props = {
  /** Miniatura (grade de momentos), pequena (polaroides lado a lado) ou retrato (capa, foto aberta). */
  tamanho?: keyof typeof MARGEM;
  /** Graus. Só polaroides soltas giram; capa e grade ficam retas. */
  inclinacao?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * O papel do álbum em volta de uma foto: a mesma moldura em Nossa História inteira, do tamanho que
 * a foto pede. A sombra dá a sensação de foto colada; a miniatura, numa grade, dispensa.
 */
export function Moldura({ tamanho = 'retrato', inclinacao, style, children }: Props) {
  const theme = useTheme();
  const margem = MARGEM[tamanho];
  return (
    <View
      style={[
        {
          padding: margem,
          backgroundColor: theme.papel,
          borderWidth: 1,
          borderColor: theme.papelBorda,
          borderRadius: 2,
        },
        tamanho === 'miniatura'
          ? null
          : {
              shadowColor: '#000',
              shadowOpacity: 0.22,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            },
        inclinacao ? { transform: [{ rotate: `${inclinacao}deg` }] } : null,
        style,
      ]}>
      {children}
    </View>
  );
}
