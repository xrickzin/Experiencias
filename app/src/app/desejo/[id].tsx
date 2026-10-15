import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { CamposDoDesejo, type ValoresDoDesejo } from '@/components/campos-do-desejo';
import { Confirmacao } from '@/components/confirmacao';
import { MensagemErro } from '@/components/mensagem-erro';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import type { Desejo } from '@/services/experiencias';
import { validarTituloDoDesejo } from '@/services/validacao';

export default function DesejoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { desejos, carregando } = useExperiencias();
  const desejo = desejos.find((d) => d.id === id);

  if (!desejo) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader
          eyebrow="Desejo"
          title={carregando ? 'Abrindo…' : 'Esse desejo não existe mais.'}
          description={carregando ? undefined : 'A outra pessoa pode tê-lo excluído.'}
        />
        {carregando ? null : <Button label="Voltar para Desejos" onPress={() => router.replace('/desejos')} />}
      </Screen>
    );
  }

  // O formulário só monta com o desejo carregado, então começa já preenchido.
  return <Formulario key={desejo.id} desejo={desejo} />;
}

function Formulario({ desejo }: { desejo: Desejo }) {
  const { atualizarDesejo, excluirDesejo } = useExperiencias();
  const [valores, setValores] = useState<ValoresDoDesejo>({
    titulo: desejo.titulo,
    local: desejo.local ?? '',
    observacoes: desejo.observacoes ?? '',
  });
  const [erroTitulo, setErroTitulo] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string>();

  async function salvar() {
    const invalido = validarTituloDoDesejo(valores.titulo);
    if (invalido) return setErroTitulo(invalido);
    setEnviando(true);
    setErroGeral(undefined);
    const r = await atualizarDesejo(desejo.id, valores);
    setEnviando(false);
    if (r.ok) {
      setSalvo(true);
    } else if (r.codigo === 'desejo_inexistente') {
      router.replace('/desejos');
    } else {
      setErroGeral(r.mensagem);
    }
  }

  async function excluir() {
    setExcluindo(true);
    setErroExclusao(undefined);
    const r = await excluirDesejo(desejo.id);
    if (r.ok) {
      setConfirmandoExclusao(false);
      router.replace('/desejos');
    } else {
      setExcluindo(false);
      setErroExclusao(r.mensagem);
    }
  }

  const ocupado = enviando || excluindo;

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader
        eyebrow="Desejo"
        title="Ainda é só uma ideia por enquanto."
        description="Guardem o que já sabem."
      />

      <View style={{ gap: Spacing.three }}>
        <CamposDoDesejo
          valores={valores}
          erroTitulo={erroTitulo}
          onChange={(novos) => {
            setValores(novos);
            setErroTitulo(undefined);
            setSalvo(false);
            setErroGeral(undefined);
          }}
        />
        {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
        {salvo ? (
          <ThemedText type="small" accessibilityLiveRegion="polite">
            Salvo.
          </ThemedText>
        ) : null}
      </View>

      <View style={{ gap: Spacing.two, marginTop: Spacing.four }}>
        <Button label="Salvar" loading={enviando} disabled={excluindo} onPress={salvar} />
        <Button
          label="Excluir desejo"
          variant="secondary"
          disabled={ocupado}
          onPress={() => {
            setErroExclusao(undefined);
            setConfirmandoExclusao(true);
          }}
        />
        <Button label="Voltar" variant="text" disabled={ocupado} onPress={() => router.back()} />
      </View>

      <Confirmacao
        visible={confirmandoExclusao}
        title="Excluir este desejo?"
        description="Essa ação é definitiva e vale para os dois. O desejo deixa de existir e não dá para desfazer."
        confirmLabel="Sim, excluir desejo"
        destructive
        loading={excluindo}
        error={erroExclusao}
        onConfirm={excluir}
        onCancel={() => setConfirmandoExclusao(false)}
      />
    </Screen>
  );
}
