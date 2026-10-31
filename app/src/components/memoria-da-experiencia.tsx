import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { Confirmacao } from '@/components/confirmacao';
import { FotoEmTelaCheia } from '@/components/foto-em-tela-cheia';
import { Moldura } from '@/components/moldura';
import { Retrato } from '@/components/retrato';
import { MensagemErro } from '@/components/mensagem-erro';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useImpressoes } from '@/hooks/use-impressoes';
import { useSessao } from '@/hooks/use-sessao';
import { useTheme } from '@/hooks/use-theme';
import { useUrlAssinada } from '@/hooks/use-url-assinada';
import type { Experiencia } from '@/services/experiencias';
import { LIMITE_DA_IMPRESSAO } from '@/services/impressoes';

type Props = {
  experiencia: Experiencia;
  impressoes: ReturnType<typeof useImpressoes>;
  /** Acabou de ser finalizada: mostra o marco e já abre a escrita da impressão. */
  recemFinalizada?: boolean;
};

/**
 * A memória (screens.md, "Detalhe de uma memória"): os favoritos como polaroides e as impressões como
 * cartas. A foto de destaque, o título e quando foi ficam no topo da tela, comuns às três abas.
 * O que é da outra pessoa só aparece se o servidor mandar (regra de privacidade no banco).
 */
export function MemoriaDaExperiencia({ experiencia, impressoes, recemFinalizada = false }: Props) {
  const theme = useTheme();
  const { perfil } = useSessao();
  const { minha, daOutra, registrei, salvar } = impressoes;
  const outra = perfil?.companheiro_vinculado ? (perfil.companheiro_nome ?? 'A outra pessoa') : null;
  const eu = perfil?.nome ?? 'Você';

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
    <View style={{ gap: Spacing.five }}>
      {recemFinalizada ? (
        <View style={{ alignItems: 'center', gap: Spacing.two }} accessibilityLiveRegion="polite">
          <View style={{ width: 48, height: 2, backgroundColor: theme.accent }} />
          <ThemedText type="subtitle" style={{ fontSize: 22, lineHeight: 30, textAlign: 'center' }}>
            Essa experiência virou uma memória.
          </ThemedText>
        </View>
      ) : null}

      {/* Os favoritos como polaroides coladas na página, uma de cada pessoa. */}
      <View style={{ gap: Spacing.three }}>
        <Titulo>Nossos momentos</Titulo>
        <View style={{ flexDirection: 'row', gap: Spacing.three, justifyContent: 'center' }}>
          <Polaroide rotulo="Meu momento favorito" legenda={eu} caminho={minha?.momentoFavorito?.caminho ?? null} inclinacao={-2}>
            Você ainda não escolheu. Abra uma foto na aba Momentos para escolher.
          </Polaroide>
          {outra ? (
            registrei ? (
              <Polaroide
                rotulo={`Momento favorito de ${outra}`}
                legenda={outra}
                caminho={daOutra?.momentoFavorito?.caminho ?? null}
                inclinacao={2}>
                {outra} ainda não escolheu um momento favorito.
              </Polaroide>
            ) : (
              // Sempre a mesma moldura fechada: não revela se a outra pessoa já escolheu.
              <Polaroide rotulo={`Momento favorito de ${outra}`} legenda={outra} caminho={null} inclinacao={2} guardado />
            )
          ) : null}
        </View>
        {outra && !registrei ? (
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            A impressão e o momento favorito de {outra} serão revelados quando você registrar a sua impressão.
          </ThemedText>
        ) : null}
      </View>

      {/* As impressões como cartas: a minha e, revelada, a da outra pessoa. */}
      <View style={{ gap: Spacing.three }}>
        <Titulo>O que ficou para nós</Titulo>
        <Carta
          assinatura={registrei && !escrevendo ? eu : null}
          autorId={perfil?.membro_id}
          acessivel="Minha impressão"
          acao={
            registrei && !escrevendo ? (
              <Button label="Editar" accessibilityLabel="Editar minha impressão" variant="text" onPress={abrirEscrita} />
            ) : null
          }>
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
              {/* Apagar mora dentro da edição, longe do toque de todo dia. */}
              {registrei ? (
                <Button
                  label="Apagar minha impressão"
                  variant="destructive"
                  disabled={salvando}
                  onPress={() => {
                    setErroApagar(undefined);
                    setConfirmandoApagar(true);
                  }}
                />
              ) : null}
            </View>
          ) : registrei ? (
            <Voz>{minha?.texto}</Voz>
          ) : (
            <>
              <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.display, fontStyle: 'italic' }}>
                O que você vai querer lembrar daqui a alguns anos?
              </ThemedText>
              <Button label="Escrever minha impressão" variant="secondary" onPress={abrirEscrita} />
            </>
          )}
        </Carta>

        {outra && registrei ? (
          <Carta assinatura={daOutra?.texto ? outra : null} autorId={daOutra?.membroId} acessivel={`Impressão de ${outra}`}>
            {daOutra?.texto ? (
              <Voz>{daOutra.texto}</Voz>
            ) : (
              <ThemedText themeColor="textSecondary">{outra} ainda não registrou a impressão.</ThemedText>
            )}
          </Carta>
        ) : null}
        {impressoes.erro ? <MensagemErro>{impressoes.erro}</MensagemErro> : null}
      </View>

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

