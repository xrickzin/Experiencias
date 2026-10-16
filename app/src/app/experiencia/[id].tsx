import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { Abas } from '@/components/abas';
import { Button } from '@/components/button';
import { CamposDaExperiencia, valoresDe, type ValoresDaExperiencia } from '@/components/campos-da-experiencia';
import { Confirmacao } from '@/components/confirmacao';
import { FotosDaExperiencia } from '@/components/fotos-da-experiencia';
import { MensagemErro } from '@/components/mensagem-erro';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import type { Estado, Experiencia } from '@/services/experiencias';
import { lerReferencia } from '@/services/referencia-temporal';
import { validarTituloDoDesejo } from '@/services/validacao';

/** Texto de cada estado. A mudança de estado parece evolução da experiência, não troca de coluna. */
const POR_ESTADO: Record<Estado, { eyebrow: string; titulo: string; descricao: string }> = {
  desejo: { eyebrow: 'Desejo', titulo: 'Ainda é só uma ideia por enquanto.', descricao: 'Guardem o que já sabem.' },
  planejamento: {
    eyebrow: 'Planejando',
    titulo: 'Vamos começar a dar forma a isso.',
    descricao: 'Juntem o que já decidiram, no tempo de vocês.',
  },
  vivendo: { eyebrow: 'Vivendo', titulo: 'Está acontecendo.', descricao: 'Guardem o que estão vivendo.' },
  memoria: { eyebrow: 'Memória', titulo: 'Já faz parte da história de vocês.', descricao: '' },
};

type Aba = 'fotos' | 'detalhes';
// A aba principal vem primeiro: fotos em Vivendo, detalhes em Planejamento.
const ABAS_VIVENDO: { valor: Aba; rotulo: string }[] = [
  { valor: 'fotos', rotulo: 'Fotos' },
  { valor: 'detalhes', rotulo: 'Detalhes' },
];
const ABAS_PLANEJANDO: { valor: Aba; rotulo: string }[] = [
  { valor: 'detalhes', rotulo: 'Detalhes' },
  { valor: 'fotos', rotulo: 'Fotos' },
];

export default function ExperienciaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { experiencias, carregando, recarregar } = useExperiencias();
  const experiencia = experiencias.find((e) => e.id === id);

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

  // O formulário só monta com a experiência carregada, então começa já preenchido.
  return <Formulario key={experiencia.id} experiencia={experiencia} />;
}

function Formulario({ experiencia }: { experiencia: Experiencia }) {
  const { atualizarExperiencia, excluirExperiencia, mudarEstado } = useExperiencias();
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

  const estado = experiencia.estado;
  const desejo = estado === 'desejo';
  const temFotos = estado === 'planejamento' || estado === 'vivendo';
  const textos = POR_ESTADO[estado];
  // O que importa em cada momento: vivendo, as fotos; planejando, os detalhes e o "começar a viver".
  const [aba, setAba] = useState<Aba>(estado === 'vivendo' ? 'fotos' : 'detalhes');

  async function salvar() {
    const tituloInvalido = validarTituloDoDesejo(valores.titulo);
    const referencia = lerReferencia(valores.referencia);
    setErroTitulo(tituloInvalido);
    setErroReferencia(referencia.ok ? undefined : referencia.erro);
    if (tituloInvalido || !referencia.ok) return;

    setEnviando(true);
    setErroGeral(undefined);
    const r = await atualizarExperiencia(experiencia.id, { ...valores, referencia: referencia.referencia });
    setEnviando(false);
    if (r.ok) {
      setSalvo(true);
    } else if (r.codigo === 'desejo_inexistente') {
      router.replace(desejo ? '/desejos' : '/');
    } else {
      setErroGeral(r.mensagem);
    }
  }

  async function irPara(novo: Estado, anuncio: string) {
    setMudando(true);
    setErroTransicao(undefined);
    const r = await mudarEstado(experiencia.id, novo);
    setMudando(false);
    if (r.ok) {
      AccessibilityInfo.announceForAccessibility(anuncio);
      // Começou a viver: a tela abre nas fotos, que passam a ser o principal.
      if (novo === 'vivendo') setAba('fotos');
    } else if (r.codigo === 'desejo_inexistente') {
      router.replace(desejo ? '/desejos' : '/');
    } else {
      setErroTransicao(r.mensagem);
    }
  }

  async function excluir() {
    setExcluindo(true);
    setErroExclusao(undefined);
    const r = await excluirExperiencia(experiencia.id);
    if (r.ok) {
      setConfirmandoExclusao(false);
      router.replace(desejo ? '/desejos' : '/');
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

      {/* Ações secundárias: em Vivendo, voltar para o planejamento fica aqui, longe das fotos. */}
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
          label={desejo ? 'Excluir desejo' : 'Excluir experiência'}
          variant="secondary"
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
      <ScreenHeader eyebrow={textos.eyebrow} title={textos.titulo} description={textos.descricao || undefined} />

      {/* Registros (fotos) existem a partir de Planejamento (memory.md); em Desejo não há abas. */}
      {temFotos ? (
        <>
          <Abas<Aba>
            abas={estado === 'vivendo' ? ABAS_VIVENDO : ABAS_PLANEJANDO}
            atual={aba}
            onChange={setAba}
          />
          {aba === 'fotos' ? <FotosDaExperiencia experiencia={experiencia} /> : detalhes}
        </>
      ) : (
        detalhes
      )}

      <View style={{ marginTop: Spacing.two }}>
        <Button label="Voltar" variant="text" disabled={ocupado} onPress={() => router.back()} />
      </View>

      <Confirmacao
        visible={confirmandoExclusao}
        title={desejo ? 'Excluir este desejo?' : 'Excluir esta experiência?'}
        description={
          desejo
            ? 'Essa ação é definitiva e vale para os dois. O desejo deixa de existir e não dá para desfazer.'
            : 'Essa ação é definitiva e vale para os dois. A experiência e as fotos guardadas nela deixam de existir.'
        }
        confirmLabel={desejo ? 'Sim, excluir desejo' : 'Sim, excluir experiência'}
        destructive
        loading={excluindo}
        error={erroExclusao}
        onConfirm={excluir}
        onCancel={() => setConfirmandoExclusao(false)}
      />
    </Screen>
  );
}
