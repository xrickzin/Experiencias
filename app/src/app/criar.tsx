import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { Button } from '@/components/button';
import { CartaoDoOrcamento, CartaoDoRoteiro } from '@/components/cartoes-de-recurso';
import {
  CamposDaExperiencia,
  duracaoDe,
  valoresVazios,
  type ValoresDaExperiencia,
} from '@/components/campos-da-experiencia';
import { Confirmacao } from '@/components/confirmacao';
import { FormularioDoDesejo, type Detalhe } from '@/components/formulario-do-desejo';
import { MensagemErro } from '@/components/mensagem-erro';
import { Opcoes } from '@/components/opcoes';
import { Screen } from '@/components/screen';
import { ScreenHeader, voltar } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import { lerReferencia, lerReferenciaDaMemoria } from '@/services/referencia-temporal';
import { validarTituloDoDesejo } from '@/services/validacao';

/**
 * Criar só existe em Desejo ou, para algo vivido antes do aplicativo, em Memória (ADR 008).
 * O desejo começa por uma frase: o resto são perguntas leves que só se abrem quando tocadas, para
 * a tela soar como "contem" e não como "preencham" (ADR 044).
 */
export default function Criar() {
  // `semente`: um começo de frase que vira o exemplo do campo (as sementes de Desejos).
  const { tipo, semente } = useLocalSearchParams<{ tipo?: string; semente?: string }>();
  const memoria = tipo === 'memoria';
  const { adicionarDesejo, registrarMemoria } = useExperiencias();
  const [valores, setValores] = useState<ValoresDaExperiencia>(valoresVazios);
  const [erroTitulo, setErroTitulo] = useState<string>();
  const [erroReferencia, setErroReferencia] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [aberto, setAberto] = useState<Detalhe | null>(null);
  const [descartando, setDescartando] = useState(false);
  // Memória registrada direto: no álbum (o padrão) ou em Nossos dias (ADR 045).
  const [noAlbum, setNoAlbum] = useState<'sim' | 'nao'>('sim');
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
      const r = await registrarMemoria({ ...campos, noAlbum: noAlbum === 'sim' });
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
          <View style={{ gap: Spacing.two }}>
            <ThemedText type="smallBold">Isso entra no álbum?</ThemedText>
            <Opcoes
              rotulo="Isso entra no álbum?"
              opcoes={[
                { valor: 'sim', rotulo: 'Sim, no álbum' },
                { valor: 'nao', rotulo: 'Nos nossos dias' },
              ]}
              atual={noAlbum}
              onChange={setNoAlbum}
            />
          </View>
          {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
          <View style={{ gap: Spacing.two }}>
            <Button label="Guardar memória" loading={enviando} onPress={enviar} />
            <Button label="Cancelar" variant="secondary" disabled={enviando} onPress={() => router.back()} />
          </View>
        </View>
      </Screen>
    );
  }

  const planos = roteiroAtivo && orcamentoAtivo ? 'os dois' : roteiroAtivo ? 'roteiro' : orcamentoAtivo ? 'orçamento' : '';
  const duracao = duracaoDe(valores);

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="O que vocês sonham viver?" onBack={enviando ? undefined : voltar} />

      <View style={{ gap: Spacing.five, marginTop: -Spacing.three }}>
        <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, marginBottom: -Spacing.three }}>
          Uma frase basta. O resto pode esperar.
        </ThemedText>
        <FormularioDoDesejo
          valores={valores}
          onChange={mudar}
          erroTitulo={erroTitulo}
          erroReferencia={erroReferencia}
          aberto={aberto}
          onAberto={setAberto}
          exemplo={semente ? `${semente}…` : undefined}
          autoFocus
          planejar={{
            resposta: planos,
            conteudo: (
              <>
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
              </>
            ),
          }}
        />

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

