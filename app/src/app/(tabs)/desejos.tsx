import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { LinhaDaExperiencia } from '@/components/linha-da-experiencia';
import { Opcoes } from '@/components/opcoes';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCategorias } from '@/hooks/use-categorias';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useTheme } from '@/hooks/use-theme';
import { TAMANHOS } from '@/services/tamanho';

const TODAS = 'todas';

export default function Desejos() {
  const theme = useTheme();
  const { desejos, carregando, erro, recarregar } = useExperiencias();
  const { categorias } = useCategorias();
  const [categoria, setCategoria] = useState(TODAS);
  const [tamanho, setTamanho] = useState(TODAS);

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
    (d) => (categoria === TODAS || d.categorias.includes(categoria)) && (tamanho === TODAS || d.tamanho === tamanho)
  );

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Desejos"
        title="O que queremos viver"
        description="Coisas que ainda queremos viver juntos."
      />

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
        <EmptyState
          title="Nenhum desejo ainda"
          description="Aqui ficam as experiências que vocês querem viver. Comecem pela primeira."
          actionLabel="Adicionar o primeiro desejo"
          onAction={() => router.push('/criar')}
        />
      ) : (
        <View style={{ gap: Spacing.four }}>
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
              rotulo="Filtrar por tamanho"
              opcoes={[{ valor: TODAS, rotulo: 'Qualquer tamanho' }, ...tamanhosUsados]}
              atual={tamanhosUsados.some((t) => t.valor === tamanho) ? tamanho : TODAS}
              onChange={setTamanho}
            />
          ) : null}
          {filtrados.length === 0 ? (
            <ThemedText themeColor="textSecondary">Nenhum desejo com esse filtro.</ThemedText>
          ) : (
            <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
              {filtrados.map((desejo) => (
                <LinhaDaExperiencia key={desejo.id} experiencia={desejo} />
              ))}
            </View>
          )}
          <Button label="Adicionar desejo" variant="secondary" onPress={() => router.push('/criar')} />
        </View>
      )}
    </Screen>
  );
}
