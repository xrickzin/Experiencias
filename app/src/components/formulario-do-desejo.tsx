import { useState, type ReactNode } from 'react';
import { Linking, Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Categorias, Duracao, duracaoDe, type ValoresDaExperiencia } from '@/components/campos-da-experiencia';
import { LinhaDeCaderno } from '@/components/linha-de-caderno';
import { MensagemErro } from '@/components/mensagem-erro';
import { ReferenciaTemporalCampo } from '@/components/referencia-temporal-campo';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useCategorias } from '@/hooks/use-categorias';
import { useTheme } from '@/hooks/use-theme';
import { enderecoNoMapa } from '@/services/links';
import { descreverReferencia, lerReferencia } from '@/services/referencia-temporal';
import { TAMANHOS } from '@/services/tamanho';

export type Detalhe = 'quando' | 'duracao' | 'onde' | 'tipo' | 'lembranca' | 'planejar';

type Props = {
  valores: ValoresDaExperiencia;
  onChange: (novos: ValoresDaExperiencia) => void;
  erroTitulo?: string;
  erroReferencia?: string;
  /** A pergunta aberta (quem usa abre "Quando?" quando a data tem erro). */
  aberto: Detalhe | null;
  onAberto: (d: Detalhe | null) => void;
  /** O exemplo da frase (a semente, no criar). */
  exemplo?: string;
  autoFocus?: boolean;
  /** "Querem já ir planejando?": o que se diz à direita e as linhas de roteiro e orçamento. */
  planejar: { resposta: string; conteudo: ReactNode };
  /** Na edição, com algo já preenchido em duração, lembrança ou planejar, tudo aparece de saída. */
  tudoAVista?: boolean;
};

/**
 * O desejo na voz do álbum (ADR 044), igual ao criar e ao editar: a frase grande sublinhada pelo
 * fio e perguntas leves que se abrem ao toque. Três à vista; o resto em "mais um pouco".
 */
