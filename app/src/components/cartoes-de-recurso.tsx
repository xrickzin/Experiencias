import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { MensagemErro } from '@/components/mensagem-erro';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sugereOrcamento, sugereRoteiro, type Tamanho } from '@/services/tamanho';

/** O que muda entre os recursos que se ligam por card (roteiro e orçamento). */
type Recurso = {
  titulo: string;
  /** O nome curto nos botões: "roteiro", "orçamento". */
  nome: string;
  /** O que a guia faz, antes de ligar. */
  descricao: string;
  exemplo: ReactNode;
  /** Ligado, sem conteúdo ainda: "ainda sem itens". */
  vazio: string;
};

type Props = {
  ativo: boolean;
  /** "Combina com um fim de semana.": a duração sugere, nunca liga sozinha. */
  sugestao?: string;
  /** Ligado na experiência já criada: o que já há ("3 itens em 2 dias"), ou nulo sem nada. Ausente ao criar. */
  resumo?: string | null;
  ocupado?: boolean;
  erro?: string;
  onUsar: () => void;
  onDesligar: () => void;
  /** Leva à guia (só na experiência já criada). */
  onAbrir?: () => void;
};

/**
 * Convite para um recurso com guia própria (ADR 040 e 041), no fim do formulário: diz o que é, mostra
 * um exemplo e liga com um toque. Ligado, vira o atalho para a guia e o lugar de desligar.
 */
function CartaoDeRecurso({ recurso, ativo, sugestao, resumo, ocupado, erro, onUsar, onDesligar, onAbrir }: Props & { recurso: Recurso }) {
  const theme = useTheme();
  const criando = resumo === undefined;
  const guia = recurso.titulo.split(' ')[0];

  return (
    <View style={{ borderRadius: Radius.photo, backgroundColor: theme.backgroundElement, padding: Spacing.four, gap: Spacing.three }}>
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="subtitle" accessibilityRole="header" style={{ fontSize: 22, lineHeight: 28 }}>
          {recurso.titulo}
        </ThemedText>
        {ativo ? (
          <ThemedText type="smallBold" style={{ color: theme.accentStrong }} accessibilityLiveRegion="polite">
            {criando ? 'Vai junto com o desejo' : `Ligado · ${resumo ?? recurso.vazio}`}
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
            ? `Assim que o desejo for criado, ele ganha a guia ${guia}, ao lado de Detalhes.`
            : `Fica na guia ${guia}, ao lado de Detalhes, e os dois podem mexer.`}
        </ThemedText>
      ) : (
        <>
          <ThemedText themeColor="textSecondary">{recurso.descricao}</ThemedText>
          {recurso.exemplo}
        </>
      )}

      {erro ? <MensagemErro>{erro}</MensagemErro> : null}

      {ativo ? (
        <View style={{ gap: Spacing.two }}>
          {onAbrir ? <Button label={`Abrir o ${recurso.nome}`} variant="secondary" disabled={ocupado} onPress={onAbrir} /> : null}
          <View style={{ alignItems: 'flex-start' }}>
            <Button
              label={criando ? `Não usar ${recurso.nome}` : `Desligar o ${recurso.nome}`}
              variant="text"
              loading={ocupado}
              onPress={onDesligar}
            />
          </View>
        </View>
      ) : (
        // Ao criar, a ação principal da tela é "Adicionar desejo": o card não compete com ela.
        <Button
          label={`Usar ${recurso.nome}`}
          variant={sugestao && !criando ? 'primary' : 'secondary'}
          loading={ocupado}
          onPress={onUsar}
        />
      )}
    </View>
  );
}

/** A caixa de exemplo, mais escura que o card, com a legenda "Por exemplo…". */
function CaixaDeExemplo({ legenda, descricao, children }: { legenda: string; descricao: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={descricao}
      style={{ borderRadius: Radius.field, backgroundColor: theme.background, padding: Spacing.three, gap: Spacing.two }}>
      <ThemedText type="small" themeColor="textSecondary">
        {legenda}
      </ThemedText>
      {children}
    </View>
  );
}

const SUGESTAO: Partial<Record<Tamanho, string>> = {
  dia: 'Combina com um dia inteiro.',
  fim_de_semana: 'Combina com um fim de semana.',
  viagem: 'Combina com uma experiência de vários dias.',
};

// Um dia de exemplo, com a mesma forma dos itens da guia: período, horário quando há, o que fazer.
const DIA_DE_EXEMPLO = [
  { periodo: 'Manhã', horario: '08:00', texto: 'Café na pousada' },
  { periodo: 'Tarde', horario: null, texto: 'Trilha até a cachoeira' },
  { periodo: 'Noite', horario: '20:30', texto: 'Jantar na vila' },
];

const ROTEIRO: Recurso = {
  titulo: 'Roteiro por dia',
  nome: 'roteiro',
  descricao:
    'Uma guia para montar cada dia: o que fazer de manhã, à tarde e à noite, na ordem que vocês quiserem. Cada item pode ter horário e links.',
  vazio: 'ainda sem itens',
  exemplo: (
    <CaixaDeExemplo
      legenda="Por exemplo, um sábado"
      descricao={`Por exemplo, um sábado: ${DIA_DE_EXEMPLO.map((e) => `${e.periodo.toLowerCase()}${e.horario ? `, ${e.horario}` : ''}, ${e.texto}`).join('; ')}.`}>
      {DIA_DE_EXEMPLO.map((e) => (
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
    </CaixaDeExemplo>
  ),
};

const ORCAMENTO: Recurso = {
  titulo: 'Orçamento',
  nome: 'orçamento',
  descricao: 'Uma guia para o quanto vocês pensam em gastar, somando tudo, para os dois. Ajuda a decidir com calma e a combinar antes.',
  vazio: 'ainda sem valor',
  exemplo: (
    <CaixaDeExemplo legenda="Por exemplo, um fim de semana na serra" descricao="Por exemplo, um fim de semana na serra: 1.200 reais, estimativa para os dois.">
      <ThemedText style={{ fontFamily: FontFamily.display, fontSize: 28, lineHeight: 34 }}>R$ 1.200,00</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontStyle: 'italic' }}>
        Estimativa para os dois
      </ThemedText>
    </CaixaDeExemplo>
  ),
};

type DoRecurso = Omit<Props, 'sugestao'> & { tamanho: Tamanho | null };

/** Roteiro por dia (ADR 040): sugerido em fim de semana e vários dias. */
export function CartaoDoRoteiro({ tamanho, ...props }: DoRecurso) {
  return <CartaoDeRecurso recurso={ROTEIRO} sugestao={sugereRoteiro(tamanho) ? SUGESTAO[tamanho!] : undefined} {...props} />;
}

/** Orçamento (ADR 041): sugerido a partir de um dia. */
export function CartaoDoOrcamento({ tamanho, ...props }: DoRecurso) {
  return <CartaoDeRecurso recurso={ORCAMENTO} sugestao={sugereOrcamento(tamanho) ? SUGESTAO[tamanho!] : undefined} {...props} />;
}
