import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, Modal, View } from 'react-native';

import { Abas } from '@/components/abas';
import { Button } from '@/components/button';
import { CartaoDoRoteiro } from '@/components/cartao-do-roteiro';
import { CamposDaExperiencia, duracaoDe, valoresDe, type ValoresDaExperiencia } from '@/components/campos-da-experiencia';
import { Confirmacao } from '@/components/confirmacao';
import { FolhaDeEdicao } from '@/components/folha-de-edicao';
import { MarcoDoLaco, type Marco } from '@/components/marco-do-laco';
import { MemoriaDaExperiencia } from '@/components/memoria-da-experiencia';
import { MensagemErro } from '@/components/mensagem-erro';
import { MomentosDaExperiencia } from '@/components/momentos-da-experiencia';
import { ReferenciaTemporalCampo } from '@/components/referencia-temporal-campo';
import { RoteiroDaExperiencia } from '@/components/roteiro-da-experiencia';
import { Screen } from '@/components/screen';
import { SecoesDePlanejamento } from '@/components/secoes-de-planejamento';
import { ScreenHeader, voltar } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useImpressoes } from '@/hooks/use-impressoes';
import { useRoteiro } from '@/hooks/use-roteiro';
import { useTheme } from '@/hooks/use-theme';
import { useUrlAssinada } from '@/hooks/use-url-assinada';
import type { Estado, Experiencia } from '@/services/experiencias';
import {
  camposDaReferencia,
  descreverReferencia,
  lerReferencia,
  lerReferenciaDaMemoria,
  SEM_DATA,
  type CamposDaReferencia,
} from '@/services/referencia-temporal';
import { validarTituloDoDesejo } from '@/services/validacao';

/**
 * Texto de cada estado, abaixo do título da experiência. A mudança de estado parece evolução da
 * experiência, não troca de coluna. Na memória, o lugar da frase é de quando e onde foi.
 */
const POR_ESTADO: Record<Estado, { eyebrow: string; frase: string }> = {
  desejo: { eyebrow: 'Desejo', frase: 'Ainda é só uma ideia por enquanto.' },
  planejamento: { eyebrow: 'Planejando', frase: 'Vamos começar a dar forma a isso.' },
  vivendo: { eyebrow: 'Vivendo', frase: 'Está acontecendo.' },
  memoria: { eyebrow: 'Memória', frase: 'Já faz parte da história de vocês.' },
};


type Aba = 'memoria' | 'momentos' | 'detalhes' | 'roteiro';
// A aba principal vem primeiro: a memória, os momentos em Vivendo, os detalhes em Planejamento.
// Com o roteiro ligado, a guia Roteiro entra logo depois da principal (na memória, depois dos momentos).
const ABAS: Record<Estado, { valor: Aba; rotulo: string }[]> = {
  desejo: [{ valor: 'detalhes', rotulo: 'Detalhes' }],
  planejamento: [
    { valor: 'detalhes', rotulo: 'Detalhes' },
    { valor: 'momentos', rotulo: 'Momentos' },
  ],
  vivendo: [
    { valor: 'momentos', rotulo: 'Momentos' },
    { valor: 'detalhes', rotulo: 'Detalhes' },
  ],
  memoria: [
    { valor: 'memoria', rotulo: 'Memória' },
    { valor: 'momentos', rotulo: 'Momentos' },
    { valor: 'detalhes', rotulo: 'Detalhes' },
  ],
};

export default function ExperienciaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { experiencias, carregando, recarregar } = useExperiencias();
  const experiencia = experiencias.find((e) => e.id === id);
  // Sobrevive à troca de estado (o formulário remonta ao virar memória) para mostrar o marco.
  const [finalizando, setFinalizando] = useState(false);
  // O marco da fase nova sobrevive à troca de estado (o formulário remonta a cada estado).
  const [marco, setMarco] = useState<Marco | null>(null);

  // Abre direto (link, app reaberto) ou volta para a tela: relê, a outra pessoa pode ter mudado algo.
  useFocusEffect(
    useCallback(() => {
      void recarregar();
    }, [recarregar])
  );

  if (!experiencia) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader
          eyebrow="Experiência"
          title={carregando ? 'Abrindo…' : 'Essa experiência não existe mais.'}
          description={carregando ? undefined : 'A outra pessoa pode tê-la excluído.'}
        />
        {carregando ? null : <Button label="Voltar para o Início" onPress={() => router.replace('/')} />}
      </Screen>
    );
  }

  // O formulário monta com a experiência carregada (já preenchido) e de novo a cada estado.
  return (
    <>
      <Formulario
        key={`${experiencia.id}-${experiencia.estado}`}
        experiencia={experiencia}
        recemFinalizada={finalizando}
        onFinalizando={setFinalizando}
        onMarco={setMarco}
      />
      <MarcoDoLaco marco={marco} onFim={() => setMarco(null)} />
    </>
  );
}

