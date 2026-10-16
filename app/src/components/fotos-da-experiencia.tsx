import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { Confirmacao } from '@/components/confirmacao';
import { MensagemErro } from '@/components/mensagem-erro';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useFotos } from '@/hooks/use-fotos';
import { useTheme } from '@/hooks/use-theme';
import { agruparFotos, capturaDoExif, ROTULO_DO_PERIODO } from '@/services/agrupar-fotos';
import type { Experiencia } from '@/services/experiencias';
import type { ArquivoDeFoto, Foto } from '@/services/fotos';

// Qualidade boa para lembrar, sem pesar no envio. O arquivo vai em base64 para virar bytes no Storage.
// O EXIF volta só para o aparelho ler quando a foto foi tirada; ele não é enviado ao servidor.
const OPCOES = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 0.7, base64: true, exif: true };
const LIMITE_DA_GALERIA = 10;

const paraArquivos = (assets: ImagePicker.ImagePickerAsset[], daCamera: boolean): ArquivoDeFoto[] =>
  assets
    .filter((a) => a.base64)
    .map((a) => ({
      base64: a.base64 as string,
      mimeType: a.mimeType,
      // Foto recém-tirada: se a câmera não informar a hora, é agora.
      capturadaEm: capturaDoExif(a.exif) ?? (daCamera ? new Date().toISOString() : null),
    }));

/**
 * Fotos de uma experiência em Planejamento ou Vivendo (registros, memory.md), agrupadas por dia e
 * por período (madrugada, manhã, tarde, noite) no horário de Brasília, das mais recentes para as antigas.
 */
