import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Linking, Modal, Pressable, View, type LayoutRectangle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Button } from '@/components/button';
import { Confirmacao } from '@/components/confirmacao';
import { FolhaDeEdicao } from '@/components/folha-de-edicao';
import { MensagemErro } from '@/components/mensagem-erro';
import { Chip, Grupo, Opcoes } from '@/components/opcoes';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useLinks } from '@/hooks/use-links';
import type { useRoteiro } from '@/hooks/use-roteiro';
import { useTheme } from '@/hooks/use-theme';
import { PERIODOS, periodoDaHora, ROTULO_DO_PERIODO, type Periodo } from '@/services/agrupar-fotos';
import type { Experiencia } from '@/services/experiencias';
import type { Resultado } from '@/services/laco';
import { LIMITE_DO_TITULO_DO_LINK, type Link } from '@/services/links';
import { lerData, lerHorario, mascararData, mascararHorario } from '@/services/referencia-temporal';
import {
  agruparRoteiro,
  camposDe,
  diaPorExtenso,
  diasDaExperiencia,
  LIMITE_DO_TEXTO_DO_ROTEIRO,
  posicaoAoSoltar,
  posicaoUmPasso,
  rotuloCurtoDoDia,
  type CamposDoItem,
  type DiaDoRoteiro,
  type ItemDoRoteiro,
} from '@/services/roteiro';

type Roteiro = ReturnType<typeof useRoteiro>;
type Links = ReturnType<typeof useLinks>;

/** Quanto segurar antes de começar a arrastar: menos que isso é um toque (editar). */
const SEGURAR_MS = 350;
/** Com mais dias que isso, o editor pede o dia digitado em vez de um botão por dia. */
const DIAS_EM_BOTOES = 14;

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/**
 * A guia Roteiro (ADR 040): os dias da experiência, mesmo vazios, e o que o casal vai fazer em cada
 * período. Tocar num item edita; segurar e arrastar muda a ordem dentro do dia (passando de um
 * período a outro). Leitores de tela têm "Mover para cima" e "Mover para baixo". Cada item pode
 * apontar para links da experiência (os mesmos da seção Links). Salva na hora.
 */
