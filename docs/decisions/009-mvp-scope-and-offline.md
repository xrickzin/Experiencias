# 009 — Escopo do MVP e online-only

**Status:** Aceita

## Contexto
A documentação conceitual descrevia mais do que se pretende construir primeiro (vídeos, gastos, notificações, roteiro…).

## Decisão
- O MVP é o que está listado em [mvp.md](../product/mvp.md). O que não está escrito não deve ser implementado; ideias conceituais **não são requisitos**.
- Ficam fora: categorias, gastos, checklist avançado, reservas, mapas, navegação, vídeos, notificações, retrospectivas, IA para memórias, compartilhamento externo, offline-first, sincronização complexa, recursos sociais.
- O MVP é **online-only**. Sem conexão: informar o problema e **nunca afirmar que algo foi salvo se não foi persistido**.

## Consequências
- Sem fila de envio nem armazenamento local de dados do casal.
- Tolerância à falta de conexão é possibilidade futura ([future.md](../product/future.md)).

## Alternativas consideradas
- Offline-first desde o início: descartada, pela complexidade de sincronização.
