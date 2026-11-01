import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/button';
import { CartaoDoOrcamento, CartaoDoRoteiro } from '@/components/cartoes-de-recurso';
import {
  CamposDaExperiencia,
  Categorias,
  Duracao,
  duracaoDe,
  valoresVazios,
  type ValoresDaExperiencia,
} from '@/components/campos-da-experiencia';
import { Confirmacao } from '@/components/confirmacao';
import { LinhaDeCaderno } from '@/components/linha-de-caderno';
import { MensagemErro } from '@/components/mensagem-erro';
import { ReferenciaTemporalCampo } from '@/components/referencia-temporal-campo';
import { Screen } from '@/components/screen';
import { ScreenHeader, voltar } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useCategorias } from '@/hooks/use-categorias';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useTheme } from '@/hooks/use-theme';
import { TAMANHOS } from '@/services/tamanho';
import { descreverReferencia, lerReferencia, lerReferenciaDaMemoria } from '@/services/referencia-temporal';
import { validarTituloDoDesejo } from '@/services/validacao';

type Detalhe = 'quando' | 'duracao' | 'onde' | 'tipo' | 'lembranca' | 'planejar';

/**
 * Criar só existe em Desejo ou, para algo vivido antes do aplicativo, em Memória (ADR 008).
 * O desejo começa por uma frase: o resto são perguntas leves que só se abrem quando tocadas, para
 * a tela soar como "contem" e não como "preencham" (ADR 044).
 */
