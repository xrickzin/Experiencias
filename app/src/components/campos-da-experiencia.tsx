import { View } from 'react-native';

import { ReferenciaTemporalCampo } from '@/components/referencia-temporal-campo';
import { TextField } from '@/components/text-field';
import { Spacing } from '@/constants/theme';
import type { Experiencia } from '@/services/experiencias';
import { camposDaReferencia, SEM_DATA, type CamposDaReferencia } from '@/services/referencia-temporal';

export type ValoresDaExperiencia = {
  titulo: string;
  local: string;
  observacoes: string;
  referencia: CamposDaReferencia;
};

export const valoresVazios = (): ValoresDaExperiencia => ({
  titulo: '',
  local: '',
  observacoes: '',
  referencia: camposDaReferencia(SEM_DATA),
});

export const valoresDe = (e: Experiencia): ValoresDaExperiencia => ({
  titulo: e.titulo,
  local: e.local ?? '',
  observacoes: e.observacoes ?? '',
  referencia: camposDaReferencia(e.referencia),
});

type CamposDaExperienciaProps = {
  valores: ValoresDaExperiencia;
  erroTitulo?: string;
  erroReferencia?: string;
  onChange: (valores: ValoresDaExperiencia) => void;
  autoFocus?: boolean;
  /** Memória: a referência temporal é obrigatória. */
  exigirData?: boolean;
};

/** Título (obrigatório), quando, local e observações. Os mesmos ao criar e ao editar, em qualquer estado. */
export function CamposDaExperiencia({
  valores,
  erroTitulo,
  erroReferencia,
  onChange,
  autoFocus,
  exigirData,
}: CamposDaExperienciaProps) {
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
      <ReferenciaTemporalCampo
        campos={valores.referencia}
        erro={erroReferencia}
        obrigatoria={exigirData}
        onChange={(referencia) => onChange({ ...valores, referencia })}
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