export function FotosDaExperiencia({ experiencia }: { experiencia: Experiencia }) {
  const theme = useTheme();
  const { fotos, carregando, erro, envio, carregar, enviar, excluir } = useFotos(experiencia.id);
  const [erroDaAcao, setErroDaAcao] = useState<string>();
  const [aberta, setAberta] = useState<Foto | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string>();
  const { definirDestaque, recarregar } = useExperiencias();
  const [marcando, setMarcando] = useState(false);
  const [erroDestaque, setErroDestaque] = useState<string>();
  // Foto de destaque: compartilhada, escolhida à mão (ADR 012 e 028). Aparece no Início.
  const destaqueId = experiencia.fotoDestaque?.id ?? null;

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  async function guardar(arquivos: ArquivoDeFoto[]) {
    setErroDaAcao(undefined);
    const r = await enviar(arquivos);
    if (!r.ok) setErroDaAcao(r.mensagem);
  }

  async function tirarFoto() {
    setErroDaAcao(undefined);
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      setErroDaAcao('Sem acesso à câmera. Libere o acesso nas configurações do aparelho.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync(OPCOES);
    if (!r.canceled) await guardar(paraArquivos(r.assets, true));
  }

  async function escolherDaGaleria() {
    setErroDaAcao(undefined);
    const r = await ImagePicker.launchImageLibraryAsync({
      ...OPCOES,
      allowsMultipleSelection: true,
      selectionLimit: LIMITE_DA_GALERIA,
    });
    if (!r.canceled) await guardar(paraArquivos(r.assets, false));
  }

  async function excluirAberta() {
    if (!aberta) return;
    setExcluindo(true);
    setErroExclusao(undefined);
    const r = await excluir(aberta);
    setExcluindo(false);
    if (r.ok) {
      setConfirmando(false);
      // Era o destaque: o servidor já limpou o ponteiro (ADR 020); relê para o Início saber.
      if (aberta.id === destaqueId) void recarregar();
      setAberta(null);
    } else {
      setErroExclusao(r.mensagem);
    }
  }

  async function alternarDestaque() {
    if (!aberta) return;
    setMarcando(true);
    setErroDestaque(undefined);
    const r = await definirDestaque(experiencia.id, aberta.id === destaqueId ? null : aberta.id);
    setMarcando(false);
    if (!r.ok) setErroDestaque(r.mensagem);
  }

  const enviando = envio !== null;
  const grupos = agruparFotos(fotos, new Date());
  // Numeração na ordem em que aparecem, para o leitor de tela dizer "Foto 3 de 12".
  const posicao = new Map(grupos.flatMap((g) => g.periodos.flatMap((p) => p.fotos)).map((f, i) => [f.id, i + 1]));

  return (
    <View style={{ gap: Spacing.four }}>
      {/* Guardar o momento vem primeiro. */}
      <View style={{ gap: Spacing.two }}>
        <Button label="Tirar foto" disabled={enviando} onPress={tirarFoto} />
        <Button label="Escolher da galeria" variant="secondary" disabled={enviando} onPress={escolherDaGaleria} />
        {enviando ? (
          <ThemedText type="small" accessibilityLiveRegion="polite">
            {envio.total > 1 ? `Guardando foto ${envio.atual} de ${envio.total}…` : 'Guardando foto…'}
          </ThemedText>
        ) : null}
        {erro ? <MensagemErro>{erro}</MensagemErro> : null}
        {erroDaAcao ? <MensagemErro>{erroDaAcao}</MensagemErro> : null}
      </View>

      {carregando && fotos.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Carregando fotos…
        </ThemedText>
      ) : fotos.length === 0 ? (
        <ThemedText themeColor="textSecondary">Nenhuma foto ainda. Os momentos de vocês aparecem aqui.</ThemedText>
      ) : (
        grupos.map((grupo) => (
          <View key={grupo.dia} style={{ gap: Spacing.three }}>
            <ThemedText
              type="subtitle"
              accessibilityRole="header"
              style={{ fontSize: 22, lineHeight: 30, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: Spacing.three }}>
              {grupo.rotulo}
            </ThemedText>
            {grupo.periodos.map(({ periodo, fotos: doPeriodo }) => (
              <View key={periodo} style={{ gap: Spacing.two }}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={{ letterSpacing: 1 }}>
                  {ROTULO_DO_PERIODO[periodo].toUpperCase()}
                </ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
                  {doPeriodo.map((foto) => (
                    <Pressable
                      key={foto.id}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={`Foto ${posicao.get(foto.id)} de ${fotos.length}, ${grupo.rotulo.toLowerCase()}, ${ROTULO_DO_PERIODO[periodo].toLowerCase()}${foto.id === destaqueId ? ', foto de destaque' : ''}`}
                      onPress={() => {
                        setErroDestaque(undefined);
                        setAberta(foto);
                      }}
                      style={{
                        width: '31%',
                        aspectRatio: 1,
                        borderRadius: Radius.photo,
                        overflow: 'hidden',
                        backgroundColor: theme.backgroundElement,
                        borderWidth: foto.id === destaqueId ? 3 : 0,
                        borderColor: theme.text,
                      }}>
                      {foto.url ? (
                        <Image source={{ uri: foto.url }} contentFit="cover" style={{ flex: 1 }} transition={150} />
                      ) : null}
                      {foto.id === destaqueId ? (
                        <View
                          style={{
                            position: 'absolute',
                            left: 0,
                            bottom: 0,
                            paddingHorizontal: Spacing.one,
                            paddingVertical: Spacing.half,
                            backgroundColor: theme.text,
                          }}>
                          <ThemedText type="smallBold" themeColor="background" style={{ fontSize: 11, lineHeight: 14 }}>
                            DESTAQUE
                          </ThemedText>
                        </View>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))
      )}

      <Modal
        testID="foto-aberta"
        visible={aberta !== null}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setAberta(null)}>
        <View style={{ flex: 1, backgroundColor: theme.background, padding: Spacing.four, gap: Spacing.three }}>
          <View style={{ flex: 1, borderRadius: Radius.photo, overflow: 'hidden' }}>
            {aberta?.url ? (
              <Image
                source={{ uri: aberta.url }}
                contentFit="contain"
                style={{ flex: 1 }}
                accessibilityLabel="Foto em tela cheia"
              />
            ) : (
              <ThemedText themeColor="textSecondary">Não foi possível mostrar esta foto agora.</ThemedText>
            )}
          </View>
          {aberta?.id === destaqueId ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              Esta é a foto de destaque de {experiencia.titulo}.
            </ThemedText>
          ) : null}
          <Button
            label={aberta?.id === destaqueId ? 'Tirar do destaque' : 'Usar como foto de destaque'}
            loading={marcando}
            onPress={alternarDestaque}
          />
          {erroDestaque ? <MensagemErro>{erroDestaque}</MensagemErro> : null}
          <Button
            label="Excluir foto"
            variant="secondary"
            onPress={() => {
              setErroExclusao(undefined);
              setConfirmando(true);
            }}
          />
          <Button label="Fechar" variant="text" onPress={() => setAberta(null)} />
        </View>
        <Confirmacao
          visible={confirmando}
          title="Excluir esta foto?"
          description="Essa ação é definitiva e vale para os dois. A foto deixa de existir no Laço."
          confirmLabel="Sim, excluir foto"
          destructive
          loading={excluindo}
          error={erroExclusao}
          onConfirm={excluirAberta}
          onCancel={() => setConfirmando(false)}
        />
      </Modal>
    </View>
  );
}
