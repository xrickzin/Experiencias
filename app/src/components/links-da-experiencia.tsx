import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { Confirmacao } from '@/components/confirmacao';
import { FolhaDeEdicao } from '@/components/folha-de-edicao';
import { MensagemErro } from '@/components/mensagem-erro';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useLinks } from '@/hooks/use-links';
import { useTheme } from '@/hooks/use-theme';
import type { Resultado } from '@/services/laco';
import { descreverEndereco, LIMITE_DO_TITULO_DO_LINK, type Link } from '@/services/links';

/**
 * Links da experiência (ADR 039): tocar abre o site ou o lugar no Google Maps; "Editar" muda ou
 * exclui. Salvam na hora, à parte do "Salvar" do formulário. Os dois podem.
 */
export function LinksDaExperiencia({ experienciaId }: { experienciaId: string }) {
  const theme = useTheme();
  const { links, erro, carregar, criar, editar, excluir } = useLinks(experienciaId);
  const [editando, setEditando] = useState<Link | 'novo' | null>(null);
  const [erroAoAbrir, setErroAoAbrir] = useState<string>();

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  async function abrir(url: string) {
    setErroAoAbrir(undefined);
    try {
      await Linking.openURL(url);
    } catch {
      setErroAoAbrir('Não foi possível abrir esse link.');
    }
  }

  const aberto = editando && editando !== 'novo' ? editando : null;

  return (
    <View style={{ gap: Spacing.two }}>
      <ThemedText type="smallBold" accessibilityRole="header">
        Links
      </ThemedText>
      {links.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Guardem o site do restaurante, o ingresso ou o lugar no Google Maps.
        </ThemedText>
      ) : (
        <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
          {links.map((l) => {
            const { dominio, mapa } = descreverEndereco(l.url);
            return (
              <View
                key={l.id}
                style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`${l.titulo}, ${dominio}. ${mapa ? 'Abrir no mapa' : 'Abrir'}`}
                  onPress={() => void abrir(l.url)}
                  style={({ pressed }) => ({ flex: 1, minHeight: 56, paddingVertical: Spacing.two, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
                  <ThemedText numberOfLines={1}>{l.titulo}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {dominio} ↗
                  </ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Editar o link ${l.titulo}`}
                  hitSlop={8}
                  onPress={() => setEditando(l)}
                  style={{ minHeight: 44, justifyContent: 'center', paddingLeft: Spacing.three }}>
                  <ThemedText type="smallBold" style={{ textDecorationLine: 'underline' }}>
                    Editar
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
      {erro ? <MensagemErro>{erro}</MensagemErro> : null}
      {erroAoAbrir ? <MensagemErro>{erroAoAbrir}</MensagemErro> : null}
      <Button label="Adicionar link" variant="secondary" onPress={() => setEditando('novo')} />

      {editando ? (
        <EditorDeLink
          link={aberto}
          onSalvar={(titulo, endereco) => (aberto ? editar(aberto.id, titulo, endereco) : criar(titulo, endereco))}
          onExcluir={aberto ? () => excluir(aberto.id) : undefined}
          onFechar={() => setEditando(null)}
        />
      ) : null}
    </View>
  );
}

type EditorProps = {
  link: Link | null;
  onSalvar: (titulo: string, endereco: string) => Promise<Resultado>;
  onExcluir?: () => Promise<Resultado>;
  onFechar: () => void;
};

function EditorDeLink({ link, onSalvar, onExcluir, onFechar }: EditorProps) {
  const [endereco, setEndereco] = useState(link?.url ?? '');
  const [titulo, setTitulo] = useState(link?.titulo ?? '');
  const [erro, setErro] = useState<string>();
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string>();

  function colar(texto: string) {
    setEndereco(texto);
    setErro(undefined);
    // O "Compartilhar" do Google Maps traz o nome do lugar antes do link: vira o nome, se ainda não há.
    const antes = texto.split(/https?:\/\//i)[0].split('\n')[0].trim();
    if (!titulo.trim() && antes && antes !== texto.trim()) setTitulo(antes.slice(0, LIMITE_DO_TITULO_DO_LINK));
  }

  async function salvar() {
    setSalvando(true);
    setErro(undefined);
    const r = await onSalvar(titulo, endereco);
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
    <Modal
      testID="editor-de-link"
      visible
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onFechar}>
      <FolhaDeEdicao>
        <ThemedText type="subtitle" style={{ fontSize: 24, lineHeight: 32 }} accessibilityRole="header">
          {link ? 'Link' : 'Novo link'}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Colem o endereço de um site. Para um lugar, usem &quot;Compartilhar&quot; no Google Maps e colem aqui.
        </ThemedText>
        <TextField
          label="Endereço"
          placeholder="https://"
          value={endereco}
          onChangeText={colar}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          autoFocus={!link}
        />
        <TextField
          label="Nome"
          placeholder="Ex.: Pousada da serra"
          value={titulo}
          onChangeText={(t) => {
            setTitulo(t);
            setErro(undefined);
          }}
          maxLength={LIMITE_DO_TITULO_DO_LINK}
        />
        {erro ? <MensagemErro>{erro}</MensagemErro> : null}
        <Button label="Guardar link" loading={salvando} disabled={excluindo} onPress={salvar} />
        {onExcluir ? (
          <Button
            label="Excluir link"
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
        title="Excluir este link?"
        description="Ele sai desta experiência, para os dois."
        confirmLabel="Sim, excluir link"
        destructive
        loading={excluindo}
        error={erroExclusao}
        onConfirm={excluir}
        onCancel={() => setConfirmando(false)}
      />
    </Modal>
  );
}
