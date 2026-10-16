import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  texto: string;
  escolhida: boolean;
  onPress: () => void;
  /** `radio` numa escolha única; `checkbox` quando dá para marcar várias. */
  papel: 'radio' | 'checkbox';
};

/** Uma opção em botão. A escolhida tem borda e fundo, não só cor. */
export function Chip({ texto, escolhida, onPress, papel }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={papel}
      accessibilityLabel={texto}
      accessibilityState={{ checked: escolhida }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.field,
        borderWidth: escolhida ? 2 : 1,
        borderColor: escolhida ? theme.text : theme.outline,
        backgroundColor: escolhida ? theme.backgroundSelected : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}>
      <ThemedText type={escolhida ? 'smallBold' : 'small'}>{texto}</ThemedText>
    </Pressable>
  );
}

/** A linha de botões que quebra quando não cabe. */
export function Grupo({ rotulo, papel, children }: { rotulo: string; papel: 'radiogroup' | 'list'; children: ReactNode }) {
  return (
    <View accessibilityRole={papel} accessibilityLabel={rotulo} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
      {children}
    </View>
  );
}

type OpcoesProps<T extends string> = {
  rotulo: string;
  opcoes: { valor: T; rotulo: string }[];
  atual: T;
  onChange: (valor: T) => void;
};

/** Escolha única em botões (dia e período, tema, tamanho). */
export function Opcoes<T extends string>({ rotulo, opcoes, atual, onChange }: OpcoesProps<T>) {
  return (
    <Grupo rotulo={rotulo} papel="radiogroup">
      {opcoes.map(({ valor, rotulo: texto }) => (
        <Chip key={valor} texto={texto} escolhida={valor === atual} papel="radio" onPress={() => onChange(valor)} />
      ))}
    </Grupo>
  );
}
