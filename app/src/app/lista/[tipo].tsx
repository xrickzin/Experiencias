import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { LinhaDaExperiencia } from '@/components/linha-da-experiencia';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { useExperiencias } from '@/hooks/use-experiencias';
import { useTheme } from '@/hooks/use-theme';
import { organizarInicio } from '@/services/inicio';

const TEXTOS = {
  proximas: { eyebrow: 'Próximas', titulo: 'O que vem pela frente', vazio: 'Nenhuma experiência com data marcada.' },
  planejamentos: { eyebrow: 'Planejamentos', titulo: 'O que estamos preparando', vazio: 'Nada em planejamento agora.' },
  vivendo: { eyebrow: 'Vivendo', titulo: 'O que está acontecendo', vazio: 'Nada acontecendo agora.' },
} as const;

type Tipo = keyof typeof TEXTOS;

/** Listas completas abertas a partir de Início ("Ver todos", "Ver planejamentos"); sem nova aba (ADR 027). */
export default function Lista() {
  const theme = useTheme();
  const { tipo } = useLocalSearchParams<{ tipo: string }>();
  const { experiencias, recarregar } = useExperiencias();

  useFocusEffect(
    useCallback(() => {
      void recarregar();
    }, [recarregar])
  );

  const chave: Tipo = tipo === 'planejamentos' || tipo === 'vivendo' ? tipo : 'proximas';
  const inicio = organizarInicio(experiencias, new Date());
  const itens =
    chave === 'proximas' ? inicio.proximas : chave === 'vivendo' ? inicio.vivendo : inicio.todosOsPlanejamentos;
  const textos = TEXTOS[chave];

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader eyebrow={textos.eyebrow} title={textos.titulo} />
      {itens.length === 0 ? (
        <ThemedText themeColor="textSecondary">{textos.vazio}</ThemedText>
      ) : (
        <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
          {itens.map((e) => (
            <LinhaDaExperiencia key={e.id} experiencia={e} />
          ))}
        </View>
      )}
      <View style={{ alignItems: 'flex-start' }}>
        <Button label="Voltar" variant="text" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