export function RoteiroDaExperiencia({ experiencia, roteiro }: { experiencia: Experiencia; roteiro: Roteiro }) {
  const { itens, erro, carregado, criar, editar, mover, excluir } = roteiro;
  const [agora] = useState(() => new Date());
  const sugeridos = useMemo(() => diasDaExperiencia(experiencia.referencia), [experiencia.referencia]);
  const dias = useMemo(() => agruparRoteiro(itens, sugeridos, agora), [itens, sugeridos, agora]);
  const [editando, setEditando] = useState<{ item: ItemDoRoteiro | null; dia?: string } | null>(null);
  // Arrastando: a rolagem e os outros dias esperam.
  const [arrastando, setArrastando] = useState(false);
  const links = useLinks(experiencia.id);
  const carregarLinks = links.carregar;
  const [erroAoAbrir, setErroAoAbrir] = useState<string>();

  useFocusEffect(
    useCallback(() => {
      void carregarLinks();
    }, [carregarLinks])
  );

  async function abrirLink(url: string) {
    setErroAoAbrir(undefined);
    try {
      await Linking.openURL(url);
    } catch {
      setErroAoAbrir('Não foi possível abrir esse link.');
    }
  }

  const resumo = [
    sugeridos.length ? plural(sugeridos.length, 'dia', 'dias') : null,
    itens.length ? plural(itens.length, 'item', 'itens') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={{ gap: Spacing.four }}>
      <View style={{ gap: Spacing.one }}>
        {resumo ? (
          <ThemedText type="smallBold" accessibilityRole="header">
            {resumo}
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          {itens.length > 1
            ? 'Toquem num item para editar. Para mudar a ordem, segurem e arrastem.'
            : sugeridos.length
              ? 'O que vocês vão fazer em cada dia, de manhã à noite.'
              : 'Para ver cada dia aqui, escolham as datas em Detalhes. Enquanto isso, dá para adicionar itens em qualquer data.'}
        </ThemedText>
      </View>

      {erro ? <MensagemErro>{erro}</MensagemErro> : null}
      {erroAoAbrir ? <MensagemErro>{erroAoAbrir}</MensagemErro> : null}

      {carregado || itens.length
        ? dias.map((d) => (
            <DiaDoRoteiroView
              key={d.dia}
              dia={d}
              links={links.links}
              onAbrirLink={(url) => void abrirLink(url)}
              bloqueado={arrastando}
              onArrastando={setArrastando}
              onAdicionar={() => setEditando({ item: null, dia: d.dia })}
              onEditar={(item) => setEditando({ item })}
              onMover={(id, posicao) => void mover(id, posicao)}
            />
          ))
        : null}

      <Button
        label="Adicionar ao roteiro"
        variant="secondary"
        onPress={() => setEditando({ item: null, dia: dias[0]?.dia })}
      />

      {editando ? (
        <EditorDoItem
          item={editando.item}
          diaInicial={editando.dia}
          sugeridos={sugeridos}
          links={links}
          onSalvar={(campos) => (editando.item ? editar(editando.item, campos) : criar(campos))}
          onExcluir={editando.item ? () => excluir(editando.item!.id) : undefined}
          onFechar={() => setEditando(null)}
        />
      ) : null}
    </View>
  );
}

type Medida = { y: number; altura: number };

type DiaProps = {
  dia: DiaDoRoteiro;
  /** Os links da experiência, para mostrar os de cada item. */
  links: Link[];
  onAbrirLink: (url: string) => void;
  bloqueado: boolean;
  onArrastando: (sim: boolean) => void;
  onAdicionar: () => void;
  onEditar: (item: ItemDoRoteiro) => void;
  onMover: (id: string, posicao: ReturnType<typeof posicaoAoSoltar>) => void;
};

/** Um dia: cabeçalho, os períodos com os itens e "Adicionar neste dia". Os itens se arrastam aqui dentro. */
function DiaDoRoteiroView({ dia, links, onAbrirLink, bloqueado, onArrastando, onAdicionar, onEditar, onMover }: DiaProps) {
  const theme = useTheme();
  // Posições atuais (relativas à lista do dia) dos itens e dos rótulos de período.
  const medidas = useRef(new Map<string, Medida>());
  const rotulos = useRef(new Map<Periodo, number>());
  // As mesmas posições no instante em que o arrasto começou: a conta de onde o item cai usa estas,
  // porque a lista se reorganiza enquanto ele se move.
  const inicio = useRef<{ medidas: Map<string, Medida>; rotulos: Map<Periodo, number> } | null>(null);
  const ultimoDy = useRef(0);
  const [deslocamento] = useState(() => new Animated.Value(0));
  const [arrastado, setArrastado] = useState<ItemDoRoteiro | null>(null);
  const [destino, setDestino] = useState<{ indice: number; periodo: Periodo } | null>(null);
  const destinoAtual = useRef(destino);

  const titulo = dia.numero ? `Dia ${dia.numero}` : diaPorExtenso(dia.dia);

  // Arrastando, a lista já mostra a ordem que vai ficar: os outros abrem espaço onde o item cai.
  const outros = arrastado ? dia.itens.filter((i) => i.id !== arrastado.id) : dia.itens;
  const itens =
    arrastado && destino
      ? [...outros.slice(0, destino.indice), { ...arrastado, periodo: destino.periodo }, ...outros.slice(destino.indice)]
      : dia.itens;
  const periodos = PERIODOS.map((periodo) => ({ periodo, itens: itens.filter((i) => i.periodo === periodo) })).filter(
    (p) => p.itens.length > 0
  );

  /** Para onde vai o item se for solto com o centro em `centro` (nas posições do começo do arrasto). */
  function calcularDestino(item: ItemDoRoteiro, centro: number) {
    const fotografia = inicio.current;
    const outros = dia.itens.filter((i) => i.id !== item.id);
    const presentes = dia.periodos.map((p) => p.periodo);
    // O período é o do último rótulo acima do centro (ou o primeiro, acima de todos).
    let periodo = presentes[0];
    for (const p of presentes) if ((fotografia?.rotulos.get(p) ?? Infinity) < centro) periodo = p;
    const ordem = PERIODOS.indexOf(periodo);
    const min = outros.filter((i) => PERIODOS.indexOf(i.periodo) < ordem).length;
    const max = outros.filter((i) => PERIODOS.indexOf(i.periodo) <= ordem).length;
    const acima = outros.filter((i) => {
      const m = fotografia?.medidas.get(i.id);
      return m ? m.y + m.altura / 2 < centro : false;
    }).length;
    return { indice: Math.min(Math.max(acima, min), max), periodo };
  }

  /** O item erguido fica sob o dedo, onde quer que a lista o tenha posto agora. */
  function acompanharDedo(id: string) {
    const original = inicio.current?.medidas.get(id);
    const atual = medidas.current.get(id);
    if (original && atual) deslocamento.setValue(original.y + ultimoDy.current - atual.y);
  }

  function comecar(item: ItemDoRoteiro) {
    inicio.current = { medidas: new Map(medidas.current), rotulos: new Map(rotulos.current) };
    ultimoDy.current = 0;
    const comeco = { indice: dia.itens.findIndex((i) => i.id === item.id), periodo: item.periodo };
    destinoAtual.current = comeco;
    setDestino(comeco);
    setArrastado(item);
    onArrastando(true);
  }

  function arrastar(item: ItemDoRoteiro, dy: number) {
    ultimoDy.current = dy;
    acompanharDedo(item.id);
    const m = inicio.current?.medidas.get(item.id);
    if (!m) return;
    const novo = calcularDestino(item, m.y + m.altura / 2 + dy);
    const atual = destinoAtual.current;
    if (!atual || atual.indice !== novo.indice || atual.periodo !== novo.periodo) {
      destinoAtual.current = novo;
      setDestino(novo);
    }
  }

  function soltar(item: ItemDoRoteiro) {
    const d = destinoAtual.current;
    deslocamento.setValue(0);
    setArrastado(null);
    setDestino(null);
    destinoAtual.current = null;
    inicio.current = null;
    onArrastando(false);
    if (!d) return;
    const outros = dia.itens.filter((i) => i.id !== item.id);
    const original = dia.itens.findIndex((i) => i.id === item.id);
    if (d.periodo === item.periodo && d.indice === original) return;
    onMover(item.id, posicaoAoSoltar(item, outros, d.indice, d.periodo));
  }

  return (
    <View
      style={{
        borderRadius: Radius.photo,
        backgroundColor: theme.backgroundElement,
        padding: Spacing.three,
        gap: Spacing.two,
      }}>
      <View style={{ gap: Spacing.half }}>
        <ThemedText type="smallBold" accessibilityRole="header" style={{ color: theme.accentStrong }}>
          {titulo.toUpperCase()}
        </ThemedText>
        {/* O dia por extenso já está no título quando ele não tem número. */}
        <ThemedText style={{ fontSize: 18 }}>{dia.numero ? capitalizar(dia.rotulo) : capitalizar(dia.rotulo.split(',')[0])}</ThemedText>
      </View>

      {itens.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Dia livre, por enquanto.
        </ThemedText>
      ) : (
        <View>
          {periodos.map(({ periodo, itens: doPeriodo }) => [
            <View
              key={`rotulo-${periodo}`}
              onLayout={(e) => rotulos.current.set(periodo, e.nativeEvent.layout.y)}
              style={{ paddingTop: Spacing.two, paddingBottom: Spacing.one }}>
              <ThemedText type="small" themeColor="textSecondary" style={{ letterSpacing: 1 }}>
                {ROTULO_DO_PERIODO[periodo].toUpperCase()}
              </ThemedText>
            </View>,
            ...doPeriodo.map((item) => (
              <Arrastavel
                key={item.id}
                habilitado={!bloqueado}
                erguido={arrastado?.id === item.id}
                deslocamento={deslocamento}
                onMedir={(m) => {
                  medidas.current.set(item.id, { y: m.y, altura: m.height });
                  if (arrastado?.id === item.id) acompanharDedo(item.id);
                }}
                onInicio={() => comecar(item)}
                onArrastar={(dy) => arrastar(item, dy)}
                onSoltar={() => soltar(item)}>
                <LinhaDoItem
                  item={item}
                  links={links.filter((l) => item.links.includes(l.id))}
                  onAbrirLink={onAbrirLink}
                  erguido={arrastado?.id === item.id}
                  onEditar={() => onEditar(item)}
                  onPasso={(sentido) => {
                    const posicao = posicaoUmPasso(dia.itens, item.id, sentido);
                    if (posicao) onMover(item.id, posicao);
                  }}
                />
              </Arrastavel>
            )),
          ])}
        </View>
      )}

      <View style={{ alignItems: 'flex-start' }}>
        <Button label="+ Adicionar neste dia" variant="text" accessibilityLabel={`Adicionar ao roteiro em ${titulo}`} onPress={onAdicionar} />
      </View>
    </View>
  );
}

type ArrastavelProps = {
  habilitado: boolean;
  erguido: boolean;
  deslocamento: Animated.Value;
  onMedir: (m: LayoutRectangle) => void;
  onInicio: () => void;
  onArrastar: (dy: number) => void;
  onSoltar: () => void;
  children: ReactNode;
};

/** Segurar e arrastar na vertical. Erguido, o item acompanha o dedo, acima dos outros. */
function Arrastavel({ habilitado, erguido, deslocamento, onMedir, onInicio, onArrastar, onSoltar, children }: ArrastavelProps) {
  const gesto = Gesture.Pan()
    .runOnJS(true)
    .enabled(habilitado || erguido)
    .activateAfterLongPress(SEGURAR_MS)
    .onStart(onInicio)
    .onUpdate((e) => onArrastar(e.translationY))
    // Só solta o que chegou a começar: um toque curto não arrasta nada.
    .onEnd(onSoltar);
  return (
    <GestureDetector gesture={gesto}>
      <Animated.View
        onLayout={(e) => onMedir(e.nativeEvent.layout)}
        style={
          erguido
            ? {
                zIndex: 10,
                elevation: 6,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                transform: [{ translateY: deslocamento }, { scale: 1.02 }],
              }
            : undefined
        }>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

type LinhaProps = {
  item: ItemDoRoteiro;
  links: Link[];
  onAbrirLink: (url: string) => void;
  erguido: boolean;
  onEditar: () => void;
  onPasso: (sentido: -1 | 1) => void;
};

// Os links ficam alinhados ao texto: depois da alça (14) e do espaço entre eles.
const RECUO_DOS_LINKS = 14 + Spacing.three;

/** Um item: a alça (arrastar), o horário quando há, o texto e, embaixo, os links (cada um abre o seu). */
function LinhaDoItem({ item, links, onAbrirLink, erguido, onEditar, onPasso }: LinhaProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.two,
        marginHorizontal: -Spacing.two,
        borderRadius: Radius.field,
        backgroundColor: erguido ? theme.background : 'transparent',
      }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.horario ? `${item.horario}, ` : ''}${item.texto}, ${ROTULO_DO_PERIODO[item.periodo].toLowerCase()}`}
        accessibilityHint="Toque para editar."
        accessibilityActions={[
          { name: 'subir', label: 'Mover para cima' },
          { name: 'descer', label: 'Mover para baixo' },
        ]}
        onAccessibilityAction={(e) => onPasso(e.nativeEvent.actionName === 'subir' ? -1 : 1)}
        onPress={onEditar}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 36, opacity: pressed ? 0.6 : 1 })}>
        <Alca />
        {item.horario ? (
          <ThemedText type="smallBold" style={{ fontVariant: ['tabular-nums'], minWidth: 44 }}>
            {item.horario}
          </ThemedText>
        ) : null}
        <ThemedText style={{ flex: 1 }}>{item.texto}</ThemedText>
      </Pressable>
      {links.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.four, paddingLeft: RECUO_DOS_LINKS }}>
          {links.map((l) => (
            <Pressable
              key={l.id}
              accessibilityRole="link"
              accessibilityLabel={`Abrir ${l.titulo}, de ${item.texto}`}
              hitSlop={8}
              onPress={() => onAbrirLink(l.url)}
              style={{ minHeight: 44, justifyContent: 'center' }}>
              <ThemedText type="smallBold" style={{ textDecorationLine: 'underline' }}>
                {l.titulo} ↗
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Três traços: onde segurar para arrastar. Só visual; o item inteiro se arrasta. */
function Alca() {
  const theme = useTheme();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ gap: 3, paddingVertical: Spacing.one }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 14, height: 2, borderRadius: 1, backgroundColor: theme.outline }} />
      ))}
    </View>
  );
}

type EditorProps = {
  item: ItemDoRoteiro | null;
  diaInicial?: string;
  /** Os dias da experiência, que viram botões. */
  sugeridos: string[];
  /** Os links da experiência, para marcar; um link novo criado aqui entra também na seção Links. */
  links: Links;
  onSalvar: (campos: CamposDoItem) => Promise<Resultado>;
  onExcluir?: () => Promise<Resultado>;
  onFechar: () => void;
};

/**
 * Adicionar ou editar um item: o que fazer, o dia (um botão por dia da experiência, ou digitado), o
 * período e, se quiserem, o horário. Digitar um horário escolhe o período; trocar o período para um
 * que não combina tira o horário. Links: marcar os da experiência ou criar um novo. Excluir pede confirmação.
 */
function EditorDoItem({ item, diaInicial, sugeridos, links, onSalvar, onExcluir, onFechar }: EditorProps) {
  const [campos, setCampos] = useState<CamposDoItem>(() => camposDe(item, diaInicial));
  const comBotoes = sugeridos.length > 0 && sugeridos.length <= DIAS_EM_BOTOES;
  const [outroDia, setOutroDia] = useState(() => !comBotoes || !sugeridos.includes(lerData(campos.dia) ?? ''));
  const [erro, setErro] = useState<string>();
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string>();

  const mudar = (parte: Partial<CamposDoItem>) => {
    setCampos((atuais) => ({ ...atuais, ...parte }));
    setErro(undefined);
  };

  function mudarHorario(texto: string) {
    const horario = mascararHorario(texto);
    const lido = lerHorario(horario);
    mudar(lido ? { horario, periodo: periodoDaHora(Number(lido.slice(0, 2))) } : { horario });
  }

  function mudarPeriodo(periodo: Periodo) {
    const lido = lerHorario(campos.horario);
    const cabe = !lido || periodoDaHora(Number(lido.slice(0, 2))) === periodo;
    mudar(cabe ? { periodo } : { periodo, horario: '' });
  }

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

  const diaEscolhido = lerData(campos.dia);

  return (
    <Modal testID="editor-do-roteiro" visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onFechar}>
      <FolhaDeEdicao>
        <ThemedText type="subtitle" style={{ fontSize: 24, lineHeight: 32 }} accessibilityRole="header">
          {item ? 'Editar item' : 'Adicionar ao roteiro'}
        </ThemedText>
        <TextField
          label="O que vão fazer"
          required
          placeholder="Ex.: Trilha até a cachoeira"
          value={campos.texto}
          onChangeText={(texto) => mudar({ texto })}
          maxLength={LIMITE_DO_TEXTO_DO_ROTEIRO}
          multiline
          autoFocus={!item}
        />
        <View style={{ gap: Spacing.two }}>
          {comBotoes ? (
            <ThemedText type="smallBold">Dia *</ThemedText>
          ) : null}
          {comBotoes ? (
            <Grupo rotulo="Dia, obrigatório" papel="radiogroup">
              {sugeridos.map((d) => (
                <Chip
                  key={d}
                  texto={rotuloCurtoDoDia(d)}
                  escolhida={!outroDia && diaEscolhido === d}
                  papel="radio"
                  onPress={() => {
                    setOutroDia(false);
                    mudar({ dia: d.split('-').reverse().join('/') });
                  }}
                />
              ))}
              <Chip texto="Outra data" escolhida={outroDia} papel="radio" onPress={() => setOutroDia(true)} />
            </Grupo>
          ) : null}
          {outroDia ? (
            <TextField
              // Com os botões, o campo é a "outra data"; sem eles, é o próprio dia.
              label={comBotoes ? 'Data' : 'Dia'}
              required
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
              value={campos.dia}
              onChangeText={(v) => mudar({ dia: mascararData(v) })}
            />
          ) : null}
        </View>
        <View style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold">Período</ThemedText>
          <Opcoes<Periodo>
            rotulo="Período"
            opcoes={PERIODOS.map((p) => ({ valor: p, rotulo: ROTULO_DO_PERIODO[p] }))}
            atual={campos.periodo}
            onChange={mudarPeriodo}
          />
        </View>
        <TextField
          label="Horário"
          placeholder="HH:MM"
          keyboardType="number-pad"
          maxLength={5}
          value={campos.horario}
          onChangeText={mudarHorario}
        />
        <LinksDoItem links={links} marcados={campos.links} onChange={(ids) => mudar({ links: ids })} />
        {erro ? <MensagemErro>{erro}</MensagemErro> : null}
        <Button label="Guardar no roteiro" loading={salvando} disabled={excluindo} onPress={salvar} />
        {onExcluir ? (
          <Button
            label="Excluir do roteiro"
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
        title="Tirar do roteiro?"
        description="O item sai do roteiro, para os dois."
        confirmLabel="Sim, tirar do roteiro"
        destructive
        loading={excluindo}
        error={erroExclusao}
        onConfirm={excluir}
        onCancel={() => setConfirmando(false)}
      />
    </Modal>
  );
}

/**
 * Links do item: os da experiência viram botões para marcar; "Novo link" cria um ali mesmo, que já
 * entra marcado e aparece também na seção Links.
 */
function LinksDoItem({ links, marcados, onChange }: { links: Links; marcados: string[]; onChange: (ids: string[]) => void }) {
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [endereco, setEndereco] = useState('');
  const [erro, setErro] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  async function criar() {
    setSalvando(true);
    setErro(undefined);
    const r = await links.criar(titulo, endereco);
    setSalvando(false);
    if (!r.ok) return setErro(r.mensagem);
    onChange([...marcados, r.link.id]);
    setTitulo('');
    setEndereco('');
    setCriando(false);
  }

  return (
    <View style={{ gap: Spacing.two }}>
      <ThemedText type="smallBold">Links</ThemedText>
      {links.links.length === 0 && !criando ? (
        <ThemedText type="small" themeColor="textSecondary">
          Ingresso, cardápio, mapa: o link criado aqui também fica em Links, nos detalhes.
        </ThemedText>
      ) : null}
      <Grupo rotulo="Links" papel="list">
        {links.links.map((l) => {
          const marcado = marcados.includes(l.id);
          return (
            <Chip
              key={l.id}
              texto={l.titulo}
              escolhida={marcado}
              papel="checkbox"
              onPress={() => onChange(marcado ? marcados.filter((id) => id !== l.id) : [...marcados, l.id])}
            />
          );
        })}
        {criando ? null : <Chip texto="+ Novo link" escolhida={false} papel="checkbox" onPress={() => setCriando(true)} />}
      </Grupo>
      {criando ? (
        <View style={{ gap: Spacing.two }}>
          <TextField
            label="Nome do link"
            required
            placeholder="Ex.: Ingressos do museu"
            value={titulo}
            onChangeText={(t) => {
              setTitulo(t);
              setErro(undefined);
            }}
            maxLength={LIMITE_DO_TITULO_DO_LINK}
            autoFocus
          />
          <TextField
            label="Endereço"
            required
            placeholder="https://"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={endereco}
            onChangeText={(t) => {
              setEndereco(t);
              setErro(undefined);
            }}
          />
          {erro ? <MensagemErro>{erro}</MensagemErro> : null}
          <Button label="Criar link" variant="secondary" loading={salvando} onPress={criar} />
          <Button label="Cancelar" variant="text" disabled={salvando} onPress={() => setCriando(false)} />
        </View>
      ) : null}
    </View>
  );
}
