import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/button';
import { MensagemErro } from '@/components/mensagem-erro';
import { Moldura } from '@/components/moldura';
import { Chip, Grupo } from '@/components/opcoes';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useCategorias } from '@/hooks/use-categorias';
import { useSessao } from '@/hooks/use-sessao';
import { useTheme } from '@/hooks/use-theme';
import type { Experiencia } from '@/services/experiencias';
import { LIMITE_DA_IMPRESSAO, listarImpressoesDe, salvarImpressao, type Impressao } from '@/services/impressoes';
import { agruparPorMes, type MesDaHistoria } from '@/services/nossa-historia';
import { combina, diaDe, DIAS_DA_SEMANA, fioDosLacos, semanasVividas } from '@/services/nossos-dias';
import { descreverReferencia, MESES } from '@/services/referencia-temporal';

const TODOS = 'todos';
const DATA = 40; // a coluna do dia, na margem
const MARGEM = 48; // onde passa a margem vermelha
const TEXTO = 60; // onde começa o que fizeram
const MESES_POR_VEZ = 6;

type Props = {
  /** As memórias de Nossos dias (fora do álbum). */
  dias: Experiencia[];
  /** URLs assinadas das fotos de destaque, pelo caminho. */
  urls: Map<string, string>;
};

/**
 * Nossos dias (ADR 045, proposta em docs/ux/proposal/nossos-dias.html): cada mês tem o calendário
 * dos dias vividos, com o fio passando por eles, e o caderninho com o que fizeram e as impressões.
 * A busca entende texto, tema e mês. O caderno mostra o que existe, nunca o que falta: a regra das
 * impressões é do banco, e a tela não insinua se a outra pessoa escreveu.
 */
