import * as SecureStore from 'expo-secure-store';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/button';
import { CeuDeDesejos, horizonteDe, HORIZONTES, type Horizonte } from '@/components/ceu-de-desejos';
import { EmptyState } from '@/components/empty-state';
import { FolhaDeEscolha } from '@/components/folha-de-escolha';
import { LinhaDaExperiencia } from '@/components/linha-da-experiencia';
import { Opcoes } from '@/components/opcoes';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useCategorias } from '@/hooks/use-categorias';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useTheme } from '@/hooks/use-theme';
import type { Experiencia } from '@/services/experiencias';
import { TAMANHOS } from '@/services/tamanho';

const TODAS = 'todas';
type Modo = 'ceu' | 'lista';
// O modo escolhido por último, neste aparelho.
const CHAVE_DO_MODO = 'laco.desejos.modo';

// Começos de frase que abrem a criação como exemplo do campo: a tela nunca fica em branco.
const SEMENTES = ['Um lugar que nunca fomos', 'Algo que queremos aprender juntos', 'Uma noite sem celular, só nós dois'];

/** Procura no título, no local e nas observações, sem diferenciar acentos nem maiúsculas. */
const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const combinaCom = (termo: string) => (d: Experiencia) =>
  normalizar([d.titulo, d.local, d.observacoes].filter(Boolean).join(' ')).includes(normalizar(termo.trim()));

/**
 * Desejos como um céu (proposta aprovada em docs/ux/proposal/ceu-de-desejos.html): cada desejo é
 * uma estrela, o fio liga as categorias, e o que está perto fica em cima. Achar um desejo continua
 * fácil: a busca fica no topo, os filtros acendem só o que combina e a lista está a um toque.
 */
