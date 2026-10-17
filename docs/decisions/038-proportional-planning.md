# 038 — Planejamento proporcional: categorias, tamanho, links, reservas, roteiro e orçamento

**Status:** Aceita (escolha do usuário, 2026-10-16). Move para o MVP itens de [future.md](../product/future.md). Segue o [ADR 010](./010-explicit-typed-records.md): cada tipo é uma estrutura própria.

## Contexto
O Laço precisa ajudar tanto em "assistir um filme" quanto em "uma viagem", sem virar gerenciador de tarefas ([vision.md](../product/vision.md)). Desejo e Planejamento tinham só título, quando, local e observações.

## Decisão
- **Categorias:** cada Laço começa com Filme, Restaurante, Passeio, Viagem, Show e Em casa, e o casal pode criar outras (até 40 caracteres, sem repetir o nome). Uma experiência pode ter várias, ou nenhuma. Em Desejos há filtro, só com as categorias em uso.
- **Tamanho:** opcional, entre "Uma noite", "Um dia", "Fim de semana" e "Vários dias". O rótulo não é "Viagem" para não repetir a categoria. Em Desejos, filtra. Nas próximas etapas, o tamanho sugere as seções de planejamento: uma noite mostra Links; um dia, Links, Reservas e Orçamento; fim de semana e vários dias, todas. As outras seções ficam em "Mais para planejar", e uma seção com conteúdo aparece sempre.
- **Links, Reservas, Roteiro por dia e Orçamento estimado** (um valor total do casal, em reais): uma etapa cada, nesta ordem.
- **Fora:** a lista para preparar ou levar, a "vontade" de cada um, o sorteio, os gastos, os arquivos e o mapa.

## Consequências
- Etapa 1 (categorias e tamanho): migração `20261016120000_categorias_e_tamanho.sql`, com a tabela `categorias` (a lista pronta é criada por um trigger em `lacos` e, para os Laços existentes, na própria migração), a tabela `experiencia_categorias` e a coluna `experiencias.tamanho`. A leitura e a escrita ficam só no próprio Laço.
- **Gerenciar categorias** (pedido do usuário): em Ajustes → Categorias, tocar numa abre para renomear ("Salvar categoria") ou excluir, com confirmação que explica que ela sai dos desejos e das experiências, que continuam existindo. No formulário, "Editar categorias" leva até lá. Renomear exige a migração `20261016130000_categorias_edicao.sql`.
- A lista de categorias é relida sempre que a tela volta ao foco (antes, uma tela aberta mostrava a lista do momento em que foi aberta).
- Etapa 2 (links): ver o [ADR 039](./039-links-and-map.md).
- **Etapa 3 (reservas):** a migração `20261016150000_reservas.sql` cria a tabela `reservas`.
  - Campos: o tipo (hospedagem, transporte, ingresso, mesa, outro) e o nome são obrigatórios. Data, horário (só com data), código de confirmação e link são opcionais.
  - O código fica à vista. "Copiar código" abre a tela de compartilhar do celular, que tem "Copiar": não há dependência de área de transferência.
  - A seção aparece em Planejamento e Vivendo. Fica à vista a partir de "Um dia"; em "Uma noite" ou sem tamanho, vai para "Mais para planejar". Com alguma reserva, aparece sempre, em qualquer estado.
  - A suíte do banco é `supabase/tests/reservas.mjs`.
- **Etapa 4 (roteiro por dia):** ver o [ADR 040](./040-itinerary-tab.md). O Roteiro saiu da regra do tamanho: tem um card próprio no fim de Detalhes (que "Fim de semana" e "Vários dias" só sugerem) e uma guia na experiência. "Mais para planejar" continua só com as Reservas.
- **Duração (antes "Tamanho"; pedido do usuário):** num **período**, a duração sai das datas e só aparece ("Fim de semana, pelas datas"), sem botões, e é salva junto. Um dia vira "Um dia"; 2 ou 3 dias, todos entre sexta e segunda e com sábado ou domingo, viram "Fim de semana"; qualquer outro período de 2 dias ou mais vira "Vários dias". Sem data, com mês ou com um dia só, o casal escolhe, porque as datas não distinguem uma noite de um dia. O rótulo passou a ser "Duração" (filtro: "Qualquer duração"; sem escolha: "Não sei ainda"). A coluna continua `experiencias.tamanho`, e a regra fica em `tamanhoPelasDatas` (`app/src/services/tamanho.ts`). Experiências já salvas com um período só ganham a duração das datas quando forem salvas de novo.