export function NossosDias({ dias, urls }: Props) {
  const { categorias } = useCategorias();
  const { perfil } = useSessao();
  const [termo, setTermo] = useState('');
  const termoAdiado = useDeferredValue(termo);
  const [tema, setTema] = useState(TODOS);
  const [aberta, setAberta] = useState<string | null>(null);
  // As impressões lidas, com a lista de memórias a que se referem: só valem para a lista atual.
  const [lidas, setLidas] = useState<{ chave: string | null; mapa: Map<string, Impressao[]> }>({ chave: null, mapa: new Map() });
  const [erroImpressoes, setErroImpressoes] = useState(false);
  // Rascunhos por memória: fechar a linha ou abrir outra não perde o que foi digitado.
  const [rascunhos] = useState(() => new Map<string, string>());
  const [quantosMeses, setQuantosMeses] = useState(MESES_POR_VEZ);
  // Só a leitura mais recente vale: uma resposta atrasada não traz de volta um texto antigo.
  const ultimaLeitura = useRef(0);

  const chave = dias.map((d) => d.id).join('|');
  const carregarImpressoes = useCallback(async () => {
    const esta = ++ultimaLeitura.current;
    const r = await listarImpressoesDe(chave ? chave.split('|') : []);
    if (esta !== ultimaLeitura.current) return;
    setErroImpressoes(!r.ok);
    if (r.ok) setLidas({ chave, mapa: r.porMemoria });
  }, [chave]);
  // Relê a cada volta à tela: a outra pessoa pode ter escrito, ou eu posso ter apagado a minha na memória
  // (e aí a dela deixa de vir). O mapa inteiro é trocado, nunca somado.
  useFocusEffect(
    useCallback(() => {
      void carregarImpressoes();
    }, [carregarImpressoes])
  );
  const impressoes = lidas.mapa;
  // Sem as impressões desta lista carregadas, a escrita não abre: um campo vazio sobrescreveria a que já existe.
  const carregadas = lidas.chave === chave && !erroImpressoes;

  const nomes = new Map(categorias.map((c) => [c.id, c.nome]));
  // Os temas em uso aqui, dos mais usados para os menos.
  const temas = categorias
    .map((c) => ({ ...c, usos: dias.filter((d) => d.categorias.includes(c.id)).length }))
    .filter((c) => c.usos)
    .sort((a, b) => b.usos - a.usos);
  const textos = new Map([...impressoes].map(([id, lista]) => [id, lista.flatMap((i) => (i.texto ? [i.texto] : []))]));
  const procurando = Boolean(termoAdiado.trim()) || tema !== TODOS;
  const filtrados = dias.filter(
    (d) => (tema === TODOS || d.categorias.includes(tema)) && combina(d, termoAdiado, { nomes, impressoes: textos })
  );
  const todosOsMeses = agruparPorMes(filtrados);
  const meses = procurando ? todosOsMeses : todosOsMeses.slice(0, quantosMeses);
  // Procurar só ajuda quando há o que procurar.
  const comBusca = agruparPorMes(dias).length > 1 || dias.length > 8;
  const vinculado = Boolean(perfil?.companheiro_vinculado);
  const nomeDe = (membroId: string) =>
    membroId === perfil?.membro_id ? (perfil?.nome ?? 'Você') : (perfil?.companheiro_nome ?? 'A outra pessoa');
  const nomeDoTema = tema === TODOS ? null : nomes.get(tema);
  const palavra = termoAdiado.trim();
  // A contagem da busca é anunciada (uma região viva montada na hora nem sempre é lida no Android).
  useEffect(() => {
    if (procurando) AccessibilityInfo.announceForAccessibility(filtrados.length === 1 ? '1 dia encontrado' : `${filtrados.length} dias encontrados`);
  }, [procurando, filtrados.length]);

  if (!dias.length) {
    return (
      <View style={{ gap: Spacing.one }}>
        <ThemedText style={{ fontFamily: FontFamily.voz, fontSize: 18 }}>Os dias simples também moram aqui.</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Ao finalizar uma experiência, escolham “Nos nossos dias”.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.five }}>
      {comBusca ? (
        <View style={{ gap: Spacing.two }}>
          <Busca termo={termo} onChange={setTermo} />
          {temas.length ? (
            <Grupo rotulo="Temas" papel="radiogroup" voz>
              {[{ id: TODOS, nome: 'Todos' }, ...temas].map((c) => (
                <Chip key={c.id} texto={c.nome} escolhida={tema === c.id} papel="radio" voz onPress={() => setTema(c.id)} />
              ))}
            </Grupo>
          ) : null}
        </View>
      ) : null}

      {erroImpressoes ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedText type="small" themeColor="textSecondary">
            As impressões não carregaram.
          </ThemedText>
          <Button label="Tentar de novo" variant="text" onPress={() => void carregarImpressoes()} />
        </View>
      ) : null}

      {procurando && !filtrados.length ? (
        <View style={{ gap: Spacing.one, alignItems: 'flex-start' }}>
          <ThemedText style={{ fontFamily: FontFamily.voz, fontSize: 18 }}>
            {nomeDoTema && palavra
              ? `Nenhum dia de ${nomeDoTema} com “${palavra}”.`
              : palavra
                ? `Nada nos nossos dias com “${palavra}”.`
                : `Nenhum dia de ${nomeDoTema}.`}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Tentem outra palavra, um tema ou um mês.
          </ThemedText>
          <Button
            label="Limpar a busca"
            variant="text"
            onPress={() => {
              setTermo('');
              setTema(TODOS);
            }}
          />
        </View>
      ) : null}

      {meses.map((mes) => (
        <Mes
          key={mes.chave}
          mes={mes}
          procurando={procurando}
          urls={urls}
          impressoes={impressoes}
          nomeDe={nomeDe}
          meuId={perfil?.membro_id}
          vinculado={vinculado}
          nomes={nomes}
          carregadas={carregadas}
          rascunhos={rascunhos}
          aberta={aberta}
          onAbrir={(id) => setAberta((atual) => (atual === id ? null : id))}
          onTema={(id) => {
            setTema(id);
            setAberta(null);
          }}
          onEscrita={carregarImpressoes}
        />
      ))}

      {!procurando && todosOsMeses.length > quantosMeses ? (
        <Button label="Mostrar meses anteriores" variant="text" onPress={() => setQuantosMeses((n) => n + MESES_POR_VEZ)} />
      ) : null}
      {procurando ? null : (
        <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, textAlign: 'center' }}>
          E os próximos dias ainda vão ser escritos.
        </ThemedText>
      )}
    </View>
  );
}

