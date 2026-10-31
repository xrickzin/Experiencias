import * as SecureStore from 'expo-secure-store';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { CeuDeDesejos, horizonteDe, HORIZONTES, type Horizonte } from '@/components/ceu-de-desejos';
import { EmptyState } from '@/components/empty-state';
import { LinhaDaExperiencia } from '@/components/linha-da-experiencia';
import { Opcoes } from '@/components/opcoes';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useCategorias } from '@/hooks/use-categorias';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useTheme } from '@/hooks/use-theme';
import type { Experiencia } from '@/services/experiencias';
import { TAMANHOS } from '@/services/tamanho';

const TODAS = 'todas';
type Modo = 'ceu' | 'lista';
// O modo escolhido por último, neste aparelho.
const CHAVE_DO_MODO = 'laco.desejos.modo';

// Começos de frase que abrem a criação com o texto já escrito: a tela nunca fica em branco.
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
    }, [recarregar])
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

  const sementes = (
    <View style={{ gap: Spacing.two }}>
      <ThemedText themeColor="textSecondary" style={{ fontFamily: FontFamily.display, fontStyle: 'italic' }}>
        Para começar um desejo
      </ThemedText>
      {SEMENTES.map((s) => (
        <Pressable
          key={s}
          accessibilityRole="button"
          accessibilityLabel={`Começar um desejo: ${s}`}
          onPress={() => router.push({ pathname: '/criar', params: { titulo: s } })}
          style={({ pressed }) => ({
            paddingVertical: Spacing.two,
            paddingHorizontal: Spacing.three,
            borderRadius: Radius.field,
            borderWidth: 1,
            borderColor: theme.papelBorda,
            backgroundColor: theme.papel,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}>
          <ThemedText style={{ fontFamily: FontFamily.display, fontStyle: 'italic' }}>{s}…</ThemedText>
        </Pressable>
      ))}
    </View>
  );

  return (
    <Screen>
      <ScreenHeader title="O que sonhamos viver" description="Tudo o que ainda queremos viver juntos." />

      {carregando ? (
        <ThemedText themeColor="textSecondary" accessibilityLiveRegion="polite">
          Carregando…
        </ThemedText>
      ) : erro && desejos.length === 0 ? (
        <EmptyState
          title="Não foi possível carregar"
          description={erro}
          actionLabel="Tentar de novo"
          onAction={() => {
            void recarregar();
          }}
        />
      ) : desejos.length === 0 ? (
        <View style={{ gap: Spacing.four }}>
          <EmptyState
            title="Nenhum desejo ainda"
            description="O céu de vocês ainda está limpo. Uma estrela começa com uma frase."
            actionLabel="Adicionar o primeiro desejo"
            onAction={() => router.push('/criar')}
          />
          {sementes}
        </View>
      ) : (
        <View style={{ gap: Spacing.four }}>
          <View style={{ gap: Spacing.three }}>
            <TextInput
              value={termo}
              onChangeText={setTermo}
              placeholder="Procurar um desejo"
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Procurar um desejo"
              returnKeyType="search"
              clearButtonMode="while-editing"
              style={{
                minHeight: 48,
                paddingHorizontal: Spacing.three,
                borderRadius: Radius.field,
                borderWidth: 1,
                borderColor: theme.outline,
                color: theme.text,
                fontFamily: FontFamily.body,
                fontSize: 16,
              }}
            />
            <Opcoes<Modo>
              rotulo="Ver como"
              opcoes={[
                { valor: 'ceu', rotulo: 'Céu' },
                { valor: 'lista', rotulo: 'Lista' },
              ]}
              atual={modo}
              onChange={escolherModo}
            />
            {usadas.length > 0 ? (
              <Opcoes
                rotulo="Filtrar por categoria"
                opcoes={[{ valor: TODAS, rotulo: 'Todas' }, ...usadas.map((c) => ({ valor: c.id, rotulo: c.nome }))]}
                atual={usadas.some((c) => c.id === categoria) ? categoria : TODAS}
                onChange={setCategoria}
              />
            ) : null}
            {tamanhosUsados.length > 0 ? (
              <Opcoes
                rotulo="Filtrar por duração"
                opcoes={[{ valor: TODAS, rotulo: 'Qualquer duração' }, ...tamanhosUsados]}
                atual={tamanhosUsados.some((t) => t.valor === tamanho) ? tamanho : TODAS}
                onChange={setTamanho}
              />
            ) : null}
          </View>

          {procurando ? (
            // O que bateu com a busca, para abrir com um toque; no céu, as mesmas estrelas acendem.
            <View style={{ borderRadius: Radius.field, backgroundColor: theme.papel, paddingHorizontal: Spacing.three }}>
              {filtrados.length ? (
                filtrados.map((d) => <LinhaDaExperiencia key={d.id} experiencia={d} />)
              ) : (
                <ThemedText themeColor="textSecondary" style={{ paddingVertical: Spacing.three, fontFamily: FontFamily.display, fontStyle: 'italic' }}>
                  Nenhum desejo com essa palavra.
                </ThemedText>
              )}
            </View>
          ) : filtrados.length === 0 ? (
            <ThemedText themeColor="textSecondary">Nenhum desejo com esse filtro.</ThemedText>
          ) : null}

          {modo === 'ceu' ? (
            // Procurando, o céu continua à vista com as estrelas que bateram acesas; quem fala com o
            // leitor de tela é a lista logo acima.
            <View
              importantForAccessibility={procurando ? 'no-hide-descendants' : 'auto'}
              accessibilityElementsHidden={procurando}>
              <CeuDeDesejos porHorizonte={porHorizonte} acesos={acesos} procurando={procurando} />
            </View>
          ) : procurando ? null : (
            <View style={{ gap: Spacing.four }}>
              {HORIZONTES.map((h) => {
                const doHorizonte = porHorizonte[h].filter((d) => acesos.has(d.id));
                if (!doHorizonte.length) return null;
                return (
                  <View key={h} style={{ gap: Spacing.one }}>
                    <ThemedText accessibilityRole="header" themeColor="textSecondary" style={{ fontFamily: FontFamily.display, fontStyle: 'italic' }}>
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

          <Button label="Adicionar desejo" variant="secondary" onPress={() => router.push('/criar')} />
          {sementes}
        </View>
      )}
    </Screen>
  );
}
