# 040 — Roteiro por dia: card próprio, guia, ordem por arrastar e links nos itens

**Status:** Aceita (escolha do usuário, 2026-10-16). Detalha a etapa 4 do [ADR 038](./038-proportional-planning.md) e muda a forma como o Roteiro aparece: em vez de seguir a regra do tamanho e de "Mais para planejar", ele tem um card e uma guia próprios. O usuário pretende expandir essa área.

## Decisão
- **Card "Roteiro por dia"** no fim de Detalhes e no fim do formulário de criar (coluna `experiencias.roteiro_ativo`). Ele diz o que é o roteiro, mostra um sábado de exemplo e tem o botão "Usar roteiro". Em Detalhes, liga na hora, sem depender do "Salvar". Ao criar, vale junto com "Adicionar desejo". Ligado, o card mostra o resumo ("2 itens em 1 dia"), "Abrir o roteiro" e "Desligar o roteiro". Na Memória, o card não aparece.
- **Tamanho só sugere:** com "Fim de semana" ou "Vários dias", o card diz "Combina com…" e o botão ganha destaque, mas nada liga sozinho. (Na primeira versão, o tamanho ligava o botão; o usuário preferiu a sugestão.)
- **Guia "Roteiro"** quando o roteiro está ligado:
  - Desejo: Detalhes | Roteiro (Desejo só tem guias nesse caso);
  - Planejamento: Detalhes | Roteiro | Momentos;
  - Vivendo: Momentos | Roteiro | Detalhes;
  - Memória: Memória | Momentos | Roteiro | Detalhes, só se houver itens.
- **Conteúdo:** os dias da experiência, mesmo vazios ("Dia 1", "Dia 2"…, quando a experiência tem um dia ou um período de até 31 dias), e qualquer dia com itens. Cada item tem dia, período (madrugada, manhã, tarde ou noite, os mesmos dos Momentos), horário opcional e texto (até 200 caracteres).
- **Editor:** um botão por dia da experiência (até 14) ou o dia digitado. Digitar o horário escolhe o período; trocar o período para um que não combina tira o horário. O banco também confere que o horário cai no período.
- **Ordem:** a coluna `ordem` é do casal. Ao guardar, o horário sugere a posição (antes do primeiro item com horário mais tarde). Depois, segurar e arrastar muda a ordem dentro do dia, inclusive de um período para outro: o item passa a ser do período e perde um horário que não caiba nele. Para mudar de dia, usa-se a edição. Leitores de tela têm as ações "Mover para cima" e "Mover para baixo".
- **Links nos itens:** cada item pode apontar para vários links da própria experiência, os mesmos da seção Links. No editor, os links viram botões para marcar, e "+ Novo link" cria um ali mesmo, que também passa a aparecer em Links. Na guia, os links aparecem embaixo do item e cada um abre o seu endereço. Excluir o link ou o item só desfaz a associação.
- **Textos:** campos obrigatórios só com `*` (a palavra "obrigatório" fica no nome para leitores de tela, como no resto do app). No editor, os dias são "Sáb, 12/12" e "Outra data", sem repetir "Dia".
- **Desligar com itens** pede confirmação ("Os N itens do roteiro serão excluídos") e exclui os itens no servidor, na mesma transação (trigger em `experiencias`).

## Consequências
- Migração `20261016160000_roteiro.sql`:
  - coluna `experiencias.roteiro_ativo`;
  - tabela `roteiro`, com a mesma RLS por Laço das reservas. A criação só é aceita com o roteiro ligado;
  - função `periodo_do_horario`, com as faixas de `periodoDaHora`;
  - trigger que exclui o roteiro ao desligar.
- Migração `20261016170000_roteiro_links.sql`: tabela `roteiro_links` (item e link da mesma experiência, do próprio Laço), com exclusão em cascata pelos dois lados.
- A ordem é esparsa (`double precision`): inserir ou arrastar grava só o item movido, no meio entre os vizinhos.
- Arrastar usa `react-native-gesture-handler`, que já vinha com o Expo. A raiz do app ganhou `GestureHandlerRootView`. O Jest carrega `react-native-gesture-handler/jestSetup.js`.
- Para quem não usa leitor de tela, a ordem exata só muda arrastando. O horário e a edição cobrem o resto.
- Suíte do banco: `supabase/tests/roteiro.mjs`. Testes do app: `app/src/__tests__/roteiro-test.tsx`.
