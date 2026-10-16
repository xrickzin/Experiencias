import { Pressable, View } from 'react-native';

import { MensagemErro } from '@/components/mensagem-erro';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  PRECISOES,
  mascararData,
  mascararHorario,
  mascararMesAno,
  type CamposDaReferencia,
} from '@/services/referencia-temporal';

type ReferenciaTemporalCampoProps = {
  campos: CamposDaReferencia;
  onChange: (campos: CamposDaReferencia) => void;
  erro?: string;
  /** Memória exige data: sem a opção "Sem data". */
  obrigatoria?: boolean;
};

/**
 * "Quando": primeiro a precisão (sem data, mês, dia, dia e horário, período), depois só os campos
 * que ela pede. As datas são digitadas com máscara (DD/MM/AAAA), sem dependência de seletor nativo.
 */
export function ReferenciaTemporalCampo({ campos, onChange, erro, obrigatoria = false }: ReferenciaTemporalCampoProps) {
  const theme = useTheme();
  const mudar = (parcial: Partial<CamposDaReferencia>) => onChange({ ...campos, ...parcial });

  return (
    <View style={{ gap: Spacing.two }}>
      <ThemedText type="smallBold">{obrigatoria ? 'Quando *' : 'Quando'}</ThemedText>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        {PRECISOES.filter((p) => !obrigatoria || p.valor !== 'sem_data').map(({ valor, rotulo }) => {
          const escolhida = campos.precisao === valor;
          return (
            <Pressable
              key={valor}
              accessibilityRole="radio"
              accessibilityLabel={rotulo}
              accessibilityState={{ checked: escolhida }}
              onPress={() => mudar({ precisao: valor })}
              style={({ pressed }) => ({
                minHeight: 44,
                justifyContent: 'center',
                paddingHorizontal: Spacing.three,
                borderRadius: Radius.field,
                // Escolhida: borda mais grossa e fundo de seleção, não só cor.
                borderWidth: escolhida ? 2 : 1,
                borderColor: escolhida ? theme.text : theme.outline,
                backgroundColor: escolhida ? theme.backgroundSelected : 'transparent',
                opacity: pressed ? 0.7 : 1,
              })}>
              <ThemedText type={escolhida ? 'smallBold' : 'small'}>{rotulo}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      {campos.precisao === 'mes_ano' ? (
        <TextField
          label="Mês e ano"
          placeholder="MM/AAAA"
          keyboardType="number-pad"
          value={campos.mesAno}
          onChangeText={(v) => mudar({ mesAno: mascararMesAno(v) })}
          maxLength={7}
        />
      ) : null}

      {campos.precisao === 'data' || campos.precisao === 'data_horario' ? (
        <TextField
          label="Data"
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
          value={campos.data}
          onChangeText={(v) => mudar({ data: mascararData(v) })}
          maxLength={10}
        />
      ) : null}

      {campos.precisao === 'data_horario' ? (
        <TextField
          label="Horário"
          placeholder="HH:MM"
          keyboardType="number-pad"
          value={campos.horario}
          onChangeText={(v) => mudar({ horario: mascararHorario(v) })}
          maxLength={5}
        />
      ) : null}

      {campos.precisao === 'periodo' ? (
        <View style={{ gap: Spacing.three }}>
          <TextField
            label="Começo"
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            value={campos.data}
            onChangeText={(v) => mudar({ data: mascararData(v) })}
            maxLength={10}
          />
          <TextField
            label="Fim"
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            value={campos.dataFim}
            onChangeText={(v) => mudar({ dataFim: mascararData(v) })}
            maxLength={10}
          />
        </View>
      ) : null}

      {erro ? <MensagemErro>{erro}</MensagemErro> : null}
    </View>
  );
}