export function FormularioDoDesejo({
  valores,
  onChange,
  erroTitulo,
  erroReferencia,
  aberto,
  onAberto,
  exemplo = 'Ver o nascer do sol juntos…',
  autoFocus = false,
  planejar,
  tudoAVista = false,
}: Props) {
  const theme = useTheme();
  const { categorias } = useCategorias();
  const [maisUmPouco, setMaisUmPouco] = useState(tudoAVista);

  const leitura = lerReferencia(valores.referencia);
  // "sem pressa" só quando é mesmo sem data; com a data ainda pela metade, a linha fica sem resposta.
  const quando = !leitura.ok ? '' : leitura.referencia.precisao === 'sem_data' ? 'sem pressa' : (descreverReferencia(leitura.referencia) ?? '');
  const tipos = categorias.filter((c) => valores.categorias.includes(c.id)).map((c) => c.nome).join(', ');
  const duracao = duracaoDe(valores);
  const quantoTempo = duracao ? (TAMANHOS.find((t) => t.valor === duracao)?.rotulo ?? '') : '';
  const alternar = (d: Detalhe) => onAberto(aberto === d ? null : d);

  return (
    <View style={{ gap: Spacing.five }}>
      <View style={{ gap: Spacing.two }}>
        {/* A frase do desejo: grande, sem caixa, sublinhada pelo fio, como num caderno. */}
        <TextInput
          value={valores.titulo}
          // Uma frase, sem quebras: o Enter fecha o teclado.
          onChangeText={(titulo) => onChange({ ...valores, titulo: titulo.replace(/\n/g, ' ') })}
          submitBehavior="blurAndSubmit"
          returnKeyType="done"
          placeholder={exemplo}
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Título, obrigatório"
          autoFocus={autoFocus}
          multiline
          maxLength={120}
          // O exemplo em itálico (sugestão); o que o casal escreve, reto (é deles).
          style={{
            fontFamily: valores.titulo ? FontFamily.display : FontFamily.voz,
            fontSize: 26,
            lineHeight: 34,
            color: theme.text,
            paddingVertical: Spacing.two,
            paddingHorizontal: 0,
            borderBottomWidth: 1.5,
            borderBottomColor: erroTitulo ? theme.error : theme.accent,
          }}
        />
        {erroTitulo ? <MensagemErro>{erroTitulo}</MensagemErro> : null}
      </View>

      {/* O resto, só se quiserem: perguntas leves que se abrem ao toque. */}
      <View>
        <Pergunta pergunta="Quando?" resposta={quando} aberta={aberto === 'quando'} onPress={() => alternar('quando')}>
          <ReferenciaTemporalCampo
            vozDoAlbum
            campos={valores.referencia}
            erro={erroReferencia}
            onChange={(referencia) => onChange({ ...valores, referencia })}
          />
        </Pergunta>
        <Pergunta pergunta="Onde?" resposta={valores.local.trim()} aberta={aberto === 'onde'} onPress={() => alternar('onde')}>
          <LinhaDeCaderno
            autoFocus
            rotulo="Local"
            exemplo="Uma cidade, um restaurante, a varanda de casa…"
            valor={valores.local}
            limite={120}
            onChange={(local) => onChange({ ...valores, local })}
          />
          {valores.local.trim() ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir no mapa"
              onPress={() => void Linking.openURL(enderecoNoMapa(valores.local)).catch(() => {})}
              style={({ pressed }) => ({ minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <ThemedText style={{ fontFamily: FontFamily.voz, fontSize: 15, textDecorationLine: 'underline' }}>abrir no mapa →</ThemedText>
            </Pressable>
          ) : null}
        </Pergunta>
        <Pergunta pergunta="Que tipo de desejo?" resposta={tipos} aberta={aberto === 'tipo'} onPress={() => alternar('tipo')}>
          <Categorias semRotulo editavel={false} marcadas={valores.categorias} onChange={(ids) => onChange({ ...valores, categorias: ids })} />
        </Pergunta>
        {maisUmPouco ? (
          <>
            <Pergunta pergunta="Por quanto tempo?" resposta={quantoTempo} aberta={aberto === 'duracao'} onPress={() => alternar('duracao')}>
              <Duracao semRotulo valores={valores} onChange={(tamanho) => onChange({ ...valores, tamanho })} />
            </Pergunta>
            <Pergunta
              pergunta="Algo para não esquecer?"
              resposta={valores.observacoes.trim()}
              aberta={aberto === 'lembranca'}
              onPress={() => alternar('lembranca')}>
              <LinhaDeCaderno
                autoFocus
                rotulo="Observações"
                exemplo="Algo que não querem esquecer…"
                valor={valores.observacoes}
                limite={2000}
                varias
                onChange={(observacoes) => onChange({ ...valores, observacoes })}
              />
            </Pergunta>
            <Pergunta
              pergunta="Querem já ir planejando?"
              resposta={planejar.resposta}
              aberta={aberto === 'planejar'}
              onPress={() => alternar('planejar')}>
              {planejar.conteudo}
            </Pergunta>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mais um pouco"
            onPress={() => setMaisUmPouco(true)}
            style={({ pressed }) => ({ minHeight: 48, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
            <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz }}>
              e, se quiserem, mais um pouco…
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

type PerguntaProps = { pergunta: string; resposta: string; aberta: boolean; onPress: () => void; children: ReactNode };

/**
 * Uma pergunta em voz de álbum, numa linha só, com a resposta à direita quando já existe. Tocar abre
 * o controle ali mesmo; nada aqui parece obrigatório.
 */
function Pergunta({ pergunta, resposta, aberta, onPress, children }: PerguntaProps) {
  const theme = useTheme();
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={resposta ? `${pergunta} ${resposta}` : pergunta}
        accessibilityState={{ expanded: aberta }}
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.three,
          paddingVertical: Spacing.three,
          opacity: pressed ? 0.7 : 1,
        })}>
        <ThemedText style={{ flexShrink: 1, fontFamily: FontFamily.voz, fontSize: 18 }}>{pergunta}</ThemedText>
        <ThemedText numberOfLines={1} themeColor="textSecondary" style={{ flex: 1, textAlign: 'right', fontFamily: FontFamily.voz, fontSize: 15 }}>
          {resposta}
        </ThemedText>
        {/* Um "+" desenhado diz que a linha se abre (mais calmo quando já tem resposta); aberta, vira "−". */}
        <Svg width={12} height={12} viewBox="0 0 12 12" accessible={false}>
          <Path
            d={aberta ? 'M2 6 H10' : 'M2 6 H10 M6 2 V10'}
            stroke={resposta && !aberta ? theme.textSecondary : theme.accent}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>
      {aberta ? <View style={{ gap: Spacing.three, paddingBottom: Spacing.four }}>{children}</View> : null}
    </View>
  );
}
