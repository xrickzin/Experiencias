# 031 — Memórias só com mês/ano em Nossa História

**Status:** Aceita (escolha do usuário, 2026-10-15). Resolve a pendência UX-V11.

## Contexto
Nossa História agrupa as memórias por mês e, dentro do mês, segue a ordem cronológica crescente ([our-story.md](../ux/our-story.md)). Uma memória registrada só com mês/ano não tem dia, então não dá para ordená-la entre as outras sem inventar uma data, o que a especificação proíbe.

## Alternativas consideradas
- **A) No fim do mês, separadas por uma linha discreta.** Não sugerem um dia, e as memórias com data continuam em ordem.
- **B) No começo do mês.** Também seriam honestas, mas vêm antes do dia 1 e parecem mais importantes.
- **C) Misturadas às outras, como se fossem do dia 1.** É o mais simples, mas sugere uma data que não existe.

## Decisão
**A.** Dentro de cada mês, primeiro vêm as memórias com dia, em ordem crescente. Depois, sob o texto discreto "Em algum dia de {mês}", vêm as que só têm mês/ano, em ordem alfabética do título.

## Consequências
- O item continua com o mesmo formato (foto de destaque, título e "outubro de 2026").
- A regra fica em `app/src/services/nossa-historia.ts` (`agruparPorMes`).