/** A busca como linha de caderno: a lupa, o exemplo que ensina o que dá para procurar e o "×". */
function Busca({ termo, onChange }: { termo: string; onChange: (t: string) => void }) {
  const theme = useTheme();
  const [focada, setFocada] = useState(false);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        borderBottomWidth: 1,
        borderBottomColor: focada ? theme.accent : theme.border,
      }}>
      <Svg width={18} height={18} viewBox="0 0 18 18" accessible={false}>
        <Path
          d="M7.5 13 A5.5 5.5 0 1 1 7.5 2 A5.5 5.5 0 0 1 7.5 13 Z M11.5 11.5 L16 16"
          stroke={theme.textSecondary}
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <TextInput
        value={termo}
        onChangeText={onChange}
        placeholder="Procurar: um filme, outubro, a casa da vó…"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Procurar nos nossos dias"
        returnKeyType="search"
        maxLength={80}
        onFocus={() => setFocada(true)}
        onBlur={() => setFocada(false)}
        style={{ flex: 1, minHeight: 48, fontFamily: FontFamily.voz, fontSize: 16, color: theme.text }}
      />
      {termo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar a busca"
          onPress={() => onChange('')}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={14} height={14} viewBox="0 0 14 14" accessible={false}>
            <Path d="M3 3 L11 11 M11 3 L3 11" stroke={theme.textSecondary} strokeWidth={1.6} strokeLinecap="round" />
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}

type MesProps = {
  mes: MesDaHistoria;
  procurando: boolean;
  urls: Map<string, string>;
  impressoes: Map<string, Impressao[]>;
  nomeDe: (membroId: string) => string;
  meuId?: string;
  vinculado: boolean;
  nomes: Map<string, string>;
  carregadas: boolean;
  rascunhos: Map<string, string>;
  aberta: string | null;
  onAbrir: (id: string) => void;
  onTema: (id: string) => void;
  onEscrita: () => Promise<void>;
};

function Mes({ mes, procurando, urls, impressoes, nomeDe, meuId, vinculado, nomes, carregadas, rascunhos, aberta, onAbrir, onTema, onEscrita }: MesProps) {
  const theme = useTheme();
  const [ano, numero] = mes.chave.split('-').map(Number);
  // Cada dia vivido é um nó no calendário; o aceso é o da linha aberta.
  const vividos = new Set(mes.comDia.map(diaDe).filter((d): d is number => d !== null));
  const abertaAqui = mes.comDia.find((m) => m.id === aberta);
  // Conta dias de verdade; um mês só com "algum dia" conta lembranças.
  const contagem = vividos.size
    ? vividos.size === 1 ? '1 dia' : `${vividos.size} dias`
    : mes.semDia.length === 1 ? '1 lembrança' : `${mes.semDia.length} lembranças`;
  const linha = (m: Experiencia, mostrarDia: boolean) => (
    <LinhaDoCaderno
      key={m.id}
      memoria={m}
      mostrarDia={mostrarDia}
      url={m.fotoDestaque ? urls.get(m.fotoDestaque.caminho) : undefined}
      impressoes={impressoes.get(m.id) ?? []}
      nomeDe={nomeDe}
      meuId={meuId}
      vinculado={vinculado}
      nomes={nomes}
      carregadas={carregadas}
      rascunhos={rascunhos}
      aberta={aberta === m.id}
      onAbrir={() => onAbrir(m.id)}
      onTema={onTema}
      onEscrita={onEscrita}
    />
  );

  return (
    <View style={{ gap: Spacing.three }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.two }}>
        <ThemedText accessibilityRole="header" style={{ fontFamily: FontFamily.display, fontSize: 22, lineHeight: 30, flexShrink: 1 }}>
          {mes.rotulo}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 14 }}>
          {contagem}
        </ThemedText>
      </View>
      {/* Todo mês com dia vivido tem o calendário (um dia só: a semana dele, o nó sem fio); procurando,
          a margem já diz o dia. */}
      {!procurando && vividos.size ? (
        <Calendario ano={ano} mes={numero - 1} vividos={vividos} aceso={abertaAqui ? diaDe(abertaAqui) : null} />
      ) : null}
      {/* O caderninho: o papel, a margem vermelha, uma pauta por linha. */}
      <View style={{ backgroundColor: theme.papel, borderRadius: 2, borderWidth: 1, borderColor: theme.papelBorda, overflow: 'hidden' }}>
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', top: 0, bottom: 0, left: MARGEM, width: 1, backgroundColor: theme.accentSoft }}
        />
        {/* Dois registros no mesmo dia: a data só na primeira linha do dia, como num diário. */}
        {mes.comDia.map((m, i) => linha(m, i === 0 || diaDe(mes.comDia[i - 1]) !== diaDe(m)))}
        {mes.semDia.length ? (
          <>
            <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 14, paddingLeft: TEXTO, paddingTop: Spacing.three }}>
              {`Em algum dia de ${MESES[numero - 1]}`}
            </ThemedText>
            {mes.semDia.map((m) => linha(m, false))}
          </>
        ) : null}
      </View>
    </View>
  );
}

