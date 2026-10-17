import { useState } from 'react';
import { Modal, View } from 'react-native';

import { Button } from '@/components/button';
import { FolhaDeEdicao } from '@/components/folha-de-edicao';
import { MensagemErro } from '@/components/mensagem-erro';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import type { Experiencia } from '@/services/experiencias';
import { falha } from '@/services/laco';
import { formatarReais, LIMITE_DO_ORCAMENTO, lerReais, mascararReais } from '@/services/orcamento';

/**
 * A guia Orçamento (ADR 041): o total que o casal pensa em gastar, somando tudo. Salva na hora; os
 * dois podem mudar. Por enquanto é um valor só (ADR 038).
 */
export function OrcamentoDaExperiencia({ experiencia }: { experiencia: Experiencia }) {
  const [editando, setEditando] = useState(false);
  const valor = experiencia.orcamentoCentavos;

  return (
    <View style={{ gap: Spacing.four }}>
      {valor === null ? (
        <ThemedText themeColor="textSecondary">
          Quanto vocês pensam em gastar, somando tudo? Um valor aproximado já ajuda a combinar.
        </ThemedText>
      ) : (
        <View
          style={{ gap: Spacing.one }}
          accessible
          accessibilityLabel={`Orçamento: ${formatarReais(valor)} reais, estimativa para os dois.`}>
          <ThemedText style={{ fontFamily: FontFamily.display, fontSize: 40, lineHeight: 48 }}>R$ {formatarReais(valor)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: 'italic' }}>
            Estimativa para os dois
          </ThemedText>
        </View>
      )}
      <Button label={valor === null ? 'Definir valor' : 'Mudar valor'} variant="secondary" onPress={() => setEditando(true)} />
      {editando ? <EditorDoOrcamento experiencia={experiencia} onFechar={() => setEditando(false)} /> : null}
    </View>
  );
}

/** O valor com máscara de reais; vazio, ao guardar, tira o valor. */
function EditorDoOrcamento({ experiencia, onFechar }: { experiencia: Experiencia; onFechar: () => void }) {
  const { definirOrcamento } = useExperiencias();
  const atual = experiencia.orcamentoCentavos;
  const [texto, setTexto] = useState(atual === null ? '' : formatarReais(atual));
  const [erro, setErro] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  async function guardar(centavos: number | null) {
    if (centavos !== null && centavos > LIMITE_DO_ORCAMENTO) return setErro(falha('orcamento_alto').mensagem);
    setSalvando(true);
    setErro(undefined);
    const r = await definirOrcamento(experiencia.id, centavos);
    setSalvando(false);
    if (r.ok) onFechar();
    else setErro(r.mensagem);
  }

  return (
    <Modal testID="editor-do-orcamento" visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onFechar}>
      <FolhaDeEdicao>
        <ThemedText type="subtitle" style={{ fontSize: 24, lineHeight: 32 }} accessibilityRole="header">
          Orçamento
        </ThemedText>
        <TextField
          label="Valor estimado (R$)"
          placeholder="0,00"
          keyboardType="number-pad"
          value={texto}
          onChangeText={(t) => {
            setTexto(mascararReais(t));
            setErro(undefined);
          }}
          autoFocus
        />
        <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: 'italic', marginTop: -Spacing.two }}>
          Para os dois, somando tudo
        </ThemedText>
        {erro ? <MensagemErro>{erro}</MensagemErro> : null}
        <Button label="Guardar valor" loading={salvando} onPress={() => void guardar(lerReais(texto))} />
        {atual !== null ? (
          <Button label="Tirar o valor" variant="secondary" disabled={salvando} onPress={() => void guardar(null)} />
        ) : null}
        <Button label="Cancelar" variant="text" disabled={salvando} onPress={onFechar} />
      </FolhaDeEdicao>
    </Modal>
  );
}
