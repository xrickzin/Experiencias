import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { Confirmacao } from '@/components/confirmacao';
import { MensagemErro } from '@/components/mensagem-erro';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useFotos } from '@/hooks/use-fotos';
import { useObservacoes } from '@/hooks/use-observacoes';
import { useSessao } from '@/hooks/use-sessao';
import { useTheme } from '@/hooks/use-theme';
import {
  agruparFotos,
  capturaDoExif,
  diaEPeriodo,
  instanteDoMomento,
  ROTULO_DO_PERIODO,
  rotuloDoDia,
  type Periodo,
} from '@/services/agrupar-fotos';
import type { Experiencia } from '@/services/experiencias';
import { LIMITE_DA_LEGENDA, type ArquivoDeFoto, type Foto } from '@/services/fotos';
import type { Resultado } from '@/services/laco';
import { LIMITE_DA_OBSERVACAO, type Observacao } from '@/services/observacoes';
import { lerData, mascararData } from '@/services/referencia-temporal';

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

type Item = (Foto & { tipo: 'foto' }) | (Observacao & { tipo: 'observacao' });

/** Em Memória: o momento favorito de quem está vendo (individual; ADR 012). */
export type MeuFavorito = {
  fotoId: string | null;
  escolher: (fotoId: string | null) => Promise<Resultado>;
  recarregar: () => void;
};

/**
 * Momentos de uma experiência em Planejamento, Vivendo ou Memória: fotos e observações (registros,
 * memory.md), agrupadas por dia e por período no horário de Brasília, das mais recentes para as antigas.
 */
