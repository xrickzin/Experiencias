# Fase 3: Planejamento e Início (log)

Experiências que evoluem de estado, com referência temporal, e um Início que mostra o que está acontecendo. Decisões: [ADR 002](../decisions/002-experience-lifecycle.md), [004](../decisions/004-dates-and-automation.md), [014](../decisions/014-home-and-location.md), [019](../decisions/019-automation-implementation.md), [025](../decisions/025-wish-optional-fields.md), [027](../decisions/027-home-limits-and-past-planning.md). Produto: [lifecycle.md](../product/lifecycle.md), [dates-and-automation.md](../product/dates-and-automation.md), [navigation.md](../product/navigation.md#início).

> **Estado: concluída** (2026-10-15). Testada no Supabase local e nos testes automáticos; a migração `20261015130000_fase3_planejamento.sql` foi aplicada no projeto real e o usuário validou o app no celular. Implementada com autonomia delegada pelo usuário.

## O que foi implementado

**Banco** (`supabase/migrations/20261015130000_fase3_planejamento.sql`)
- Referência temporal em `experiencias`: `referencia_precisao` (`sem_data`, `mes_ano`, `data`, `data_horario`, `periodo`), `referencia_inicio`, `referencia_fim`, `referencia_horario`, com uma regra que exige exatamente os campos de cada precisão (mês/ano guarda o dia 1; período com fim ≥ início).
- Calculados pelo servidor, nunca pelo cliente: `inicio_em` (data → 00:00 no fuso do Laço; data + horário → esse horário; período → 00:00 do primeiro dia; sem data e mês/ano → nulo) e `armado_em` (muda a cada edição da referência e a cada transição; editar só o título não muda). Base da automação da Fase 7 (ADR 019).
- Transições por `mudar_estado(experiência, estado)`: só Desejo ↔ Planejamento e Planejamento ↔ Vivendo; qualquer outra é recusada. **Vivendo → Memória fica para a Fase 5.** Outro Laço recebe "inexistente".
- O cliente passa a escrever a referência; continua sem escrever estado, Laço, `inicio_em` e `armado_em`.

**Aplicativo**
- **Experiência** (`src/app/experiencia/[id].tsx`, substitui o detalhe só de desejo): a mesma tela em todos os estados, com textos de cada um ("Ainda é só uma ideia por enquanto.", "Vamos começar a dar forma a isso.", "Está acontecendo."). Ações: Desejo → "Começar planejamento"; Planejamento → "Começar a viver" e "Voltar para desejo"; Vivendo → "Voltar para planejamento". Relê ao abrir.
- **Quando** (`referencia-temporal-campo.tsx`): escolha da precisão (Sem data, Mês, Dia, Dia e horário, Período) e só os campos dela, digitados com máscara (`DD/MM/AAAA`, `MM/AAAA`, `HH:MM`). Datas impossíveis (31/04, 29/02 fora de bissexto) e período invertido são recusados com explicação. Também na criação do desejo (ADR 025).
- **Início** (`services/inicio.ts` + tela): nomes do casal no topo; **Vivendo agora** (1 destaque com "Continuar experiência →" e até 2 compactas), **Nosso próximo momento** (Planejamento com início futuro, da mais próxima, até 3), **Estamos preparando** (Planejamento sem início futuro, até 3); Desejos só como contagem. Sem nada em andamento, o convite para criar continua.
- **Listas completas** (`src/app/lista/[tipo].tsx`): "Ver todos" (próximas), "Ver planejamentos" (todos em Planejamento) e "Ver todas" (Vivendo além do limite).
- Desejos, Início e listas mostram título, quando e onde (`linha-da-experiencia.tsx`).

## Decisões tomadas nesta fase (autonomia delegada)
- **Datas digitadas com máscara, sem seletor nativo.** Funciona igual no Expo Go, no Android e no iOS, sem dependência nova, e é testável. O `@expo/ui` (`DateTimePicker`) não cobre mês/ano nem período. Um seletor visual pode substituir os campos depois sem mudar o banco.
- **Planejamento com data já passada** (deixado em aberto no ADR 027): aparece em "Estamos preparando", com os sem data, pela atualização mais recente; sem alerta nem indicação de atraso, como o ADR pede.
- **Vivendo além de 3:** "Ver todas" abre a lista completa, para o Início nunca esconder itens sem caminho (ADR 027).
- **Transições sem pop-up de confirmação:** são reversíveis. Só finalizar (Fase 5) e excluir pedem confirmação.
- **Animação do fio na transição** (UX): não implementada; movimento continua pendente.

## Validação (2026-10-15)

| Verificação | Resultado |
|---|---|
| `npm test` (app) | 11 arquivos, **136 testes** |
| `supabase/tests/planejamento.mjs` (Supabase local) | 31 verificações passaram |
| `integracao.mjs`, `experiencias.mjs`, `sessao-app.mjs` | passaram |
| `supabase db reset` (local) | as três migrações aplicam do zero, em ordem |
| `tsc`, `expo lint`, `expo export` (Android e iOS) | saída 0, sem avisos |

- **Testes do app novos:** `referencia-test.ts` (máscaras, leitura de cada precisão, bissexto, datas impossíveis, ida e volta banco ↔ tela, textos, organização do Início) e `planejamento-test.tsx` (transições e falha, data com máscara, período inválido, precisão marcada para leitor de tela, criar com mês, blocos do Início, "Ver todos", abrir experiência).
- **Integração** (`planejamento.mjs`): instante de início em cada precisão no fuso de São Paulo, seis referências incoerentes recusadas, cliente sem escrever `inicio_em`/`armado_em`/estado, `armado_em` só muda com referência e transição, todas as transições válidas e as inválidas (Vivendo → Desejo, Desejo → Vivendo, Memória, estado desconhecido), outro Laço e sem sessão recusados, edição e exclusão em Planejamento.

**Validado pelo usuário no celular** (2026-10-15), com o projeto Supabase real.

## O que exige a sua ação
1. **Aplicar a migração no projeto real:** SQL Editor → `03 · Fase 3 · Planejamento e referência temporal` com o conteúdo de `supabase/migrations/20261015130000_fase3_planejamento.sql`. Depende das Fases 1 e 2. Sem ela, o app atualizado falha ao carregar experiências no projeto real (pede colunas que não existem).
2. **Testar no aparelho:** começar planejamento, começar a viver e voltar; pôr uma data futura e ver em "Nosso próximo momento"; mês e período; data passada em "Estamos preparando"; com dois aparelhos, a mudança da outra pessoa ao voltar para Início.
3. **Avaliar as decisões acima**, principalmente as datas digitadas (em vez de calendário) e onde fica o Planejamento com data passada.