type FormularioProps = {
  experiencia: Experiencia;
  recemFinalizada: boolean;
  onFinalizando: (valor: boolean) => void;
  /** A fase avançou (planejamento, vivendo ou memória): mostra o marco com o laço. */
  onMarco: (marco: Marco) => void;
};

function Formulario({ experiencia, recemFinalizada, onFinalizando, onMarco }: FormularioProps) {
  const theme = useTheme();
  const { atualizarExperiencia, excluirExperiencia, mudarEstado, finalizar, definirRoteiro } = useExperiencias();
  const [valores, setValores] = useState<ValoresDaExperiencia>(() => valoresDe(experiencia));
  const [erroTitulo, setErroTitulo] = useState<string>();
  const [erroReferencia, setErroReferencia] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mudando, setMudando] = useState(false);
  const [erroTransicao, setErroTransicao] = useState<string>();
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string>();
  const [confirmandoFinal, setConfirmandoFinal] = useState(false);
  const [pedindoData, setPedindoData] = useState(false);
  const [quando, setQuando] = useState<CamposDaReferencia>(() => camposDaReferencia(SEM_DATA));
  const [erroQuando, setErroQuando] = useState<string>();
  const [erroFinal, setErroFinal] = useState<string>();

  const estado = experiencia.estado;
  const desejo = estado === 'desejo';
  const memoria = estado === 'memoria';
  const roteiro = useRoteiro(experiencia.id);
  const carregarRoteiro = roteiro.carregar;
  // Na memória, a guia só aparece com algo no roteiro (ADR 040).
  const comRoteiro = experiencia.roteiroAtivo && (!memoria || roteiro.itens.length > 0);
  const posicaoDoRoteiro = memoria ? 2 : 1;
  const abas = comRoteiro
    ? [
        ...ABAS[estado].slice(0, posicaoDoRoteiro),
        { valor: 'roteiro' as const, rotulo: 'Roteiro' },
        ...ABAS[estado].slice(posicaoDoRoteiro),
      ]
    : ABAS[estado];
  const textos = POR_ESTADO[estado];
  const destaque = useUrlAssinada(memoria ? (experiencia.fotoDestaque?.caminho ?? null) : null);
  const ondeEQuando = [descreverReferencia(experiencia.referencia), experiencia.local].filter(Boolean).join(' · ');
  const impressoes = useImpressoes(experiencia.id);
  const carregarImpressoes = impressoes.carregar;
  // O que importa em cada momento: a memória; vivendo, os momentos; planejando, os detalhes.
  const [abaEscolhida, setAba] = useState<Aba>(memoria ? 'memoria' : estado === 'vivendo' ? 'momentos' : 'detalhes');
  // O roteiro foi desligado (aqui ou pela outra pessoa) com a guia aberta: volta para a principal.
  const aba = abas.some((a) => a.valor === abaEscolhida) ? abaEscolhida : abas[0].valor;
  const [confirmandoDesligar, setConfirmandoDesligar] = useState(false);
  const [mudandoRoteiro, setMudandoRoteiro] = useState(false);
  const [erroRoteiro, setErroRoteiro] = useState<string>();

  useFocusEffect(
    useCallback(() => {
      if (memoria) void carregarImpressoes();
    }, [memoria, carregarImpressoes])
  );

  const roteiroAtivo = experiencia.roteiroAtivo;
  useFocusEffect(
    useCallback(() => {
      if (roteiroAtivo) void carregarRoteiro();
    }, [roteiroAtivo, carregarRoteiro])
  );

  async function salvar() {
    const tituloInvalido = validarTituloDoDesejo(valores.titulo);
    const referencia = (memoria ? lerReferenciaDaMemoria : lerReferencia)(valores.referencia);
    setErroTitulo(tituloInvalido);
    setErroReferencia(referencia.ok ? undefined : referencia.erro);
    if (tituloInvalido || !referencia.ok) return;

    setEnviando(true);
    setErroGeral(undefined);
    setSalvo(false);
    const r = await atualizarExperiencia(experiencia.id, { ...valores, tamanho: duracaoDe(valores), referencia: referencia.referencia });
    setEnviando(false);
    if (r.ok) {
      setSalvo(true);
    } else if (r.codigo === 'desejo_inexistente') {
      router.replace(desejo ? '/desejos' : '/');
    } else {
      setErroGeral(r.mensagem);
    }
  }

  /** O card do roteiro liga e desliga na hora, à parte do "Salvar" (ADR 040). */
  async function mudarRoteiro(ativo: boolean) {
    setMudandoRoteiro(true);
    setErroRoteiro(undefined);
    const r = await definirRoteiro(experiencia.id, ativo);
    setMudandoRoteiro(false);
    setConfirmandoDesligar(false);
    if (r.ok) {
      AccessibilityInfo.announceForAccessibility(ativo ? 'Roteiro ligado. A guia Roteiro está aberta.' : 'Roteiro desligado.');
      // Desligou: o servidor excluiu o roteiro.
      if (!ativo) void carregarRoteiro();
    } else if (r.codigo === 'desejo_inexistente') {
      router.replace(desejo ? '/desejos' : '/');
    } else {
      setErroRoteiro(r.mensagem);
    }
  }

  // Desligar exclui os itens: com algum, antes a confirmação.
  const desligarRoteiro = () => (roteiro.itens.length > 0 ? setConfirmandoDesligar(true) : void mudarRoteiro(false));

  const diasComItens = new Set(roteiro.itens.map((i) => i.dia)).size;
  const resumoDoRoteiro = roteiro.itens.length
    ? `${roteiro.itens.length} ${roteiro.itens.length === 1 ? 'item' : 'itens'} em ${diasComItens} ${diasComItens === 1 ? 'dia' : 'dias'}`
    : null;

  async function irPara(novo: Estado, anuncio: string) {
    setMudando(true);
    setErroTransicao(undefined);
    const r = await mudarEstado(experiencia.id, novo);
    setMudando(false);
    if (r.ok) {
      AccessibilityInfo.announceForAccessibility(anuncio);
      // Só a fase que avança ganha marco; voltar de fase não.
      const avancou = (estado === 'desejo' && novo === 'planejamento') || (estado === 'planejamento' && novo === 'vivendo');
      if (avancou) onMarco(novo as Marco);
    } else if (r.codigo === 'desejo_inexistente') {
      router.replace(desejo ? '/desejos' : '/');
    } else {
      setErroTransicao(r.mensagem);
    }
  }

  /** Finalizar (lifecycle.md): sem data, primeiro pergunta quando viveram; sem volta, sempre confirmado. */
  async function concluirFinal(comData: boolean) {
    let referencia = null;
    if (comData) {
      const leitura = lerReferenciaDaMemoria(quando);
      if (!leitura.ok) {
        setErroQuando(leitura.erro);
        return;
      }
      referencia = leitura.referencia;
    }
    setMudando(true);
    setErroFinal(undefined);
    onFinalizando(true);
    const r = await finalizar(experiencia.id, referencia);
    if (r.ok) {
      AccessibilityInfo.announceForAccessibility('Essa experiência virou uma memória.');
      onMarco('memoria');
      return; // A tela remonta como memória.
    }
    onFinalizando(false);
    setMudando(false);
    if (r.codigo === 'referencia_obrigatoria') {
      setConfirmandoFinal(false);
      setPedindoData(true);
    } else if (r.codigo === 'desejo_inexistente') {
      router.replace('/');
    } else {
      setErroFinal(r.mensagem);
    }
  }

  function confirmarFinal() {
    if (experiencia.referencia.precisao === 'sem_data') {
      setConfirmandoFinal(false);
      setErroQuando(undefined);
      setPedindoData(true);
    } else {
      void concluirFinal(false);
    }
  }

  async function excluir() {
    setExcluindo(true);
    setErroExclusao(undefined);
    const r = await excluirExperiencia(experiencia.id);
    if (r.ok) {
      setConfirmandoExclusao(false);
      router.replace(desejo ? '/desejos' : memoria ? '/nossa-historia' : '/');
    } else {
      setExcluindo(false);
      setErroExclusao(r.mensagem);
    }
  }

  const ocupado = enviando || excluindo || mudando;

  const detalhes = (
    <>
      {/* Mudança de estado: só as transições do ciclo; o servidor também confere. */}
      <View style={{ gap: Spacing.two, marginBottom: Spacing.four }}>
        {estado === 'desejo' ? (
          <Button
            label="Começar planejamento"
            loading={mudando}
            disabled={ocupado}
            onPress={() => irPara('planejamento', 'Planejamento começado')}
          />
        ) : null}
        {estado === 'planejamento' ? (
          <>
            <Button
              label="Começar a viver"
              loading={mudando}
              disabled={ocupado}
              onPress={() => irPara('vivendo', 'Experiência começou')}
            />
            <Button
              label="Voltar para desejo"
              variant="text"
              disabled={ocupado}
              onPress={() => irPara('desejo', 'Voltou para desejo')}
            />
          </>
        ) : null}
        {erroTransicao && estado !== 'vivendo' ? <MensagemErro>{erroTransicao}</MensagemErro> : null}
      </View>

      <View style={{ gap: Spacing.three }}>
        <CamposDaExperiencia
          valores={valores}
          exigirData={memoria}
          erroTitulo={erroTitulo}
          erroReferencia={erroReferencia}
          onChange={(novos) => {
            setValores(novos);
            setErroTitulo(undefined);
            setErroReferencia(undefined);
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
        <Button label="Salvar" loading={enviando} disabled={excluindo || mudando} onPress={salvar} />
      </View>

      <View style={{ marginTop: Spacing.five }}>
        <SecoesDePlanejamento experiencia={experiencia} />
      </View>

      {/* Na memória, o roteiro não começa: a guia só aparece se já houver itens. */}
      {memoria ? null : (
        <View style={{ marginTop: Spacing.five }}>
          <CartaoDoRoteiro
            ativo={experiencia.roteiroAtivo}
            tamanho={duracaoDe(valores)}
            resumo={resumoDoRoteiro}
            ocupado={mudandoRoteiro}
            erro={erroRoteiro}
            onUsar={() => void mudarRoteiro(true)}
            onDesligar={desligarRoteiro}
            onAbrir={() => setAba('roteiro')}
          />
        </View>
      )}

      {/* Ações secundárias: em Vivendo, voltar para o planejamento fica aqui, longe dos momentos. */}
      <View style={{ gap: Spacing.two, marginTop: Spacing.five }}>
        {estado === 'vivendo' ? (
          <>
            <Button
              label="Voltar para planejamento"
              variant="secondary"
              loading={mudando}
              disabled={ocupado}
              onPress={() => irPara('planejamento', 'Voltou para planejamento')}
            />
            {erroTransicao ? <MensagemErro>{erroTransicao}</MensagemErro> : null}
          </>
        ) : null}
        <Button
          label={desejo ? 'Excluir desejo' : memoria ? 'Excluir memória' : 'Excluir experiência'}
          variant="destructive"
          disabled={ocupado}
          onPress={() => {
            setErroExclusao(undefined);
            setConfirmandoExclusao(true);
          }}
        />
      </View>
    </>
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader
        eyebrow={textos.eyebrow}
        title={experiencia.titulo}
        description={memoria ? ondeEQuando || textos.frase : textos.frase}
        onBack={voltar}
      />

      {/* Na memória, a foto de destaque assume (screens.md) e acompanha as três abas. */}
      {memoria && experiencia.fotoDestaque ? (
        <View
          style={{
            width: '100%',
            aspectRatio: 4 / 3,
            borderRadius: Radius.photo,
            overflow: 'hidden',
            backgroundColor: theme.backgroundSelected,
            marginTop: -Spacing.two,
            marginBottom: Spacing.four,
          }}>
          {destaque ? (
            <Image
              source={{ uri: destaque, cacheKey: `capa:${experiencia.fotoDestaque?.caminho}` }}
              contentFit="cover"
              style={{ flex: 1 }}
              transition={200}
              accessibilityLabel={`Foto de destaque de ${experiencia.titulo}`}
            />
          ) : null}
        </View>
      ) : null}

      {/* Registros existem a partir de Planejamento (memory.md); em Desejo, só há abas com o roteiro ligado. */}
      {abas.length > 1 ? (
        <>
          <Abas<Aba> abas={abas} atual={aba} onChange={setAba} />
          {aba === 'memoria' ? (
            <MemoriaDaExperiencia experiencia={experiencia} impressoes={impressoes} recemFinalizada={recemFinalizada} />
          ) : aba === 'roteiro' ? (
            <RoteiroDaExperiencia experiencia={experiencia} roteiro={roteiro} />
          ) : aba === 'momentos' ? (
            <MomentosDaExperiencia
              experiencia={experiencia}
              finalizar={
                estado === 'vivendo'
                  ? {
                      disabled: ocupado,
                      onPress: () => {
                        setErroFinal(undefined);
                        setConfirmandoFinal(true);
                      },
                    }
                  : undefined
              }
              favorito={
                memoria
                  ? {
                      fotoId: impressoes.minha?.momentoFavorito?.id ?? null,
                      escolher: impressoes.escolherFavorito,
                      recarregar: () => void carregarImpressoes(),
                    }
                  : undefined
              }
            />
          ) : (
            detalhes
          )}
        </>
      ) : (
        detalhes
      )}

      <Confirmacao
        visible={confirmandoFinal}
        title="Finalizar experiência?"
        description="Ela vira uma memória e não volta para Vivendo. Fotos e observações continuam com ela."
        confirmLabel="Finalizar"
        cancelLabel="Ainda não"
        loading={mudando}
        error={erroFinal}
        onConfirm={confirmarFinal}
        onCancel={() => setConfirmandoFinal(false)}
      />

      <Modal
        testID="quando-viveram"
        visible={pedindoData}
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={mudando ? undefined : () => setPedindoData(false)}>
        <FolhaDeEdicao>
          <ThemedText type="subtitle" style={{ fontSize: 26, lineHeight: 34 }} accessibilityRole="header">
            Quando vocês viveram isso?
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Uma memória precisa de quando aconteceu: é por aí que Nossa História se organiza.
          </ThemedText>
          <ReferenciaTemporalCampo
            obrigatoria
            campos={quando}
            erro={erroQuando}
            onChange={(c) => {
              setQuando(c);
              setErroQuando(undefined);
            }}
          />
          {erroFinal ? <MensagemErro>{erroFinal}</MensagemErro> : null}
          <Button label="Finalizar" loading={mudando} onPress={() => concluirFinal(true)} />
          <Button label="Ainda não" variant="secondary" disabled={mudando} onPress={() => setPedindoData(false)} />
        </FolhaDeEdicao>
      </Modal>

      <Confirmacao
        visible={confirmandoDesligar}
        title="Desligar o roteiro?"
        description={`${roteiro.itens.length === 1 ? 'O item do roteiro será excluído' : `Os ${roteiro.itens.length} itens do roteiro serão excluídos`}, para os dois. Não dá para desfazer.`}
        confirmLabel="Sim, desligar e excluir"
        destructive
        loading={mudandoRoteiro}
        error={erroRoteiro}
        onConfirm={() => void mudarRoteiro(false)}
        onCancel={() => setConfirmandoDesligar(false)}
      />

      <Confirmacao
        visible={confirmandoExclusao}
        title={desejo ? 'Excluir este desejo?' : memoria ? 'Excluir esta memória?' : 'Excluir esta experiência?'}
        description={
          desejo
            ? 'Essa ação é definitiva e vale para os dois. O desejo deixa de existir e não dá para desfazer.'
            : memoria
              ? 'Essa ação é definitiva e vale para os dois. A memória, as fotos, as observações e as impressões deixam de existir.'
              : 'Essa ação é definitiva e vale para os dois. A experiência e as fotos guardadas nela deixam de existir.'
        }
        confirmLabel={desejo ? 'Sim, excluir desejo' : memoria ? 'Sim, excluir memória' : 'Sim, excluir experiência'}
        destructive
        loading={excluindo}
        error={erroExclusao}
        onConfirm={excluir}
        onCancel={() => setConfirmandoExclusao(false)}
      />
    </Screen>
  );
}
