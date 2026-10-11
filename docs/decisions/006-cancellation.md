# 006 — Cancelamento

**Status:** Aceita

## Contexto
Era preciso definir o que acontece quando o casal desiste de uma experiência, sem criar um estado de "cancelada" que vira lixeira ou falso histórico.

## Decisão
- Cancelar significa que a experiência **não deve mais existir no aplicativo**. É **definitivo**, com **confirmação explícita**.
- Vale em qualquer estado, **inclusive Memória**, e **qualquer um dos dois** pode fazê-lo sozinho (confiança no casal).
- Não existe estado "Cancelado".
- Se o casal só não quer fazer agora, a experiência **volta para Desejo**.
- Memória não é uma forma de cancelamento.

## Consequências
- A experiência e o que é dela (registros, fotos) deixam de existir. Como remover as fotos do Storage está em aberto ([open-questions.md](../product/open-questions.md) T4).
- Não há recuperação: a confirmação precisa deixar o efeito claro.