export default function Desejos() {
  const theme = useTheme();
  const { desejos, carregando, erro, recarregar } = useExperiencias();
  const { categorias } = useCategorias();
  const [categoria, setCategoria] = useState(TODAS);
  const [tamanho, setTamanho] = useState(TODAS);
  const [termo, setTermo] = useState('');
  const [modo, setModo] = useState<Modo>('ceu');
  const [ajustando, setAjustando] = useState(false);
  // Voltando da criação, a estrela nova cintila ao chegar.
  const { nova } = useLocalSearchParams<{ nova?: string }>();
  // A chegada vale uma vez: saindo da aba, ela já foi vista.
  const [chegadaVista, setChegadaVista] = useState<string>();
  const [chegadaTratada, setChegadaTratada] = useState<string>();

  useEffect(() => {
    void SecureStore.getItemAsync(CHAVE_DO_MODO)
      .then((v) => (v === 'lista' || v === 'ceu' ? setModo(v) : undefined))
      .catch(() => {});
  }, []);
  const escolherModo = (m: Modo) => {
    setModo(m);
    void SecureStore.setItemAsync(CHAVE_DO_MODO, m).catch(() => {});
  };

  // A outra pessoa pode ter criado, editado ou excluído desde a última vez: relê ao voltar para a aba.
  useFocusEffect(
    useCallback(() => {
      void recarregar();
      return () => setChegadaVista(nova);
    }, [recarregar, nova])
  );

  // Só aparecem no filtro as categorias e os tamanhos que algum desejo usa (ADR 038).
  const usadas = categorias.filter((c) => desejos.some((d) => d.categorias.includes(c.id)));
  const tamanhosUsados = TAMANHOS.filter((t) => desejos.some((d) => d.tamanho === t.valor));
  const filtrados = desejos.filter(
    (d) =>
      (categoria === TODAS || d.categorias.includes(categoria)) &&
      (tamanho === TODAS || d.tamanho === tamanho) &&
      (!termo.trim() || combinaCom(termo)(d))
  );
  const acesos = new Set(filtrados.map((d) => d.id));
  const hoje = new Date();
  const porHorizonte = Object.fromEntries(HORIZONTES.map((h) => [h, [] as Experiencia[]])) as Record<Horizonte, Experiencia[]>;
  for (const d of desejos) porHorizonte[horizonteDe(d, hoje)].push(d);
  const procurando = termo.trim().length > 0;
  const categoriaAtual = usadas.find((c) => c.id === categoria);
  const tamanhoAtual = tamanhosUsados.find((t) => t.valor === tamanho);
  const filtrando = Boolean(categoriaAtual || tamanhoAtual);
  // O que o botão diz: quais estrelas estão acesas ("Todas as estrelas", "Só Filme · Uma noite").
  const chegou = nova && nova !== chegadaVista ? desejos.find((d) => d.id === nova) : undefined;
  // A chegada limpa busca e filtros (uma vez por desejo novo): a estrela nova tem de estar à vista.
  if (chegou && chegou.id !== chegadaTratada) {
    setChegadaTratada(chegou.id);
    setTermo('');
    setCategoria(TODAS);
    setTamanho(TODAS);
  }
  const resumo = filtrando ? `Só ${[categoriaAtual?.nome, tamanhoAtual?.rotulo].filter(Boolean).join(' · ')}` : 'Todas as estrelas';

  const sementes = (
    <View style={{ gap: Spacing.one }}>
      <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz, marginBottom: Spacing.one }}>
        {desejos.length ? 'ou uma ideia para começar' : 'Uma ideia para começar'}
      </ThemedText>
      {[...SEMENTES, null].map((s) => (
        <Pressable
          key={s ?? 'outra'}
          accessibilityRole="button"
          accessibilityLabel={s ? `Começar um desejo: ${s}` : 'Começar outro desejo'}
          onPress={() => router.push(s ? { pathname: '/criar', params: { semente: s } } : '/criar')}
          // Bilhetes leves: só o fio embaixo, sem bloco de papel cheio.
          style={({ pressed }) => ({
            minHeight: 48,
            justifyContent: 'center',
            paddingVertical: Spacing.two,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            opacity: pressed ? 0.6 : 1,
          })}>
          <ThemedText style={{ fontFamily: FontFamily.voz, fontSize: 17 }} themeColor={s ? 'text' : 'textSecondary'}>
            {s ? `${s}…` : 'Outra coisa…'}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );

  return (
    <Screen>
      <ScreenHeader title="O que sonhamos viver" description={desejos.length ? 'Perto em cima, sem pressa embaixo.' : undefined} />

      {carregando ? (
        <ThemedText themeColor="textSecondary" accessibilityLiveRegion="polite" style={{ fontFamily: FontFamily.voz }}>
          Acendendo o céu…
        </ThemedText>
      ) : erro && desejos.length === 0 ? (
        <EmptyState
          title="O céu não acendeu agora"
          description={erro}
          actionLabel="Tentar de novo"
          onAction={() => {
            void recarregar();
          }}
        />
      ) : desejos.length === 0 ? (
        // Vazio, o céu limpo já é o convite; as sementes ficam logo abaixo.
        <View style={{ gap: Spacing.four }}>
          <ThemedText accessibilityRole="header" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}>
            Nenhum desejo ainda
          </ThemedText>
          <CeuDeDesejos porHorizonte={porHorizonte} acesos={acesos} />
          {sementes}
        </View>
      ) : (
        <View style={{ gap: Spacing.four }}>
          {/* Voltando da criação: a chegada dita em palavras, além da estrela que pisca. */}
          {chegou ? (
            <ThemedText accessibilityLiveRegion="polite" style={{ fontFamily: FontFamily.voz, fontSize: 16 }}>
              {`Mais uma estrela no céu: “${chegou.titulo}”`}
            </ThemedText>
          ) : null}
          <View style={{ gap: Spacing.three }}>
            <View style={{ justifyContent: 'center' }}>
              <TextInput
                value={termo}
                onChangeText={setTermo}
                placeholder="Procurar no céu…"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Procurar um desejo"
                returnKeyType="search"
                // Linha de caderno: sem caixa no topo de um céu.
                style={{
                  minHeight: 48,
                  paddingRight: 48,
                  borderBottomWidth: 1,
                  borderBottomColor: termo ? theme.accent : theme.border,
                  color: theme.text,
                  fontFamily: termo ? FontFamily.display : FontFamily.voz,
                  fontSize: 17,
                }}
              />
              {termo ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpar a busca"
                  onPress={() => setTermo('')}
                  hitSlop={4}
                  style={{ position: 'absolute', right: 0, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={14} height={14} viewBox="0 0 14 14" accessible={false}>
                    <Path d="M3 3 L11 11 M11 3 L3 11" stroke={theme.textSecondary} strokeWidth={1.6} strokeLinecap="round" />
                  </Svg>
                </Pressable>
              ) : null}
            </View>
            {/* Uma linha: à esquerda, quais estrelas estão acesas (abre os filtros); à direita, o modo. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two }}>
            {usadas.length + tamanhosUsados.length === 0 ? <View /> : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Filtrar. Agora: ${resumo}`}
              accessibilityHint="Acende só as estrelas de uma categoria ou duração."
              onPress={() => setAjustando(true)}
              style={({ pressed }) => ({
                flexShrink: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.two,
                minHeight: 44,
                opacity: pressed ? 0.7 : 1,
              })}>
              {/* Uma legenda de álbum, sem caixa; filtrando, o fio sublinha o que está valendo. */}
              <View style={{ flexShrink: 1, paddingBottom: 2, borderBottomWidth: 1.5, borderBottomColor: filtrando ? theme.accent : 'transparent' }}>
                <ThemedText numberOfLines={1} style={{ fontFamily: FontFamily.voz, fontSize: 16 }}>
                  {resumo}
                </ThemedText>
              </View>
              {/* Um chevron desenhado, no traço dos ícones do app. */}
              <Svg width={12} height={12} viewBox="0 0 12 12" accessible={false}>
                <Path d="M2.5 4.5 L6 8 L9.5 4.5" stroke={theme.textSecondary} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
            )}
            {/* O modo é um ícone desenhado: linhas para ir à lista, estrela para voltar ao céu. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={modo === 'ceu' ? 'Ver em lista' : 'Ver o céu'}
              onPress={() => escolherModo(modo === 'ceu' ? 'lista' : 'ceu')}
              style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Svg width={20} height={20} viewBox="0 0 20 20" accessible={false}>
                <Path
                  d={modo === 'ceu' ? 'M3.5 5 h0.01 M7 5 H17 M3.5 10 h0.01 M7 10 H17 M3.5 15 h0.01 M7 15 H14' : 'M10 2.5 L12.1 7.6 L17.5 7.9 L13.3 11.3 L14.7 16.6 L10 13.6 L5.3 16.6 L6.7 11.3 L2.5 7.9 L7.9 7.6 Z'}
                  stroke={theme.textSecondary}
                  strokeWidth={1.6}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
            </View>
          </View>

          {procurando ? (
            // O que bateu com a busca, nas mesmas linhas da lista; o céu volta ao limpar.
            <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
              {filtrados.length ? (
                filtrados.map((d) => <LinhaDaExperiencia key={d.id} experiencia={d} />)
              ) : (
                <ThemedText themeColor="textSecondary" style={{ paddingVertical: Spacing.three, fontFamily: FontFamily.voz }}>
                  Nenhum desejo com essa palavra.
                </ThemedText>
              )}
            </View>
          ) : filtrados.length === 0 ? (
            <View style={{ alignItems: 'flex-start' }}>
              <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz }}>
                Nenhum desejo com esse filtro.
              </ThemedText>
              <Button
                label="Limpar filtros"
                variant="text"
                onPress={() => {
                  setCategoria(TODAS);
                  setTamanho(TODAS);
                }}
              />
            </View>
          ) : null}

          {procurando ? null : modo === 'ceu' ? (
            // Procurando, só a lista acima: o céu volta quando a busca é limpa.
            <CeuDeDesejos porHorizonte={porHorizonte} acesos={acesos} nova={chegou?.id} />
          ) : (
            <View style={{ gap: Spacing.four }}>
              {HORIZONTES.map((h) => {
                const doHorizonte = porHorizonte[h].filter((d) => acesos.has(d.id));
                if (!doHorizonte.length) return null;
                return (
                  <View key={h} style={{ gap: Spacing.one }}>
                    <ThemedText accessibilityRole="header" themeColor="textSecondary" style={{ fontFamily: FontFamily.voz }}>
                      {h}
                    </ThemedText>
                    <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
                      {doHorizonte.map((d) => (
                        <LinhaDaExperiencia key={d.id} experiencia={d} />
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {procurando || desejos.length >= 6 ? null : sementes}

          <FolhaDeEscolha testID="filtrar" visivel={ajustando} titulo="Quais estrelas acender" onFechar={() => setAjustando(false)}>
            {usadas.length > 0 ? <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz }}>de que tipo</ThemedText> : null}
            {usadas.length > 0 ? (
              <Opcoes
                rotulo="Categoria"
                voz
                opcoes={[{ valor: TODAS, rotulo: 'Todas' }, ...usadas.map((c) => ({ valor: c.id, rotulo: c.nome }))]}
                atual={categoriaAtual ? categoria : TODAS}
                onChange={setCategoria}
              />
            ) : null}
            {tamanhosUsados.length > 0 ? <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.voz }}>por quanto tempo</ThemedText> : null}
            {tamanhosUsados.length > 0 ? (
              <Opcoes
                rotulo="Duração"
                voz
                opcoes={[{ valor: TODAS, rotulo: 'Qualquer duração' }, ...tamanhosUsados]}
                atual={tamanhoAtual ? tamanho : TODAS}
                onChange={setTamanho}
              />
            ) : null}
            {/* Os filtros valem na hora do toque; aqui, só quantas estrelas ficaram acesas. */}
            <ThemedText accessibilityLiveRegion="polite" themeColor="textSecondary" style={{ fontFamily: FontFamily.voz }}>
              {filtrados.length === 1 ? '1 estrela acesa' : `${filtrados.length} estrelas acesas`}
            </ThemedText>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {filtrando ? (
                <Button
                  label="Limpar filtros"
                  variant="text"
                  onPress={() => {
                    setCategoria(TODAS);
                    setTamanho(TODAS);
                  }}
                />
              ) : (
                <View />
              )}
              <Button label="Pronto" variant="text" onPress={() => setAjustando(false)} />
            </View>
          </FolhaDeEscolha>
        </View>
      )}
    </Screen>
  );
}
