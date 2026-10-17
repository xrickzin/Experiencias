import { View } from 'react-native';

import { Button } from '@/components/button';
import { MensagemErro } from '@/components/mensagem-erro';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sugereRoteiro, type Tamanho } from '@/services/tamanho';

// Um dia de exemplo, com a mesma forma dos itens da guia: período, horário quando há, o que fazer.
const EXEMPLO = [
  { periodo: 'Manhã', horario: '08:00', texto: 'Café na pousada' },
  { periodo: 'Tarde', horario: null, texto: 'Trilha até a cachoeira' },
  { periodo: 'Noite', horario: '20:30', texto: 'Jantar na vila' },
];

const SUGESTAO: Partial<Record<Tamanho, string>> = {
  fim_de_semana: 'Combina com um fim de semana.',
  viagem: 'Combina com uma experiência de vários dias.',
};

type Props = {
  ativo: boolean;
  tamanho: Tamanho | null;
  /** Ligado na experiência já criada: "3 itens em 2 dias", ou nulo sem itens. Ausente ao criar. */
  resumo?: string | null;
  ocupado?: boolean;
  erro?: string;
  onUsar: () => void;
  onDesligar: () => void;
  /** Leva à guia Roteiro (só na experiência já criada). */
  onAbrir?: () => void;
};

/**
 * Convite para o roteiro por dia (ADR 040), no fim do formulário: diz o que é, mostra um dia de
 * exemplo e liga com um toque. Ligado, vira o atalho para a guia e o lugar de desligar.
 */
export function CartaoDoRoteiro({ ativo, tamanho, resumo, ocupado, erro, onUsar, onDesligar, onAbrir }: Props) {
  const theme = useTheme();
  const sugestao = sugereRoteiro(tamanho) ? SUGESTAO[tamanho!] : undefined;
  const criando = resumo === undefined;

  return (
    <View style={{ borderRadius: Radius.photo, backgroundColor: theme.backgroundElement, padding: Spacing.four, gap: Spacing.three }}>
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="subtitle" accessibilityRole="header" style={{ fontSize: 22, lineHeight: 28 }}>
          Roteiro por dia
        </ThemedText>
        {ativo ? (
          <ThemedText type="smallBold" style={{ color: theme.accentStrong }} accessibilityLiveRegion="polite">
            {criando ? 'Vai junto com o desejo' : resumo ? `Ligado · ${resumo}` : 'Ligado · ainda sem itens'}
          </ThemedText>
        ) : sugestao ? (
          <ThemedText type="smallBold" style={{ color: theme.accentStrong }}>
            {sugestao}
          </ThemedText>
        ) : null}
      </View>

      {ativo ? (
        <ThemedText themeColor="textSecondary">
          {criando
            ? 'Assim que o desejo for criado, ele ganha a guia Roteiro, ao lado de Detalhes.'
            : 'Fica na guia Roteiro, ao lado de Detalhes, e os dois podem mexer.'}
        </ThemedText>
      ) : (
        <>
          <ThemedText themeColor="textSecondary">
            Uma guia para montar cada dia: o que fazer de manhã, à tarde e à noite, na ordem que vocês quiserem. Cada
            item pode ter horário e links.
          </ThemedText>
          <Exemplo />
        </>
      )}

      {erro ? <MensagemErro>{erro}</MensagemErro> : null}

      {ativo ? (
        <View style={{ gap: Spacing.two }}>
          {onAbrir ? <Button label="Abrir o roteiro" variant="secondary" disabled={ocupado} onPress={onAbrir} /> : null}
          <View style={{ alignItems: 'flex-start' }}>
            <Button
              label={criando ? 'Não usar roteiro' : 'Desligar o roteiro'}
              variant="text"
              loading={ocupado}
              onPress={onDesligar}
            />
          </View>
        </View>
      ) : (
        // Ao criar, a ação principal da tela é 'Adicionar desejo': o card não compete com ela.
        <Button label="Usar roteiro" variant={sugestao && !criando ? 'primary' : 'secondary'} loading={ocupado} onPress={onUsar} />
      )}
    </View>
  );
}

/** Um sábado de exemplo, desenhado como na guia, só para mostrar a ideia. */
function Exemplo() {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Por exemplo, um sábado: ${EXEMPLO.map((e) => `${e.periodo.toLowerCase()}${e.horario ? `, ${e.horario}` : ''}, ${e.texto}`).join('; ')}.`}
      style={{ borderRadius: Radius.field, backgroundColor: theme.background, padding: Spacing.three, gap: Spacing.two }}>
      <ThemedText type="small" themeColor="textSecondary">
        Por exemplo, um sábado
      </ThemedText>
      {EXEMPLO.map((e) => (
        <View key={e.periodo} style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.three }}>
          <ThemedText type="small" themeColor="textSecondary" style={{ width: 52 }}>
            {e.periodo}
          </ThemedText>
          <ThemedText type="smallBold" style={{ width: 44, fontVariant: ['tabular-nums'] }}>
            {e.horario ?? ''}
          </ThemedText>
          <ThemedText type="small" style={{ flex: 1 }}>
            {e.texto}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}
