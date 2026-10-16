import { useState } from 'react';
import { Linking, Modal, Pressable, Share, View } from 'react-native';

import { Button } from '@/components/button';
import { Confirmacao } from '@/components/confirmacao';
import { FolhaDeEdicao } from '@/components/folha-de-edicao';
import { MensagemErro } from '@/components/mensagem-erro';
import { Opcoes } from '@/components/opcoes';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { useReservas } from '@/hooks/use-reservas';
import { useTheme } from '@/hooks/use-theme';
import type { Resultado } from '@/services/laco';
import { mascararData, mascararHorario } from '@/services/referencia-temporal';
import {
  camposDe,
  descreverQuando,
  LIMITE_DO_CODIGO,
  LIMITE_DO_NOME_DA_RESERVA,
  TIPOS_DE_RESERVA,
  type CamposDaReserva,
  type Reserva,
} from '@/services/reservas';

const ROTULO_DO_TIPO = Object.fromEntries(TIPOS_DE_RESERVA.map((t) => [t.valor, t.rotulo]));

/**
 * Reservas da experiência (ADR 038, etapa 3): o código fica à vista, com um atalho para copiar.
 * Salvam na hora, à parte do "Salvar" do formulário. Os dois podem.
 */
export function ReservasDaExperiencia({ reservas: lista }: { reservas: ReturnType<typeof useReservas> }) {
  const theme = useTheme();
  const { reservas, erro, criar, editar, excluir } = lista;
  const [editando, setEditando] = useState<Reserva | 'nova' | null>(null);
  const [erroDeAcao, setErroDeAcao] = useState<string>();

  async function abrir(url: string) {
    setErroDeAcao(undefined);
    try {
      await Linking.openURL(url);
    } catch {
      setErroDeAcao('Não foi possível abrir esse link.');
    }
  }

  // Sem área de transferência no app: a tela de compartilhar do celular tem "Copiar".
  async function copiar(codigo: string) {
    setErroDeAcao(undefined);
    try {
      await Share.share({ message: codigo });
    } catch {
      setErroDeAcao('Não foi possível abrir as opções para copiar.');
    }
  }

  const aberta = editando && editando !== 'nova' ? editando : null;

  return (
    <View style={{ gap: Spacing.two }}>
      <ThemedText type="smallBold" accessibilityRole="header">
        Reservas
      </ThemedText>
      {reservas.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Hospedagem, passagem, ingresso ou mesa: guardem o dia e o código de confirmação.
        </ThemedText>
      ) : (
        <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
          {reservas.map((r) => {
            const quando = descreverQuando(r);
            return (
              <View key={r.id} style={{ paddingVertical: Spacing.three, gap: Spacing.one, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <ThemedText type="small" themeColor="textSecondary">
                  {ROTULO_DO_TIPO[r.tipo]}
                </ThemedText>
                <ThemedText>{r.nome}</ThemedText>
                {quando ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {quando}
                  </ThemedText>
                ) : null}
                {r.codigo ? (
                  <ThemedText selectable accessibilityLabel={`Código ${r.codigo.split('').join(' ')}`}>
                    Código <ThemedText type="smallBold">{r.codigo}</ThemedText>
                  </ThemedText>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.four }}>
                  {r.codigo ? (
                    <Acao rotulo="Copiar código" acessivel={`Copiar o código de ${r.nome}`} onPress={() => void copiar(r.codigo!)} />
                  ) : null}
                  {r.url ? <Acao rotulo="Abrir link ↗" acessivel={`Abrir o link de ${r.nome}`} onPress={() => void abrir(r.url!)} /> : null}
                  <Acao rotulo="Editar" acessivel={`Editar a reserva ${r.nome}`} onPress={() => setEditando(r)} />
                </View>
              </View>
            );
          })}
        </View>
      )}
      {erro ? <MensagemErro>{erro}</MensagemErro> : null}
      {erroDeAcao ? <MensagemErro>{erroDeAcao}</MensagemErro> : null}
      <Button label="Adicionar reserva" variant="secondary" onPress={() => setEditando('nova')} />

      {editando ? (
        <EditorDeReserva
          reserva={aberta}
          onSalvar={(campos) => (aberta ? editar(aberta.id, campos) : criar(campos))}
          onExcluir={aberta ? () => excluir(aberta.id) : undefined}
          onFechar={() => setEditando(null)}
        />
      ) : null}
    </View>
  );
}