function Titulo({ children }: { children: string }) {
  return (
    <ThemedText type="subtitle" accessibilityRole="header" style={{ fontSize: 22, lineHeight: 30 }}>
      {children}
    </ThemedText>
  );
}

/** Texto de impressão na "voz" (Fraunces itálico, screens.md). As aspas já estão na carta. */
function Voz({ children }: { children: React.ReactNode }) {
  return <ThemedText style={{ fontFamily: FontFamily.display, fontStyle: 'italic', fontSize: 18, lineHeight: 28 }}>{children}</ThemedText>;
}

/**
 * Uma carta em papel: as aspas no fio abrem, a impressão em itálico e, no pé, a assinatura de quem
 * escreveu. O título invisível diz de quem é para o leitor de tela.
 */
function Carta({
  assinatura,
  autorId,
  acessivel,
  acao,
  children,
}: {
  assinatura: string | null;
  /** Para o retrato ao lado da assinatura (ADR 043). */
  autorId?: string;
  acessivel: string;
  /** Discreta, no pé, do lado oposto à assinatura (editar a própria). */
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: Spacing.four,
        paddingTop: Spacing.two,
        paddingBottom: Spacing.two,
        gap: Spacing.two,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: theme.papelBorda,
        backgroundColor: theme.papel,
      }}>
      <ThemedText accessibilityRole="header" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}>
        {acessivel}
      </ThemedText>
      <ThemedText
        importantForAccessibility="no"
        accessibilityElementsHidden
        style={{ fontFamily: FontFamily.display, fontSize: 48, lineHeight: 52, color: theme.accent, marginBottom: -Spacing.three }}>
        “
      </ThemedText>
      {children}
      {assinatura || acao ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <View>{acao}</View>
          {assinatura ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <Retrato membroId={autorId} tamanho={24} />
              <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.display, fontStyle: 'italic', fontSize: 16 }}>
                — {assinatura}
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type PolaroideProps = {
  /** Para o leitor de tela: de quem é o favorito. */
  rotulo: string;
  /** Escrito no pé da polaroide: o nome de quem escolheu. */
  legenda: string;
  caminho: string | null;
  /** Graus: as duas fotos ficam levemente tortas, como coladas à mão. */
  inclinacao: number;
  /** A moldura fechada da outra pessoa, antes da revelação. */
  guardado?: boolean;
  /** Sem foto escolhida: o que dizer embaixo da moldura. */
  children?: React.ReactNode;
};

function Polaroide({ rotulo, legenda, caminho, inclinacao, guardado = false, children }: PolaroideProps) {
  const theme = useTheme();
  const url = useUrlAssinada(caminho);
  const [aberta, setAberta] = useState(false);
  return (
    <View style={{ flex: 1, maxWidth: 200, gap: Spacing.two }}>
      <Pressable
        accessible
        accessibilityRole={caminho ? 'imagebutton' : undefined}
        accessibilityLabel={caminho ? rotulo : `${rotulo}: ainda não escolhido`}
        accessibilityHint={caminho ? 'Abre a foto na tela inteira.' : undefined}
        disabled={!url}
        onPress={() => setAberta(true)}
        // Apertar afunda a foto de leve, como quem pega no papel.
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}>
        <Moldura tamanho="pequena" inclinacao={inclinacao} style={{ gap: Spacing.two, paddingBottom: Spacing.three }}>
          <View
            style={{
              width: '100%',
              aspectRatio: 1,
              overflow: 'hidden',
              backgroundColor: theme.backgroundSelected,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {url ? (
              <Image
                source={{ uri: url, cacheKey: `capa:${caminho}` }}
                contentFit="cover"
                style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
                accessible={false}
              />
            ) : caminho ? null : (
              // Sem foto (ou ainda guardada): o fio no lugar, nunca vazio.
              <View style={{ width: guardado ? 24 : 48, height: 2, backgroundColor: theme.accent }} />
            )}
          </View>
          <ThemedText
            numberOfLines={1}
            style={{ fontFamily: FontFamily.display, fontStyle: 'italic', fontSize: 17, lineHeight: 22, textAlign: 'center' }}>
            {legenda}
          </ThemedText>
        </Moldura>
      </Pressable>
      {aberta && caminho ? <FotoEmTelaCheia url={url} cacheKey={`capa:${caminho}`} onFechar={() => setAberta(false)} /> : null}
      {!caminho && children ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          {children}
        </ThemedText>
      ) : null}
    </View>
  );
}
