import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { LinksDaExperiencia } from '@/components/links-da-experiencia';
import { ReservasDaExperiencia } from '@/components/reservas-da-experiencia';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useReservas } from '@/hooks/use-reservas';
import type { Experiencia } from '@/services/experiencias';
import { sugereReservas } from '@/services/tamanho';

/**
 * As seções de planejamento abaixo do formulário (ADR 038). Links valem em todo estado. Reservas, em
 * Planejamento e Vivendo: à vista quando o tamanho pede; senão, em "Mais para planejar". Uma seção
 * com conteúdo aparece sempre, em qualquer estado.
 */
export function SecoesDePlanejamento({ experiencia }: { experiencia: Experiencia }) {
  const reservas = useReservas(experiencia.id);
  const carregarReservas = reservas.carregar;
  const [reservasAbertas, setReservasAbertas] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void carregarReservas();
    }, [carregarReservas])
  );

  const planejando = experiencia.estado === 'planejamento' || experiencia.estado === 'vivendo';
  const comReservas = reservas.reservas.length > 0 || Boolean(reservas.erro);
  const mostrarReservas = comReservas || (planejando && (sugereReservas(experiencia.tamanho) || reservasAbertas));
  const escondidas = planejando && reservas.carregado && !mostrarReservas;

  return (
    <View style={{ gap: Spacing.five }}>
      <LinksDaExperiencia experienciaId={experiencia.id} />
      {mostrarReservas ? <ReservasDaExperiencia reservas={reservas} /> : null}
      {escondidas ? (
        <View style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold" accessibilityRole="header">
            Mais para planejar
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Pela duração da experiência, ficou à vista só o essencial. Abram o que precisarem.
          </ThemedText>
          <Button label="Reservas" variant="secondary" onPress={() => setReservasAbertas(true)} />
        </View>
      ) : null}
    </View>
  );
}