function Acao({ rotulo, acessivel, onPress }: { rotulo: string; acessivel: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={acessivel} hitSlop={8} onPress={onPress} style={{ minHeight: 44, justifyContent: 'center' }}>
      <ThemedText type="smallBold" style={{ textDecorationLine: 'underline' }}>
        {rotulo}
      </ThemedText>
    </Pressable>
  );
}

type EditorProps = {
  reserva: Reserva | null;
  onSalvar: (campos: CamposDaReserva) => Promise<Resultado>;
  onExcluir?: () => Promise<Resultado>;
  onFechar: () => void;
};

function EditorDeReserva({ reserva, onSalvar, onExcluir, onFechar }: EditorProps) {
  const [campos, setCampos] = useState<CamposDaReserva>(() => camposDe(reserva));
  const [erro, setErro] = useState<string>();
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string>();

  const mudar = (parte: Partial<CamposDaReserva>) => {
    setCampos((atuais) => ({ ...atuais, ...parte }));
    setErro(undefined);
  };

  async function salvar() {
    setSalvando(true);
    setErro(undefined);
    const r = await onSalvar(campos);
    setSalvando(false);
    if (r.ok) onFechar();
    else setErro(r.mensagem);
  }

  async function excluir() {
    if (!onExcluir) return;
    setExcluindo(true);
    setErroExclusao(undefined);
    const r = await onExcluir();
    setExcluindo(false);
    if (r.ok) {
      setConfirmando(false);
      onFechar();
    } else {
      setErroExclusao(r.mensagem);
    }
  }

  return (
    <Modal testID="editor-de-reserva" visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onFechar}>
      <FolhaDeEdicao>
        <ThemedText type="subtitle" style={{ fontSize: 24, lineHeight: 32 }} accessibilityRole="header">
          {reserva ? 'Reserva' : 'Nova reserva'}
        </ThemedText>
        <View style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold">Tipo</ThemedText>
          <Opcoes rotulo="Tipo" opcoes={TIPOS_DE_RESERVA} atual={campos.tipo} onChange={(tipo) => mudar({ tipo })} />
        </View>
        <TextField
          label="Nome"
          required
          placeholder="Ex.: Pousada da serra"
          value={campos.nome}
          onChangeText={(nome) => mudar({ nome })}
          maxLength={LIMITE_DO_NOME_DA_RESERVA}
        />
        <View style={{ flexDirection: 'row', gap: Spacing.three }}>
          <View style={{ flex: 3 }}>
            <TextField
              label="Data"
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              value={campos.data}
              onChangeText={(v) => mudar({ data: mascararData(v) })}
            />
          </View>
          <View style={{ flex: 2 }}>
            <TextField
              label="Horário"
              placeholder="HH:MM"
              keyboardType="number-pad"
              value={campos.horario}
              onChangeText={(v) => mudar({ horario: mascararHorario(v) })}
            />
          </View>
        </View>
        <TextField
          label="Código de confirmação"
          placeholder="Ex.: ABC123"
          autoCapitalize="characters"
          autoCorrect={false}
          value={campos.codigo}
          onChangeText={(codigo) => mudar({ codigo })}
          maxLength={LIMITE_DO_CODIGO}
        />
        <TextField
          label="Link"
          placeholder="https://"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={campos.endereco}
          onChangeText={(endereco) => mudar({ endereco })}
        />
        {erro ? <MensagemErro>{erro}</MensagemErro> : null}
        <Button label="Guardar reserva" loading={salvando} disabled={excluindo} onPress={salvar} />
        {onExcluir ? (
          <Button
            label="Excluir reserva"
            variant="destructive"
            disabled={salvando}
            onPress={() => {
              setErroExclusao(undefined);
              setConfirmando(true);
            }}
          />
        ) : null}
        <Button label="Cancelar" variant="text" disabled={salvando} onPress={onFechar} />
      </FolhaDeEdicao>
      <Confirmacao
        visible={confirmando}
        title="Excluir esta reserva?"
        description="Ela sai desta experiência, para os dois."
        confirmLabel="Sim, excluir reserva"
        destructive
        loading={excluindo}
        error={erroExclusao}
        onConfirm={excluir}
        onCancel={() => setConfirmando(false)}
      />
    </Modal>
  );
}