const CABECA = 20; // a linha D S T Q Q S S
const SEMANA = 42; // o número em cima, o laço embaixo
const BASE_DO_LACO = 36; // onde o fio passa, a partir do topo da semana

/**
 * O resumo do mês de relance: as semanas vividas e o fio dando um laço em cada dia vivido (um dia
 * só: o laço sem fio). É a identidade do Laço: laços, não pontos. Só visual (as linhas do caderno são o que se toca e o que o leitor de tela lê); acende o dia da
 * linha aberta.
 */
function Calendario({ ano, mes, vividos, aceso }: { ano: number; mes: number; vividos: Set<number>; aceso: number | null }) {
  const theme = useTheme();
  const [largura, setLargura] = useState(0);
  const semanas = semanasVividas(ano, mes, vividos);
  const altura = CABECA + SEMANA * semanas.length;
  const casa = largura / 7;
  const pontos: [number, number][] = [];
  semanas.forEach((semana, l) =>
    semana.forEach((d, c) => {
      if (d && vividos.has(d)) pontos.push([c * casa + casa / 2, CABECA + l * SEMANA + BASE_DO_LACO]);
    })
  );
  const fio = largura ? fioDosLacos(pontos) : '';

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      style={{ height: altura }}>
      {largura ? (
        <Svg width={largura} height={altura} style={{ position: 'absolute' }}>
          {fio ? <Path d={fio} stroke={theme.accent} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
        </Svg>
      ) : null}
      <View style={{ flexDirection: 'row', height: CABECA }}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((s, i) => (
          <ThemedText key={i} maxFontSizeMultiplier={1.4} themeColor="textSecondary" style={{ flex: 1, textAlign: 'center', fontSize: 11, lineHeight: 14 }}>
            {s}
          </ThemedText>
        ))}
      </View>
      {semanas.map((semana, i) => (
        <View key={i} style={{ flexDirection: 'row', height: SEMANA }}>
          {semana.map((d, j) => {
            const vivido = d !== null && vividos.has(d);
            return (
              <View key={j} style={{ flex: 1, alignItems: 'center', paddingTop: 2 }}>
                <View
                  style={{
                    minWidth: 26,
                    height: 20,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: d !== null && d === aceso ? theme.backgroundSelected : 'transparent',
                  }}>
                  <ThemedText
                    maxFontSizeMultiplier={1.4}
                    style={{
                      fontSize: 13,
                      lineHeight: 16,
                      fontFamily: vivido ? FontFamily.bodyStrong : FontFamily.body,
                      color: vivido ? theme.text : theme.textSecondary,
                    }}>
                    {d ?? ''}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

type LinhaProps = {
  memoria: Experiencia;
  mostrarDia: boolean;
  url?: string;
  impressoes: Impressao[];
  nomeDe: (membroId: string) => string;
  meuId?: string;
  vinculado: boolean;
  nomes: Map<string, string>;
  carregadas: boolean;
  rascunhos: Map<string, string>;
  aberta: boolean;
  onAbrir: () => void;
  onTema: (id: string) => void;
  onEscrita: () => Promise<void>;
};

const POR_EXTENSO: Record<string, string> = {
  dom: 'domingo', seg: 'segunda', ter: 'terça', qua: 'quarta', qui: 'quinta', sex: 'sexta', sáb: 'sábado',
};

/** Uma linha do caderno: o dia na margem, o que fizeram, as impressões visíveis; aberta, a escrita e o caminho para a memória. */
function LinhaDoCaderno({ memoria, mostrarDia, url, impressoes, nomeDe, meuId, vinculado, nomes, carregadas, rascunhos, aberta, onAbrir, onTema, onEscrita }: LinhaProps) {
  const theme = useTheme();
  const dia = diaDe(memoria);
  const inicio = memoria.referencia.inicio ?? '2000-01-01';
  const nomeDoMes = MESES[Number(inicio.slice(5, 7)) - 1];
  const semana = dia ? DIAS_DA_SEMANA[new Date(`${inicio}T12:00:00`).getDay()] : null;
  // Período: na margem, só o dia de início; o fim vai numa linha sob o título ("até 26", "até 2 de novembro").
  const fim = memoria.referencia.precisao === 'periodo' && memoria.referencia.fim && memoria.referencia.fim !== inicio ? memoria.referencia.fim : null;
  const ate = fim
    ? fim.slice(0, 7) === inicio.slice(0, 7)
      ? `até ${Number(fim.slice(8, 10))}`
      : `até ${Number(fim.slice(8, 10))} de ${MESES[Number(fim.slice(5, 7)) - 1]}`
    : null;
  const minha = impressoes.find((i) => i.membroId === meuId && i.texto);
  // A minha primeiro, depois a da outra pessoa (se o banco mandou), como nas cartas.
  // Editando a minha, ela sai de cima: o texto fica só no campo, sem aparecer duas vezes.
  const [editando, setEditando] = useState(false);
  const escrevendo = editando || !minha || rascunhos.has(memoria.id);
  const visiveis = [aberta && escrevendo ? undefined : minha, impressoes.find((i) => i.membroId !== meuId && i.texto)].filter(
    (i): i is Impressao => Boolean(i)
  );
  const quando = dia ? `${POR_EXTENSO[semana!]}, ${descreverReferencia(memoria.referencia)}` : `em algum dia de ${nomeDoMes}`;
  const temas = memoria.categorias.flatMap((c) => (nomes.get(c) ? [{ id: c, nome: nomes.get(c)! }] : []));

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.papelBorda }}>
      {/* Aberta, a margem ganha o fio inteiro (um fundo mais escuro afundaria a linha no tema escuro). */}
      {aberta ? (
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', top: 0, bottom: 0, left: MARGEM - 1, width: 3, backgroundColor: theme.accent }}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${memoria.titulo}, ${quando}`}
        accessibilityHint={minha ? 'Abre a impressão' : 'Abre para escrever sua impressão'}
        accessibilityState={{ expanded: aberta }}
        onPress={onAbrir}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'flex-start',
          minHeight: 52,
          paddingTop: 13,
          paddingBottom: visiveis.length || aberta ? 4 : 13,
          opacity: pressed ? 0.75 : 1,
        })}>
        <View style={{ width: DATA, marginLeft: 4, alignItems: 'flex-end' }}>
          {dia && mostrarDia ? (
            <>
              <ThemedText maxFontSizeMultiplier={1.4} style={{ fontFamily: FontFamily.display, fontSize: 17, lineHeight: 20 }}>
                {dia}
              </ThemedText>
              <ThemedText maxFontSizeMultiplier={1.4} themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 13, lineHeight: 16 }}>
                {semana}
              </ThemedText>
            </>
          ) : null}
        </View>
        <View style={{ flex: 1, marginLeft: TEXTO - DATA - 4 }}>
          <ThemedText style={{ fontFamily: FontFamily.voz, fontSize: 18, lineHeight: 26 }}>{memoria.titulo}</ThemedText>
          {ate ? (
            <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 13, lineHeight: 18 }}>
              {ate}
            </ThemedText>
          ) : null}
        </View>
        {url ? (
          // Uma polaroide pequena na ponta da linha, só quando há foto de destaque.
          <Moldura tamanho="miniatura" inclinacao={4} style={{ marginHorizontal: Spacing.two, marginTop: -4 }}>
            <Image
              source={{ uri: url, cacheKey: `capa:${memoria.fotoDestaque?.caminho}` }}
              contentFit="cover"
              style={{ width: 40, height: 40 }}
              accessible={false}
            />
          </Moldura>
        ) : (
          <View style={{ width: Spacing.three }} />
        )}
      </Pressable>

      {/* As impressões ficam fora do toque: o leitor de tela lê cada uma, sem juntar tudo num rótulo. */}
      {visiveis.length ? (
        <View style={{ paddingLeft: TEXTO, paddingRight: Spacing.three, paddingBottom: aberta ? Spacing.two : 13, gap: Spacing.two }}>
          {visiveis.map((i) => (
            <View key={i.membroId} accessible accessibilityLabel={`Impressão de ${nomeDe(i.membroId)}: ${i.texto}`}>
              <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 13, lineHeight: 18 }}>
                {nomeDe(i.membroId)}
              </ThemedText>
              <ThemedText numberOfLines={aberta ? undefined : 2} style={{ fontFamily: FontFamily.voz, fontSize: 15, lineHeight: 22 }}>
                {`“${i.texto}”`}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}

      {aberta ? (
        <View style={{ paddingLeft: TEXTO, paddingRight: Spacing.three, paddingBottom: Spacing.two, gap: Spacing.two }}>
          {/* Reinicia quando a minha impressão muda (chegou do servidor, ou foi guardada). */}
          {carregadas ? (
            <Escrita
              key={`${memoria.id}:${minha?.texto ?? ''}`}
              memoria={memoria}
              minha={minha?.texto ?? ''}
              editando={escrevendo}
              onEditando={setEditando}
              vinculado={vinculado}
              rascunhos={rascunhos}
              onEscrita={onEscrita}
            />
          ) : null}
          {temas.length || memoria.local ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: Spacing.three }}>
              {temas.map((t) => (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver os dias de ${t.nome}`}
                  onPress={() => onTema(t.id)}
                  style={{ minHeight: 44, justifyContent: 'center' }}>
                  <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 14, textDecorationLine: 'underline' }}>
                    {t.nome}
                  </ThemedText>
                </Pressable>
              ))}
              {memoria.local ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {memoria.local}
                </ThemedText>
              ) : null}
            </View>
          ) : null}
          <View style={{ alignItems: 'flex-end' }}>
            <Button
              label="Abrir a memória →"
              accessibilityLabel="Abrir a memória"
              variant="text"
              onPress={() => router.push({ pathname: '/experiencia/[id]', params: { id: memoria.id } })}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

type EscritaProps = {
  memoria: Experiencia;
  minha: string;
  editando: boolean;
  onEditando: (v: boolean) => void;
  vinculado: boolean;
  rascunhos: Map<string, string>;
  onEscrita: () => Promise<void>;
};

/**
 * A própria impressão, ali mesmo. Já escrita, ela aparece nas impressões e aqui fica só "Editar".
 * Apagar fica na tela da memória: nada destrutivo no caderno.
 */
function Escrita({ memoria, minha, editando, onEditando: setEditando, vinculado, rascunhos, onEscrita }: EscritaProps) {
  const theme = useTheme();
  const rascunho = rascunhos.get(memoria.id);
  const [texto, setTexto] = useState(rascunho ?? minha);
  const [focado, setFocado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string>();

  async function guardar() {
    setSalvando(true);
    setErro(undefined);
    const r = await salvarImpressao(memoria.id, texto.trim());
    setSalvando(false);
    if (!r.ok) return setErro(r.mensagem);
    AccessibilityInfo.announceForAccessibility('Impressão guardada');
    rascunhos.delete(memoria.id);
    setEditando(false);
    await onEscrita();
  }

  if (!editando) {
    return (
      <View style={{ alignItems: 'flex-start' }}>
        <Button label="Editar a minha" accessibilityLabel="Editar minha impressão" variant="text" onPress={() => setEditando(true)} />
      </View>
    );
  }
  return (
    <View style={{ gap: Spacing.one }}>
      <TextInput
        value={texto}
        onChangeText={(t) => {
          setTexto(t);
          setErro(undefined);
          if (t === minha) rascunhos.delete(memoria.id);
          else rascunhos.set(memoria.id, t);
        }}
        placeholder="O que ficou desse dia para você?"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={`Minha impressão sobre ${memoria.titulo}`}
        multiline
        maxLength={LIMITE_DA_IMPRESSAO}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        style={{
          fontFamily: FontFamily.voz,
          fontSize: 16,
          lineHeight: 24,
          color: theme.text,
          paddingVertical: Spacing.two,
          // Sem o recuo padrão do Android: o texto alinha com as impressões acima.
          paddingHorizontal: 0,
          borderBottomWidth: 1,
          borderBottomColor: focado ? theme.accent : theme.border,
        }}
      />
      {/* Sempre que eu não escrevi, a mesma frase: não diz nada sobre a outra pessoa. */}
      {vinculado && !minha ? (
        <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, fontSize: 13 }}>
          Cada um lê a do outro depois de escrever a sua.
        </ThemedText>
      ) : null}
      {erro ? <MensagemErro>{erro}</MensagemErro> : null}
      <View style={{ flexDirection: 'row', gap: Spacing.four }}>
        <Button label="Guardar" accessibilityLabel="Guardar minha impressão" variant="text" loading={salvando} disabled={!texto.trim()} onPress={guardar} />
        {minha ? (
          <Button
            label="Cancelar"
            accessibilityLabel="Cancelar a edição"
            variant="text"
            disabled={salvando}
            onPress={() => {
              rascunhos.delete(memoria.id);
              setTexto(minha);
              setEditando(false);
            }}
          />
        ) : null}
      </View>
    </View>
  );
}
