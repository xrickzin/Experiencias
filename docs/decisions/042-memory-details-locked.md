# 042 — Detalhes travados na memória

**Status:** Aceita (escolha do usuário, 2026-10-31). Ajusta [memory.md](../product/memory.md#memória), que dizia que o conteúdo da memória continuava todo editável.

## Decisão
- Quando a experiência vira **Memória**, os **detalhes** deixam de ser editáveis, para os dois:
  - título, referência temporal, local, observações gerais, categorias e duração;
  - links, reservas, roteiro e orçamento (ligar, desligar, criar, editar ou excluir).
- Continua livre tudo o que é **registro** ou é pessoal:
  - adicionar e excluir fotos, legendas, a data da foto e as observações do momento;
  - a foto de destaque;
  - a impressão e o momento favorito de cada pessoa.
- Os detalhes continuam **visíveis**, só para leitura, na guia Detalhes. As guias Roteiro e Orçamento aparecem só quando já têm conteúdo (ADR 040 e 041), também só para leitura.
- **Excluir a memória** continua possível. É a saída para um detalhe errado.

## Por quê
O que foi vivido não se reescreve: a memória preserva o contexto como estava ao terminar. Já o que se acrescenta depois (fotos, legendas, impressões) faz parte de revisitar a memória.

## Consequências
- Migração `20261031120000_memoria_detalhes_travados.sql`:
  - um trigger em `experiencias` recusa mudança dos detalhes quando a linha já está em `memoria` (`memoria_travada`);
  - as políticas de criar, editar e excluir de `links`, `reservas`, `roteiro` e `roteiro_links` passam a exigir uma experiência fora de `memoria`. A exclusão da memória ainda apaga tudo em cascata, porque as exclusões em cascata não passam pelo RLS.
- **Categorias** ficam travadas só no app: uma memória criada direto grava as categorias logo depois de existir ([ADR 008](./008-direct-memory-creation.md)). Travá-las no banco exigiria criar a memória e as categorias numa só RPC.
- Suíte do banco: `supabase/tests/memoria.mjs`.
