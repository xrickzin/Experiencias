# 005 — Memória e impressões

**Status:** Aceita

## Contexto
A versão anterior dizia que as impressões ficavam visíveis quando ambos "registraram ou optaram por deixar para depois". Isso deixava quem adiava ver a impressão do outro antes de escrever a sua, anulando o objetivo (espontaneidade).

## Decisão
- A memória não é entidade separada: é a experiência no estado final, com o contexto acumulado, e seu conteúdo continua editável.
- Cada pessoa tem **impressão pessoal** e **momento favorito** próprios, sem ranking.
- Uma pessoa só vê a impressão (e o favorito, [ADR 012](./012-favorite-moment-and-cover-photo.md)) da outra **depois de registrar a própria**. "Registrada" = texto não vazio.
- A pessoa pode criar, editar, apagar e reescrever a própria impressão. Apagar não afeta a do outro; a visibilidade é decidida na leitura.
- "Escrever depois" não bloqueia a memória; a regra é individual.
- A regra **não pode depender só da interface**: também no backend (RLS).

## Consequências
- Quem nunca escrever nunca verá a impressão do outro (aceito). Quem apaga a própria deixa de ver a do outro; o que já viu não é desfeito.
- A leitura depende da existência da impressão própria ([security.md](../architecture/security.md)).

## Alternativas consideradas
- Impressões sempre visíveis ao serem escritas: mais simples, mas perde a espontaneidade que motivou a regra.
