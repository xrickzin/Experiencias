import { View } from 'react-native';

import { TextField } from '@/components/text-field';
import { Spacing } from '@/constants/theme';

export type ValoresDoDesejo = { titulo: string; local: string; observacoes: string };

type CamposDoDesejoProps = {
  valores: ValoresDoDesejo;
  erroTitulo?: string;
  onChange: (valores: ValoresDoDesejo) => void;
  autoFocus?: boolean;
};

/** Título (obrigatório), local e observações do desejo. Usado ao criar e ao editar. */
export function CamposDoDesejo({ valores, erroTitulo, onChange, autoFocus }: CamposDoDesejoProps) {
  return (
    <View style={{ gap: Spacing.three }}>
      <TextField
        label="Título"
        required
        placeholder="Ex.: Ver o nascer do sol juntos"
        value={valores.titulo}
        onChangeText={(titulo) => onChange({ ...valores, titulo })}
        error={erroTitulo}
        maxLength={120}
        autoFocus={autoFocus}
      />
      <TextField
        label="Local"
        placeholder="Ex.: Campos do Jordão"
        value={valores.local}
        onChangeText={(local) => onChange({ ...valores, local })}
        maxLength={120}
      />
      <TextField
        label="Observações"
        placeholder="Algo que queiram lembrar"
        value={valores.observacoes}
        onChangeText={(observacoes) => onChange({ ...valores, observacoes })}
        maxLength={2000}
        multiline
      />
    </View>
  );
}
