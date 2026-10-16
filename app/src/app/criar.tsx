import { router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { Button } from '@/components/button';
import { CamposDaExperiencia, valoresVazios, type ValoresDaExperiencia } from '@/components/campos-da-experiencia';
import { MensagemErro } from '@/components/mensagem-erro';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import { lerReferencia } from '@/services/referencia-temporal';
import { validarTituloDoDesejo } from '@/services/validacao';

export default function Criar() {
  const { adicionarDesejo } = useExperiencias();
  const [valores, setValores] = useState<ValoresDaExperiencia>(valoresVazios);
  const [erroTitulo, setErroTitulo] = useState<string>();
  const [erroReferencia, setErroReferencia] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (enviando) return;
    const tituloInvalido = validarTituloDoDesejo(valores.titulo);
    const referencia = lerReferencia(valores.referencia);
    setErroTitulo(tituloInvalido);
    setErroReferencia(referencia.ok ? undefined : referencia.erro);
    if (tituloInvalido || !referencia.ok) return;

    setEnviando(true);
    setErroGeral(undefined);
    const r = await adicionarDesejo({ ...valores, referencia: referencia.referencia });
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
      <ScreenHeader
        eyebrow="Nova experiência"
        title="O que vocês querem viver?"
        description="Contem o que já sabem sobre essa ideia."
      />

      <View style={{ gap: Spacing.four }}>
        <CamposDaExperiencia
          autoFocus
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
        {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
        <View style={{ gap: Spacing.two }}>
          <Button label="Adicionar desejo" loading={enviando} onPress={enviar} />
          <Button label="Cancelar" variant="secondary" disabled={enviando} onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
