# 041 — Orçamento estimado: card próprio e guia, como o roteiro

**Status:** Aceita (escolha do usuário, 2026-10-16). Detalha a etapa 5 do [ADR 038](./038-proportional-planning.md). Segue o mesmo tratamento do roteiro ([ADR 040](./040-itinerary-tab.md)), para os recursos opcionais terem um só jeito de funcionar. O usuário pretende expandir essa área.

## Decisão
- **Card "Orçamento"** no fim de Detalhes e do formulário de criar, logo depois do card do roteiro (colunas `experiencias.orcamento_ativo` e `orcamento_centavos`):
  - diz o que é ("o quanto vocês pensam em gastar, somando tudo, para os dois") e mostra um exemplo (R$ 1.200,00 num fim de semana na serra);
  - "Usar orçamento" liga na hora em Detalhes; ao criar, vale junto com "Adicionar desejo";
  - ligado, mostra "Ligado · R$ 1.200,00" (ou "ainda sem valor"), "Abrir o orçamento" e "Desligar o orçamento";
  - na Memória, o card não aparece.
- **A duração só sugere:** com "Um dia", "Fim de semana" ou "Vários dias", o card diz "Combina com…" e o botão ganha destaque (fora da tela de criar). Nada liga sozinho.
- **Guia "Orçamento"**, depois da do roteiro: Planejamento fica Detalhes | Roteiro | Orçamento | Momentos. Na Memória, aparece só com valor.
- **Conteúdo:** por enquanto, um valor total do casal (ADR 038), de R$ 0,00 a R$ 100.000,00, mostrado em destaque ("R$ 1.200,00", *Estimativa para os dois*). "Definir valor" ou "Mudar valor" abre o editor:
  - o campo "Valor estimado (R$)" tem máscara, e os dígitos entram pelos centavos;
  - "Guardar valor" grava; "Tirar o valor" limpa e mantém o orçamento ligado;
  - acima do limite, o aviso aparece sem ir ao servidor.
- **Desligar com valor** pede confirmação ("O orçamento de R$ 1.200,00 será apagado, para os dois.") e o banco apaga o valor na mesma atualização.

## Consequências
- Migração `20261016180000_orcamento.sql`:
  - as duas colunas, com o valor de 0 a 10.000.000 centavos;
  - uma restrição que só aceita valor com o orçamento ligado;
  - um trigger que apaga o valor ao desligar.
- "Mais para planejar" continua só com as Reservas: roteiro e orçamento têm card próprio.
- Formatação em reais sem `Intl` (o suporte a pt-BR no Android é irregular), em `app/src/services/orcamento.ts`.
- O card é um só componente para os dois recursos (`app/src/components/cartoes-de-recurso.tsx`).
- Suíte do banco: `supabase/tests/orcamento.mjs`. Testes do app: `app/src/__tests__/orcamento-test.tsx`.
- Com roteiro e orçamento, a Memória chega a cinco guias. As guias passaram a ter a largura do próprio nome, sem quebrar a palavra: dividem a linha quando cabem e rolam para o lado quando não cabem (`app/src/components/abas.tsx`).
