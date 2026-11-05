import { useState } from 'react';
import { TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LinhaDeCadernoProps = {
  /** O nome para o leitor de tela ("Local", "Data"). */
  rotulo: string;
  /** Uma pergunta curta acima da linha ("Que dia?"), na voz do álbum. */
  pergunta?: string;
  exemplo: string;
  valor: string;
  limite: number;
  varias?: boolean;
  autoFocus?: boolean;
  teclado?: KeyboardTypeOptions;
  onChange: (v: string) => void;
};

/** Um campo como linha de caderno: sem caixa, em Fraunces, sublinhado; o fio acende com o foco. */
export function LinhaDeCaderno({ rotulo, pergunta, exemplo, valor, limite, varias = false, autoFocus = false, teclado, onChange }: LinhaDeCadernoProps) {
  const theme = useTheme();
  const [focado, setFocado] = useState(false);
  return (
    <View style={{ gap: Spacing.one }}>
      {pergunta ? (
        <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 15 }}>
          {pergunta}
        </ThemedText>
      ) : null}
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={exemplo}
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={rotulo}
        autoFocus={autoFocus}
        multiline={varias}
        maxLength={limite}
        keyboardType={teclado}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        // O exemplo em itálico, para não parecer já preenchido; o que se escreve fica reto.
        style={{
          fontFamily: valor ? FontFamily.display : FontFamily.voz,
          fontSize: 18,
          lineHeight: 26,
          color: theme.text,
          paddingVertical: Spacing.two,
          // Sem o recuo padrão do Android: o texto alinha com a pergunta acima.
          paddingHorizontal: 0,
          borderBottomWidth: 1,
          borderBottomColor: focado ? theme.accent : theme.border,
        }}
      />
    </View>
  );
}
