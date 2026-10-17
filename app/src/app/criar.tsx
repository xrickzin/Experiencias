import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { Button } from '@/components/button';
import { CartaoDoOrcamento, CartaoDoRoteiro } from '@/components/cartoes-de-recurso';
import { CamposDaExperiencia, duracaoDe, valoresVazios, type ValoresDaExperiencia } from '@/components/campos-da-experiencia';
import { MensagemErro } from '@/components/mensagem-erro';
import { Screen } from '@/components/screen';
import { ScreenHeader, voltar } from '@/components/screen-header';
import { Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import { lerReferencia, lerReferenciaDaMemoria } from '@/services/referencia-temporal';
import { validarTituloDoDesejo } from '@/services/validacao';

/** Criar só existe em Desejo ou, para algo vivido antes do aplicativo, em Memória (ADR 008). */
export default function Criar() {
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  const memoria = tipo === 'memoria';
  const { adicionarDesejo, registrarMemoria } = useExperiencias();
  const [valores, setValores] = useState<ValoresDaExperiencia>(valoresVazios);
  const [erroTitulo, setErroTitulo] = useState<string>();
  const [erroReferencia, setErroReferencia] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  // Roteiro e orçamento (ADR 040 e 041): valem junto com "Adicionar desejo".
  const [roteiroAtivo, setRoteiroAtivo] = useState(false);
  const [orcamentoAtivo, setOrcamentoAtivo] = useState(false);

  async function enviar() {
    if (enviando) return;
    const tituloInvalido = validarTituloDoDesejo(valores.titulo);
    const referencia = (memoria ? lerReferenciaDaMemoria : lerReferencia)(valores.referencia);
    setErroTitulo(tituloInvalido);
    setErroReferencia(referencia.ok ? undefined : referencia.erro);
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
      AccessibilityInfo.announceForAccessibility('Desejo adicionado');
      router.replace('/desejos');
    } else {
      // Nada foi salvo: a pessoa continua aqui e pode tentar de novo.
      setEnviando(false);
      setErroGeral(r.mensagem);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      {memoria ? (
        <ScreenHeader
          eyebrow="Uma memória"
          title="O que vocês já viveram?"
          description="Para algo que aconteceu antes do Laço. Só o título e quando aconteceu são necessários."
          onBack={enviando ? undefined : voltar}
        />
      ) : (
        <ScreenHeader
          eyebrow="Nova experiência"
          title="O que vocês querem viver?"
          description="Contem o que já sabem sobre essa ideia."
          onBack={enviando ? undefined : voltar}
        />
      )}

      <View style={{ gap: Spacing.four }}>
        <CamposDaExperiencia
          autoFocus
          exigirData={memoria}
          valores={valores}
          erroTitulo={erroTitulo}
          erroReferencia={erroReferencia}
          onChange={(novos) => {
            setValores(novos);
            setErroTitulo(undefined);
            setErroReferencia(undefined);
            setErroGeral(undefined);
          }}
        />
        {memoria ? null : (
          <>
            <CartaoDoRoteiro
              ativo={roteiroAtivo}
              tamanho={duracaoDe(valores)}
              onUsar={() => setRoteiroAtivo(true)}
              onDesligar={() => setRoteiroAtivo(false)}
            />
            <CartaoDoOrcamento
              ativo={orcamentoAtivo}
              tamanho={duracaoDe(valores)}
              onUsar={() => setOrcamentoAtivo(true)}
              onDesligar={() => setOrcamentoAtivo(false)}
            />
          </>
        )}
        {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
        <View style={{ gap: Spacing.two }}>
          <Button label={memoria ? 'Guardar memória' : 'Adicionar desejo'} loading={enviando} onPress={enviar} />
          <Button label="Cancelar" variant="secondary" disabled={enviando} onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
