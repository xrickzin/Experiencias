import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  texto: string;
  escolhida: boolean;
  onPress: () => void;
  /** `radio` numa escolha única; `checkbox` quando dá para marcar várias; `button` para uma ação ("+ Nova categoria"). */
  papel: 'radio' | 'checkbox' | 'button';
  /** Na voz do álbum (o criar do desejo): palavra solta, sem caixa; a escolhida ganha o fio embaixo. */
  voz?: boolean;
};

/** Uma opção em botão. A escolhida tem borda e fundo, não só cor. */
export function Chip({ texto, escolhida, onPress, papel, voz = false }: ChipProps) {
  const theme = useTheme();
  if (voz) {
    return (
      <Pressable
        accessibilityRole={papel}
        accessibilityLabel={texto}
        accessibilityState={papel === 'button' ? undefined : { checked: escolhida }}
        onPress={onPress}
        style={({ pressed }) => ({ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
        <PalavraComFio texto={texto} escolhida={escolhida} />
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole={papel}
      accessibilityLabel={texto}
      accessibilityState={papel === 'button' ? undefined : { checked: escolhida }}
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

/** Uma palavra na voz do álbum; a escolhida ganha o fio embaixo (numa View: o Android nem sempre desenha borda em Text). */
export function PalavraComFio({ texto, escolhida }: { texto: string; escolhida: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ paddingBottom: 2, borderBottomWidth: 1.5, borderBottomColor: escolhida ? theme.accent : 'transparent' }}>
      <ThemedText themeColor={escolhida ? 'text' : 'textSecondary'} style={{ fontFamily: FontFamily.voz, fontSize: 16 }}>
        {texto}
      </ThemedText>
    </View>
  );
}

/** Um "·" entre as palavras na voz do álbum: sem caixa, é o que mostra onde uma opção termina. */
export function Entre({ children, ligado = true }: { children: ReactNode; ligado?: boolean }) {
  const theme = useTheme();
  if (!ligado) return <>{children}</>;
  return Children.toArray(children)
    .filter(Boolean)
    .map((filho, i) => (
      <Fragment key={i}>
        {i ? (
          <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ minHeight: 44, justifyContent: 'center' }}>
            <ThemedText style={{ color: theme.outline }}>·</ThemedText>
          </View>
        ) : null}
        {filho}
      </Fragment>
    ));
}

/** A linha de botões que quebra quando não cabe. */
export function Grupo({ rotulo, papel, voz = false, children }: { rotulo: string; papel: 'radiogroup' | 'list'; voz?: boolean; children: ReactNode }) {
  return (
    <View accessibilityRole={papel} accessibilityLabel={rotulo} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
      <Entre ligado={voz}>{children}</Entre>
    </View>
  );
}

type OpcoesProps<T extends string> = {
  rotulo: string;
  opcoes: { valor: T; rotulo: string }[];
  atual: T;
  onChange: (valor: T) => void;
  voz?: boolean;
};

/** Escolha única em botões (dia e período, tema, tamanho). */
export function Opcoes<T extends string>({ rotulo, opcoes, atual, onChange, voz }: OpcoesProps<T>) {
  return (
    <Grupo rotulo={rotulo} papel="radiogroup" voz={voz}>
      {opcoes.map(({ valor, rotulo: texto }) => (
        <Chip key={valor} texto={texto} escolhida={valor === atual} papel="radio" voz={voz} onPress={() => onChange(valor)} />
      ))}
    </Grupo>
  );
}