export function MomentosDaExperiencia({ experiencia, favorito }: { experiencia: Experiencia; favorito?: MeuFavorito }) {
  const theme = useTheme();
  const { perfil } = useSessao();
  const { fotos, carregando, erro, envio, carregar, enviar, excluir, legendar } = useFotos(experiencia.id);
  const observacoes = useObservacoes(experiencia.id);
  const [erroDaAcao, setErroDaAcao] = useState<string>();
  const [aberta, setAberta] = useState<Foto | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string>();
  const { definirDestaque, recarregar } = useExperiencias();
  const [marcando, setMarcando] = useState(false);
  const [erroDestaque, setErroDestaque] = useState<string>();
  // Observação em edição: `nova` para escrever uma, ou a que foi tocada.
  const [editando, setEditando] = useState<Observacao | 'nova' | null>(null);
  // Três miniaturas por linha ocupando a largura toda: o lado sai da largura medida da grade.
  const [lado, setLado] = useState<number>();
  // Foto de destaque: compartilhada, escolhida à mão (ADR 012 e 028). Aparece no Início.
  const destaqueId = experiencia.fotoDestaque?.id ?? null;
  const carregarObservacoes = observacoes.carregar;

  useFocusEffect(
    useCallback(() => {
      void carregar();
      void carregarObservacoes();
    }, [carregar, carregarObservacoes])
  );

  const nomeDoAutor = (autorId: string | null) => {
    if (!autorId || !perfil) return null;
    return autorId === perfil.membro_id ? perfil.nome : perfil.companheiro_nome;
  };

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
      // Era o meu favorito: o servidor também o limpou.
      if (aberta.id === favorito?.fotoId) favorito.recarregar();
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

  async function alternarFavorito() {
    if (!aberta || !favorito) return;
    setMarcando(true);
    setErroDestaque(undefined);
    const r = await favorito.escolher(aberta.id === favorito.fotoId ? null : aberta.id);
    setMarcando(false);
    if (!r.ok) setErroDestaque(r.mensagem);
  }

  const enviando = envio !== null;
  const itens: Item[] = [
    ...fotos.map((f) => ({ ...f, tipo: 'foto' as const })),
    ...observacoes.observacoes.map((o) => ({ ...o, tipo: 'observacao' as const })),
  ];
  const grupos = agruparFotos(itens, new Date());
  // Numeração na ordem em que aparecem, para o leitor de tela dizer "Foto 3 de 12".
  const ordem = grupos.flatMap((g) => g.periodos.flatMap((p) => p.fotos.filter((i) => i.tipo === 'foto')));
  const posicao = new Map(ordem.map((f, i) => [f.id, i + 1]));
  const ehFavorito = (id: string) => favorito?.fotoId === id;

  // Vivendo: guardar o momento vem primeiro, com a câmera em destaque. Antes e depois, o que já
  // foi guardado é o protagonista e as ações ficam abaixo, discretas.
  const vivendo = experiencia.estado === 'vivendo';
  const acoes = (
    <View style={{ gap: Spacing.two }}>
      <Button label="Tirar foto" variant={vivendo ? 'primary' : 'secondary'} disabled={enviando} onPress={tirarFoto} />
      <Button label="Escolher da galeria" variant="secondary" disabled={enviando} onPress={escolherDaGaleria} />
      <Button label="Escrever observação do momento" variant="secondary" onPress={() => setEditando('nova')} />
      {enviando ? (
        <ThemedText type="small" accessibilityLiveRegion="polite">
          {envio.total > 1 ? `Guardando foto ${envio.atual} de ${envio.total}…` : 'Guardando foto…'}
        </ThemedText>
      ) : null}
      {erro ? <MensagemErro>{erro}</MensagemErro> : null}
      {observacoes.erro ? <MensagemErro>{observacoes.erro}</MensagemErro> : null}
      {erroDaAcao ? <MensagemErro>{erroDaAcao}</MensagemErro> : null}
    </View>
  );

  return (
    <View style={{ gap: Spacing.four }}>
      {vivendo ? acoes : null}

      {carregando && itens.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Carregando momentos…
        </ThemedText>
      ) : itens.length === 0 ? (
        <ThemedText themeColor="textSecondary">
          Nenhum momento ainda. Fotos e observações aparecem aqui, organizadas por dia e período.
        </ThemedText>
      ) : (
        grupos.map((grupo, i) => (
          <View key={grupo.dia} style={{ gap: Spacing.three }}>
            {/* O primeiro dia encosta na linha das abas; o filete só separa das ações ou do dia anterior. */}
            <ThemedText
              type="subtitle"
              accessibilityRole="header"
              style={{
                fontSize: 22,
                lineHeight: 30,
                borderTopWidth: i > 0 || vivendo ? 1 : 0,
                borderTopColor: theme.border,
                paddingTop: i > 0 || vivendo ? Spacing.three : 0,
              }}>
              {grupo.rotulo}
            </ThemedText>
            {grupo.periodos.map(({ periodo, fotos: doPeriodo }) => {
              const fotosDoPeriodo = doPeriodo.filter((i): i is Foto & { tipo: 'foto' } => i.tipo === 'foto');
              const obsDoPeriodo = doPeriodo.filter((i): i is Observacao & { tipo: 'observacao' } => i.tipo === 'observacao');
              return (
                <View key={periodo} style={{ gap: Spacing.two }}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={{ letterSpacing: 1 }}>
                    {ROTULO_DO_PERIODO[periodo].toUpperCase()}
                  </ThemedText>
                  {fotosDoPeriodo.length > 0 ? (
                    <View
                      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}
                      onLayout={(e) => setLado(Math.floor((e.nativeEvent.layout.width - 2 * Spacing.two) / 3))}>
                      {fotosDoPeriodo.map((foto) => {
                        const marcas = [
                          foto.id === destaqueId ? 'foto de destaque' : null,
                          ehFavorito(foto.id) ? 'seu momento favorito' : null,
                        ].filter(Boolean);
                        return (
                          <Pressable
                            key={foto.id}
                            accessibilityRole="imagebutton"
                            accessibilityLabel={`Foto ${posicao.get(foto.id)} de ${fotos.length}, ${grupo.rotulo.toLowerCase()}, ${ROTULO_DO_PERIODO[periodo].toLowerCase()}${foto.legenda ? `, legenda: ${foto.legenda}` : ''}${marcas.length ? `, ${marcas.join(', ')}` : ''}`}
                            onPress={() => {
                              setErroDestaque(undefined);
                              setAberta(foto);
                            }}
                            style={{
                              width: lado ?? '31%',
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
                            {foto.id === destaqueId || ehFavorito(foto.id) ? (
                              <View
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  bottom: 0,
                                  paddingHorizontal: Spacing.one,
                                  paddingVertical: Spacing.half,
                                  backgroundColor: foto.id === destaqueId ? theme.text : theme.accent,
                                }}>
                                <ThemedText type="smallBold" themeColor="background" style={{ fontSize: 11, lineHeight: 14 }}>
                                  {foto.id === destaqueId ? 'DESTAQUE' : 'FAVORITO'}
                                </ThemedText>
                              </View>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                  {obsDoPeriodo.map((obs) => {
                    const autor = nomeDoAutor(obs.autorId);
                    return (
                      <Pressable
                        key={obs.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Observação de ${grupo.rotulo.toLowerCase()}, ${ROTULO_DO_PERIODO[periodo].toLowerCase()}${autor ? `, de ${autor}` : ''}: ${obs.texto}. Editar`}
                        onPress={() => setEditando(obs)}
                        style={({ pressed }) => ({
                          gap: Spacing.half,
                          paddingLeft: Spacing.three,
                          paddingVertical: Spacing.one,
                          borderLeftWidth: 2,
                          borderLeftColor: theme.accent,
                          opacity: pressed ? 0.7 : 1,
                        })}>
                        <ThemedText>{obs.texto}</ThemedText>
                        {autor ? (
                          <ThemedText type="small" themeColor="textSecondary">
                            {autor}
                          </ThemedText>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </View>
        ))
      )}

      {vivendo ? null : (
        <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: Spacing.four }}>{acoes}</View>
      )}

      <EditorDeObservacao
        key={editando === null ? 'fechado' : editando === 'nova' ? 'nova' : editando.id}
        observacao={editando}
        onSalvar={(texto, momentoEm) =>
          editando && editando !== 'nova'
            ? observacoes.editar(editando.id, texto, momentoEm)
            : observacoes.criar(texto, momentoEm)
        }
        onExcluir={editando && editando !== 'nova' ? () => observacoes.excluir(editando.id) : undefined}
        onFechar={() => setEditando(null)}
      />

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
          {aberta ? (
            <Legenda
              key={aberta.id}
              legenda={aberta.legenda}
              onSalvar={async (texto) => {
                const r = await legendar(aberta.id, texto);
                if (r.ok) setAberta({ ...aberta, legenda: r.legenda });
                return r;
              }}
            />
          ) : null}
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
          {favorito && aberta ? (
            <Button
              label={ehFavorito(aberta.id) ? 'Deixar de ser meu momento favorito' : 'Escolher como meu momento favorito'}
              variant="secondary"
              disabled={marcando}
              onPress={alternarFavorito}
            />
          ) : null}
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

type EditorProps = {
  observacao: Observacao | 'nova' | null;
  onSalvar: (texto: string, momentoEm: string) => Promise<Resultado>;
  onExcluir?: () => Promise<Resultado>;
  onFechar: () => void;
};

const PERIODOS: Periodo[] = ['madrugada', 'manha', 'tarde', 'noite'];
type QualDia = 'hoje' | 'ontem' | 'outro';

/** Momento inicial do editor: o da observação (dia e período) ou agora. */
function momentoInicial(observacao: Observacao | 'nova' | null, agora: Date) {
  const iso = observacao && observacao !== 'nova' ? (observacao.capturadaEm ?? observacao.criadoEm) : agora.toISOString();
  const { dia, periodo } = diaEPeriodo(iso);
  const hoje = diaEPeriodo(agora.toISOString()).dia;
  const ontem = diaEPeriodo(new Date(agora.getTime() - 86_400_000).toISOString()).dia;
  const qual: QualDia = dia === hoje ? 'hoje' : dia === ontem ? 'ontem' : 'outro';
  const [ano, mes, d] = dia.split('-');
  return { qual, data: qual === 'outro' ? `${d}/${mes}/${ano}` : '', periodo, hoje, ontem };
}

/**
 * Escrever ou editar uma observação do momento: o texto fica guardado no dia e período escolhidos
 * (agora, por padrão), junto das fotos desse momento (ADR 030). Excluir pede confirmação.
 */
function EditorDeObservacao({ observacao, onSalvar, onExcluir, onFechar }: EditorProps) {
  const theme = useTheme();
  const [agora] = useState(() => new Date());
  const inicial = momentoInicial(observacao, agora);
  const [qualDia, setQualDia] = useState<QualDia>(inicial.qual);
  const [outroDia, setOutroDia] = useState(inicial.data);
  const [periodo, setPeriodo] = useState<Periodo>(inicial.periodo);
  const [texto, setTexto] = useState(observacao && observacao !== 'nova' ? observacao.texto : '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string>();
  const [erroDia, setErroDia] = useState<string>();

  const dia = qualDia === 'hoje' ? inicial.hoje : qualDia === 'ontem' ? inicial.ontem : lerData(outroDia);
  const diaNoFuturo = Boolean(dia && dia > inicial.hoje);
  const onde = dia && !diaNoFuturo ? `${rotuloDoDia(dia, agora)} · ${ROTULO_DO_PERIODO[periodo]}` : null;

  async function salvar() {
    if (!texto.trim()) {
      setErro('Escreva algo antes de guardar.');
      return;
    }
    if (!dia || diaNoFuturo) {
      setErroDia(dia ? 'Escolham um dia que já aconteceu.' : 'Informe o dia como DD/MM/AAAA, por exemplo 12/10/2026.');
      return;
    }
    setSalvando(true);
    setErro(undefined);
    const r = await onSalvar(texto, instanteDoMomento(dia, periodo, agora));
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
      testID="editor-de-observacao"
      visible={observacao !== null}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onFechar}>
      <View style={{ flex: 1, backgroundColor: theme.background, padding: Spacing.four, gap: Spacing.three, justifyContent: 'center' }}>
        <ThemedText type="subtitle" style={{ fontSize: 24, lineHeight: 32 }} accessibilityRole="header">
          Observação do momento
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          Contem o que aconteceu ou o que querem lembrar. Ela fica guardada no dia e no período escolhidos, junto das
          fotos desse momento.
        </ThemedText>
        <ThemedText type="smallBold">Quando foi?</ThemedText>
        <Opcoes<QualDia>
          rotulo="Dia"
          opcoes={[
            { valor: 'hoje', rotulo: 'Hoje' },
            { valor: 'ontem', rotulo: 'Ontem' },
            { valor: 'outro', rotulo: 'Outro dia' },
          ]}
          atual={qualDia}
          onChange={(v) => {
            setQualDia(v);
            setErroDia(undefined);
          }}
        />
        {qualDia === 'outro' ? (
          <TextField
            label="Dia do momento"
            placeholder="DD/MM/AAAA"
            value={outroDia}
            onChangeText={(t) => {
              setOutroDia(mascararData(t));
              setErroDia(undefined);
            }}
            keyboardType="number-pad"
            maxLength={10}
          />
        ) : null}
        <Opcoes<Periodo>
          rotulo="Período"
          opcoes={PERIODOS.map((p) => ({ valor: p, rotulo: ROTULO_DO_PERIODO[p] }))}
          atual={periodo}
          onChange={setPeriodo}
        />
        {erroDia ? <MensagemErro>{erroDia}</MensagemErro> : null}
        {onde ? (
          <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
            Vai aparecer em: {onde}
          </ThemedText>
        ) : null}
        <TextField
          label="Observação"
          placeholder="Ex.: Café da manhã com vista para a serra"
          value={texto}
          onChangeText={(t) => {
            setTexto(t);
            setErro(undefined);
          }}
          error={erro}
          maxLength={LIMITE_DA_OBSERVACAO}
          multiline
          autoFocus
        />
        <Button label="Guardar observação" loading={salvando} disabled={excluindo} onPress={salvar} />
        {onExcluir ? (
          <Button
            label="Excluir observação"
            variant="secondary"
            disabled={salvando}
            onPress={() => {
              setErroExclusao(undefined);
              setConfirmando(true);
            }}
          />
        ) : null}
        <Button label="Cancelar" variant="text" disabled={salvando} onPress={onFechar} />
      </View>
      <Confirmacao
        visible={confirmando}
        title="Excluir esta observação?"
        description="Essa ação é definitiva e vale para os dois."
        confirmLabel="Sim, excluir observação"
        destructive
        loading={excluindo}
        error={erroExclusao}
        onConfirm={excluir}
        onCancel={() => setConfirmando(false)}
      />
    </Modal>
  );
}

type OpcoesProps<T extends string> = {
  rotulo: string;
  opcoes: { valor: T; rotulo: string }[];
  atual: T;
  onChange: (valor: T) => void;
};

/** Escolha única em botões (dia e período da observação). A escolhida tem borda e fundo, não só cor. */
function Opcoes<T extends string>({ rotulo, opcoes, atual, onChange }: OpcoesProps<T>) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={rotulo}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
      {opcoes.map(({ valor, rotulo: texto }) => {
        const escolhida = valor === atual;
        return (
          <Pressable
            key={valor}
            accessibilityRole="radio"
            accessibilityLabel={texto}
            accessibilityState={{ checked: escolhida }}
            onPress={() => onChange(valor)}
            style={({ pressed }) => ({
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: Spacing.three,
              borderRadius: Radius.field,
              borderWidth: escolhida ? 2 : 1,
              borderColor: escolhida ? theme.text : theme.outline,
              backgroundColor: escolhida ? theme.backgroundSelected : 'transparent',
              opacity: pressed ? 0.7 : 1,
            })}>
            <ThemedText type={escolhida ? 'smallBold' : 'small'}>{texto}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Legenda da foto aberta: mostra, escreve, troca ou tira (guardar vazio). Os dois podem (ADR 030). */
function Legenda({ legenda, onSalvar }: { legenda: string | null; onSalvar: (texto: string) => Promise<Resultado> }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(legenda ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string>();

  async function guardar() {
    setSalvando(true);
    setErro(undefined);
    const r = await onSalvar(texto);
    setSalvando(false);
    if (r.ok) setEditando(false);
    else setErro(r.mensagem);
  }

  if (editando) {
    return (
      <View style={{ gap: Spacing.two }}>
        <TextField
          label="Legenda"
          placeholder="Ex.: Primeira noite na serra"
          value={texto}
          onChangeText={(t) => {
            setTexto(t);
            setErro(undefined);
          }}
          error={erro}
          maxLength={LIMITE_DA_LEGENDA}
          autoFocus
        />
        <Button label="Guardar legenda" loading={salvando} onPress={guardar} />
        <Button label="Cancelar" variant="text" disabled={salvando} onPress={() => setEditando(false)} />
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.one }}>
      {legenda ? <ThemedText style={{ textAlign: 'center' }}>{legenda}</ThemedText> : null}
      <Button
        label={legenda ? 'Editar legenda' : 'Adicionar legenda'}
        variant="text"
        onPress={() => {
          setTexto(legenda ?? '');
          setEditando(true);
        }}
      />
    </View>
  );
}
