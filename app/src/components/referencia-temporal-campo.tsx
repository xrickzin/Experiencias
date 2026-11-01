import { Pressable, View } from 'react-native';

import { LinhaDeCaderno } from '@/components/linha-de-caderno';
import { Entre, PalavraComFio } from '@/components/opcoes';
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
  /** Dentro da pergunta "Quando?" do criar: sem rótulo e com palavras humanas ("Num mês"). */
  vozDoAlbum?: boolean;
};

// Na voz do álbum, um exemplo de verdade no lugar da máscara (a máscara continua a mesma).
const EXEMPLO: Record<string, string> = { 'MM/AAAA': '03/2027', 'DD/MM/AAAA': '12/06/2027', 'HH:MM': '20:30' };

// As mesmas precisões, ditas como o casal diria (o criar já pergunta "Quando?").
const NA_VOZ_DO_ALBUM: Record<string, string> = {
  sem_data: 'Sem pressa',
  mes_ano: 'Num mês',
  data: 'Num dia',
  data_horario: 'Dia e hora',
  periodo: 'Uns dias',
};

/**
 * "Quando": primeiro a precisão (sem data, mês, dia, dia e horário, período), depois só os campos
 * que ela pede. As datas são digitadas com máscara (DD/MM/AAAA), sem dependência de seletor nativo.
 */
export function ReferenciaTemporalCampo({ campos, onChange, erro, obrigatoria = false, vozDoAlbum = false }: ReferenciaTemporalCampoProps) {
  const theme = useTheme();
  const mudar = (parcial: Partial<CamposDaReferencia>) => onChange({ ...campos, ...parcial });
  // Na voz do álbum, cada campo é uma linha de caderno com uma pergunta; fora dela, o campo de sempre.
  // O rótulo (lido pelo leitor de tela) é o mesmo nos dois.
  const campo = (rotulo: string, pergunta: string, exemplo: string, valor: string, limite: number, mascara: (v: string) => string, chave: keyof CamposDaReferencia) =>
    vozDoAlbum ? (
      <LinhaDeCaderno rotulo={rotulo} pergunta={pergunta} exemplo={EXEMPLO[exemplo] ?? exemplo} valor={valor} limite={limite} teclado="number-pad" onChange={(v) => mudar({ [chave]: mascara(v) })} />
    ) : (
      <TextField label={rotulo} placeholder={exemplo} keyboardType="number-pad" value={valor} onChangeText={(v) => mudar({ [chave]: mascara(v) })} maxLength={limite} />
    );

  return (
    <View style={{ gap: Spacing.two }}>
      {vozDoAlbum ? null : <ThemedText type="smallBold">{obrigatoria ? 'Quando *' : 'Quando'}</ThemedText>}
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        <Entre ligado={vozDoAlbum}>
        {PRECISOES.filter((p) => !obrigatoria || p.valor !== 'sem_data').map(({ valor, rotulo: padrao }) => {
          const rotulo = vozDoAlbum ? NA_VOZ_DO_ALBUM[valor] : padrao;
          const escolhida = campos.precisao === valor;
          return (
            <Pressable
              key={valor}
              accessibilityRole="radio"
              accessibilityLabel={rotulo}
              accessibilityState={{ checked: escolhida }}
              onPress={() => mudar({ precisao: valor })}
              style={({ pressed }) =>
                vozDoAlbum
                  ? // Palavras soltas, sem caixa: a escolhida ganha o fio embaixo (como o Chip na voz).
                    { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.one, opacity: pressed ? 0.7 : 1 }
                  : {
                      minHeight: 44,
                      justifyContent: 'center',
                      paddingHorizontal: Spacing.three,
                      borderRadius: Radius.field,
                      // Escolhida: borda mais grossa e fundo de seleção, não só cor.
                      borderWidth: escolhida ? 2 : 1,
                      borderColor: escolhida ? theme.text : theme.outline,
                      backgroundColor: escolhida ? theme.backgroundSelected : 'transparent',
                      opacity: pressed ? 0.7 : 1,
                    }
              }>
              {vozDoAlbum ? (
                <PalavraComFio texto={rotulo} escolhida={escolhida} />
              ) : (
                <ThemedText type={escolhida ? 'smallBold' : 'small'}>{rotulo}</ThemedText>
              )}
            </Pressable>
          );
        })}
        </Entre>
      </View>

      {campos.precisao === 'mes_ano' ? campo('Mês e ano', 'Em que mês?', 'MM/AAAA', campos.mesAno, 7, mascararMesAno, 'mesAno') : null}

      {campos.precisao === 'data' || campos.precisao === 'data_horario' ? campo('Data', 'Que dia?', 'DD/MM/AAAA', campos.data, 10, mascararData, 'data') : null}

      {campos.precisao === 'data_horario' ? campo('Horário', 'Que horas?', 'HH:MM', campos.horario, 5, mascararHorario, 'horario') : null}

      {campos.precisao === 'periodo' ? (
        // Na voz do álbum, começo e fim lado a lado, como "de … a …".
        <View style={vozDoAlbum ? { flexDirection: 'row', gap: Spacing.three } : { gap: Spacing.three }}>
          <View style={vozDoAlbum ? { flex: 1 } : undefined}>{campo('Começo', 'De que dia', 'DD/MM/AAAA', campos.data, 10, mascararData, 'data')}</View>
          <View style={vozDoAlbum ? { flex: 1 } : undefined}>{campo('Fim', 'a que dia?', 'DD/MM/AAAA', campos.dataFim, 10, mascararData, 'dataFim')}</View>
        </View>
      ) : null}

      {erro ? <MensagemErro>{erro}</MensagemErro> : null}
    </View>
  );
}
