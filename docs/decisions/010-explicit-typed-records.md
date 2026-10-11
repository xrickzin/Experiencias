# 010 — Registros explícitos e tipados

**Status:** Aceita

## Contexto
"Não impor estrutura ao planejamento" poderia levar a um sistema de blocos genéricos, como um editor livre.

## Decisão
- No MVP os registros são **fotos** e **observações simples**.
- Cada tipo de informação é uma estrutura **explícita e tipada**. Não existe abstração de "qualquer bloco" nem editor livre estilo Notion.
- Um novo tipo só é criado quando houver necessidade real e decisão de produto.

## Consequências
- Mais código por tipo novo, porém modelo simples de validar, consultar e proteger.
- Gastos, roteiro, checklist etc. entram um por vez ([future.md](../product/future.md)).

## Alternativas consideradas
- Blocos genéricos configuráveis: descartada, pelo risco de overengineering e de modelo difícil de proteger.
