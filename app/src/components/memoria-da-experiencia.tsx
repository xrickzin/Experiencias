import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Confirmacao } from '@/components/confirmacao';
import { MensagemErro } from '@/components/mensagem-erro';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useImpressoes } from '@/hooks/use-impressoes';
import { useSessao } from '@/hooks/use-sessao';
import { useTheme } from '@/hooks/use-theme';
import { useUrlAssinada } from '@/hooks/use-url-assinada';
import type { Experiencia } from '@/services/experiencias';
import { LIMITE_DA_IMPRESSAO } from '@/services/impressoes';
import { descreverReferencia } from '@/services/referencia-temporal';

type Props = {
  experiencia: Experiencia;
  impressoes: ReturnType<typeof useImpressoes>;
  /** Acabou de ser finalizada: mostra o marco e já abre a escrita da impressão. */
  recemFinalizada?: boolean;
};

/**
 * A memória (screens.md, "Detalhe de uma memória"): destaque, nossos momentos e o que ficou para nós.
 * O que é da outra pessoa só aparece se o servidor mandar (regra de privacidade no banco).
 */
export function MemoriaDaExperiencia({ experiencia, impressoes, recemFinalizada = false }: Props) {
  const theme = useTheme();
  const { perfil } = useSessao();
  const destaque = useUrlAssinada(experiencia.fotoDestaque?.caminho ?? null);
  const { minha, daOutra, registrei, salvar } = impressoes;
  const outra = perfil?.companheiro_vinculado ? (perfil.companheiro_nome ?? 'A outra pessoa') : null;
  const quando = descreverReferencia(experiencia.referencia);
  const detalhes = [quando, experiencia.local].filter(Boolean).join(' · ');

  const [escrevendo, setEscrevendo] = useState(recemFinalizada);
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [apagando, setApagando] = useState(false);
  const [confirmandoApagar, setConfirmandoApagar] = useState(false);
  const [erroApagar, setErroApagar] = useState<string>();

  function abrirEscrita() {
    setTexto(minha?.texto ?? '');
    setErro(undefined);
    setEscrevendo(true);
  }

  async function guardar() {
    if (!texto.trim()) {
      setErro('Escreva sua impressão antes de guardar, ou deixe para depois.');
      return;
    }
    setSalvando(true);
    setErro(undefined);
    const r = await salvar(texto);
    setSalvando(false);
    if (r.ok) setEscrevendo(false);
    else setErro(r.mensagem);
  }

  async function apagar() {
    setApagando(true);
    setErroApagar(undefined);
    const r = await salvar('');
    setApagando(false);
    if (r.ok) setConfirmandoApagar(false);
    else setErroApagar(r.mensagem);
  }

  return (
    <View style={{ gap: Spacing.four }}>
      {recemFinalizada ? (
        <View style={{ alignItems: 'center', gap: Spacing.two }} accessibilityLiveRegion="polite">
          <View style={{ width: 48, height: 2, backgroundColor: theme.accent }} />
          <ThemedText type="subtitle" style={{ fontSize: 22, lineHeight: 30, textAlign: 'center' }}>
            Essa experiência virou uma memória.
          </ThemedText>
        </View>
      ) : null}

      {destaque ? (
        <View style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.photo, overflow: 'hidden' }}>
          <Image
            source={{ uri: destaque }}
            contentFit="cover"
            style={{ flex: 1 }}
            accessibilityLabel={`Foto de destaque de ${experiencia.titulo}`}
          />
        </View>
      ) : null}
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="subtitle" style={{ fontSize: 28, lineHeight: 36 }}>
          {experiencia.titulo}
        </ThemedText>
        {detalhes ? <ThemedText themeColor="textSecondary">{detalhes}</ThemedText> : null}
      </View>

      <Secao titulo="Nossos momentos">
        <Favorito rotulo="Meu momento favorito" caminho={minha?.momentoFavorito?.caminho ?? null}>
          Você ainda não escolheu. Abra uma foto na aba Momentos para escolher.
        </Favorito>
        {outra ? (
          registrei ? (
            <Favorito rotulo={`Momento favorito de ${outra}`} caminho={daOutra?.momentoFavorito?.caminho ?? null}>
              {outra} ainda não escolheu um momento favorito.
            </Favorito>
          ) : (
            // Sempre o mesmo texto e a mesma altura: não revela se a outra pessoa já escreveu.
            <View
              style={{
                padding: Spacing.three,
                borderRadius: Radius.field,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.backgroundElement,
              }}>
              <ThemedText themeColor="textSecondary">
                A impressão e o momento favorito de {outra} serão revelados quando você registrar a sua impressão.
              </ThemedText>
            </View>
          )
        ) : null}
      </Secao>

      <Secao titulo="O que ficou para nós">
        <ThemedText type="smallBold">Minha impressão</ThemedText>
        {escrevendo ? (
          <View style={{ gap: Spacing.two }}>
            <TextField
              label="Como foi essa experiência para você?"
              placeholder="O que você vai querer lembrar daqui a alguns anos?"
              value={texto}
              onChangeText={(t) => {
                setTexto(t);
                setErro(undefined);
              }}
              error={erro}
              maxLength={LIMITE_DA_IMPRESSAO}
              multiline
            />
            <Button label="Guardar minha impressão" loading={salvando} onPress={guardar} />
            <Button
              label={registrei ? 'Cancelar' : 'Escrever depois'}
              variant="text"
              disabled={salvando}
              onPress={() => setEscrevendo(false)}
            />
          </View>
        ) : registrei ? (
          <View style={{ gap: Spacing.two }}>
            <Voz>{minha?.texto}</Voz>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
              <Button label="Editar minha impressão" variant="secondary" onPress={abrirEscrita} />
              <Button
                label="Apagar minha impressão"
                variant="text"
                onPress={() => {
                  setErroApagar(undefined);
                  setConfirmandoApagar(true);
                }}
              />
            </View>
          </View>
        ) : (
          <Button label="Escrever minha impressão" variant="secondary" onPress={abrirEscrita} />
        )}

        {outra && registrei ? (
          <View style={{ gap: Spacing.two, marginTop: Spacing.three }}>
            <ThemedText type="smallBold">Impressão de {outra}</ThemedText>
            {daOutra?.texto ? (
              <Voz>{daOutra.texto}</Voz>
            ) : (
              <ThemedText themeColor="textSecondary">{outra} ainda não registrou a impressão.</ThemedText>
            )}
          </View>
        ) : null}
        {impressoes.erro ? <MensagemErro>{impressoes.erro}</MensagemErro> : null}
      </Secao>

      <Confirmacao
        visible={confirmandoApagar}
        title="Apagar sua impressão?"
        description={
          outra
            ? `A impressão de ${outra} continua guardada. Enquanto você não escrever outra, a impressão e o momento favorito de ${outra} ficam ocultos para você.`
            : 'Você pode escrever outra quando quiser.'
        }
        confirmLabel="Sim, apagar minha impressão"
        destructive
        loading={apagando}
        error={erroApagar}
        onConfirm={apagar}
        onCancel={() => setConfirmandoApagar(false)}
      />
    </View>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: Spacing.two, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: Spacing.three }}>
      <ThemedText type="subtitle" accessibilityRole="header" style={{ fontSize: 22, lineHeight: 30 }}>
        {titulo}
      </ThemedText>
      {children}
    </View>
  );
}

/** Texto de impressão na "voz" (Fraunces itálico, screens.md). */
function Voz({ children }: { children: React.ReactNode }) {
  return <ThemedText style={{ fontFamily: FontFamily.display, fontStyle: 'italic', fontSize: 18, lineHeight: 28 }}>“{children}”</ThemedText>;
}

function Favorito({ rotulo, caminho, children }: { rotulo: string; caminho: string | null; children: React.ReactNode }) {
  const theme = useTheme();
  const url = useUrlAssinada(caminho);
  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="smallBold">{rotulo}</ThemedText>
      {caminho ? (
        <View
          style={{
            width: 120,
            aspectRatio: 1,
            borderRadius: Radius.photo,
            overflow: 'hidden',
            backgroundColor: theme.backgroundElement,
          }}>
          {url ? <Image source={{ uri: url }} contentFit="cover" style={{ flex: 1 }} accessibilityLabel={rotulo} /> : null}
        </View>
      ) : (
        <ThemedText themeColor="textSecondary">{children}</ThemedText>
      )}
    </View>
  );
}