export default function Criar() {
  // `semente`: um começo de frase que vira o exemplo do campo (as sementes de Desejos).
  const { tipo, semente } = useLocalSearchParams<{ tipo?: string; semente?: string }>();
  const memoria = tipo === 'memoria';
  const theme = useTheme();
  const { adicionarDesejo, registrarMemoria } = useExperiencias();
  const { categorias } = useCategorias();
  const [valores, setValores] = useState<ValoresDaExperiencia>(valoresVazios);
  const [erroTitulo, setErroTitulo] = useState<string>();
  const [erroReferencia, setErroReferencia] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [aberto, setAberto] = useState<Detalhe | null>(null);
  const [descartando, setDescartando] = useState(false);
  // Duração, lembrança e planejar ficam atrás de "mais um pouco": de começo, só três perguntas.
  const [maisUmPouco, setMaisUmPouco] = useState(false);
  // Roteiro e orçamento (ADR 040 e 041): valem junto com o desejo guardado.
  const [roteiroAtivo, setRoteiroAtivo] = useState(false);
  const [orcamentoAtivo, setOrcamentoAtivo] = useState(false);

  const mudar = (novos: ValoresDaExperiencia) => {
    setValores(novos);
    setErroTitulo(undefined);
    setErroReferencia(undefined);
    setErroGeral(undefined);
  };

  async function enviar() {
    if (enviando) return;
    const tituloInvalido = validarTituloDoDesejo(valores.titulo);
    const referencia = (memoria ? lerReferenciaDaMemoria : lerReferencia)(valores.referencia);
    // No desejo, o aviso fala na voz da tela; a validação é a mesma.
    setErroTitulo(tituloInvalido && !memoria ? 'Escrevam uma frase para o desejo virar estrela.' : tituloInvalido);
    setErroReferencia(referencia.ok ? undefined : referencia.erro);
    if (!referencia.ok && !memoria) setAberto('quando');
    if (tituloInvalido || !referencia.ok) return;

    setEnviando(true);
    setErroGeral(undefined);
    const campos = { ...valores, tamanho: duracaoDe(valores), referencia: referencia.referencia, roteiroAtivo: !memoria && roteiroAtivo, orcamentoAtivo: !memoria && orcamentoAtivo };
    if (memoria) {
      const r = await registrarMemoria(campos);
      if (r.ok) {
        AccessibilityInfo.announceForAccessibility('Memória guardada');
        // Abre a memória: é ali que entram fotos, impressão e momento favorito.
        router.replace({ pathname: '/experiencia/[id]', params: { id: r.memoria.id } });
        return;
      }
      setEnviando(false);
      setErroGeral(r.mensagem);
      return;
    }
    const r = await adicionarDesejo(campos);
    if (r.ok) {
      AccessibilityInfo.announceForAccessibility('Desejo guardado no céu');
      // A estrela nova cintila ao chegar no céu: é o momento de "virou estrela".
      router.replace({ pathname: '/desejos', params: { nova: r.desejo.id } });
    } else {
      // Nada foi salvo: a pessoa continua aqui e pode tentar de novo.
      setEnviando(false);
      setErroGeral(r.mensagem);
    }
  }

  // Com algo já escrito, sair (pelo cabeçalho, pelo gesto ou pelo voltar do Android) pede confirmação:
  // um desejo não se perde num toque. Guardando, a saída é livre.
  const [liberado, setLiberado] = useState(false);
  const repetirSaida = useRef<() => void>(undefined);
  usePreventRemove(!memoria && Boolean(valores.titulo.trim()) && !enviando && !liberado, ({ repeat }) => {
    repetirSaida.current = repeat;
    setDescartando(true);
  });

  if (memoria) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader
          eyebrow="Uma memória"
          title="O que vocês já viveram?"
          description="Para algo que aconteceu antes do Laço. Só o título e quando aconteceu são necessários."
          onBack={enviando ? undefined : voltar}
        />
        <View style={{ gap: Spacing.four }}>
          <CamposDaExperiencia
            autoFocus
            exigirData
            valores={valores}
            erroTitulo={erroTitulo}
            erroReferencia={erroReferencia}
            onChange={mudar}
          />
          {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
          <View style={{ gap: Spacing.two }}>
            <Button label="Guardar memória" loading={enviando} onPress={enviar} />
            <Button label="Cancelar" variant="secondary" disabled={enviando} onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  const leitura = lerReferencia(valores.referencia);
  // "sem pressa" só quando é mesmo sem data; com a data ainda pela metade, a linha fica sem resposta.
  const quando = !leitura.ok ? '' : leitura.referencia.precisao === 'sem_data' ? 'sem pressa' : (descreverReferencia(leitura.referencia) ?? '');
  const tipos = categorias.filter((c) => valores.categorias.includes(c.id)).map((c) => c.nome).join(', ');
  const planos = roteiroAtivo && orcamentoAtivo ? 'os dois' : roteiroAtivo ? 'roteiro' : orcamentoAtivo ? 'orçamento' : '';
  const duracao = duracaoDe(valores);
  const quantoTempo = duracao ? (TAMANHOS.find((t) => t.valor === duracao)?.rotulo ?? '') : '';
  const alternar = (d: Detalhe) => setAberto((atual) => (atual === d ? null : d));

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="O que vocês sonham viver?" onBack={enviando ? undefined : voltar} />

      <View style={{ gap: Spacing.five, marginTop: -Spacing.three }}>
        <View style={{ gap: Spacing.two }}>
          <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz }}>
            Uma frase basta. O resto pode esperar.
          </ThemedText>
          {/* A frase do desejo: grande, sem caixa, sublinhada pelo fio, como num caderno. */}
          <TextInput
            value={valores.titulo}
            // Uma frase, sem quebras: o Enter fecha o teclado.
            onChangeText={(titulo) => mudar({ ...valores, titulo: titulo.replace(/\n/g, ' ') })}
            submitBehavior="blurAndSubmit"
            returnKeyType="done"
            placeholder={semente ? `${semente}…` : 'Ver o nascer do sol juntos…'}
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Título, obrigatório"
            autoFocus
            multiline
            maxLength={120}
            // O exemplo em itálico (sugestão); o que o casal escreve, reto (é deles).
            style={{
              fontFamily: valores.titulo ? FontFamily.display : FontFamily.voz,
              fontSize: 26,
              lineHeight: 34,
              color: theme.text,
              paddingVertical: Spacing.two,
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
              onChange={(referencia) => mudar({ ...valores, referencia })}
            />
          </Pergunta>
          <Pergunta pergunta="Onde?" resposta={valores.local.trim()} aberta={aberto === 'onde'} onPress={() => alternar('onde')}>
            <LinhaDeCaderno
              autoFocus
              rotulo="Local"
              exemplo="Uma cidade, um restaurante, a varanda de casa…"
              valor={valores.local}
              limite={120}
              onChange={(local) => mudar({ ...valores, local })}
            />
          </Pergunta>
          <Pergunta pergunta="Que tipo de desejo?" resposta={tipos} aberta={aberto === 'tipo'} onPress={() => alternar('tipo')}>
            <Categorias semRotulo editavel={false} marcadas={valores.categorias} onChange={(ids) => mudar({ ...valores, categorias: ids })} />
          </Pergunta>
          {maisUmPouco ? null : (
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
          {maisUmPouco ? (
            <>
          <Pergunta pergunta="Por quanto tempo?" resposta={quantoTempo} aberta={aberto === 'duracao'} onPress={() => alternar('duracao')}>
            <Duracao semRotulo valores={valores} onChange={(tamanho) => mudar({ ...valores, tamanho })} />
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
              onChange={(observacoes) => mudar({ ...valores, observacoes })}
            />
          </Pergunta>
          <Pergunta pergunta="Querem já ir planejando?" resposta={planos} aberta={aberto === 'planejar'} onPress={() => alternar('planejar')}>
            <CartaoDoRoteiro
              compacto
              ativo={roteiroAtivo}
              tamanho={duracao}
              onUsar={() => setRoteiroAtivo(true)}
              onDesligar={() => setRoteiroAtivo(false)}
            />
            <CartaoDoOrcamento
              compacto
              ativo={orcamentoAtivo}
              tamanho={duracao}
              onUsar={() => setOrcamentoAtivo(true)}
              onDesligar={() => setOrcamentoAtivo(false)}
            />
          </Pergunta>
            </>
          ) : null}
        </View>

        {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
        <Button label="Guardar no céu" loading={enviando} onPress={enviar} />
      </View>

      <Confirmacao
        visible={descartando}
        title="Sair sem guardar este desejo?"
        description="O que vocês escreveram vai se perder."
        confirmLabel="Sair sem guardar"
        cancelLabel="Continuar escrevendo"
        destructive
        onConfirm={() => {
          setDescartando(false);
          setLiberado(true);
          repetirSaida.current?.();
        }}
        onCancel={() => setDescartando(false)}
      />
    </Screen>
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
        <ThemedText
          numberOfLines={1}
          themeColor="textSecondary"
          style={{ flex: 1, textAlign: 'right', fontFamily: FontFamily.voz, fontSize: 15 }}>
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
