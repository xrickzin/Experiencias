import { router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { Button } from '@/components/button';
import { CamposDoDesejo, type ValoresDoDesejo } from '@/components/campos-do-desejo';
import { MensagemErro } from '@/components/mensagem-erro';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import { validarTituloDoDesejo } from '@/services/validacao';

export default function Criar() {
  const { adicionarDesejo } = useExperiencias();
  const [valores, setValores] = useState<ValoresDoDesejo>({ titulo: '', local: '', observacoes: '' });
  const [erroTitulo, setErroTitulo] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (enviando) return;
    const invalido = validarTituloDoDesejo(valores.titulo);
    if (invalido) {
      setErroTitulo(invalido);
      return;
    }
    setEnviando(true);
    setErroGeral(undefined);
    const r = await adicionarDesejo(valores);
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
        <CamposDoDesejo
          autoFocus
          valores={valores}
          erroTitulo={erroTitulo}
          onChange={(novos) => {
            setValores(novos);
            if (erroTitulo) setErroTitulo(undefined);
            if (erroGeral) setErroGeral(undefined);
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
