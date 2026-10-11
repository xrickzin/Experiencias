# Arquitetura — visão geral

Como o software será estruturado para suportar o produto. Regras de produto: [../product/product-definition.md](../product/product-definition.md). Não introduzir complexidade arquitetural sem necessidade concreta.

## Stack

React Native · Expo · TypeScript · Expo Router · Supabase · PostgreSQL · Supabase Storage · Git/GitHub.

Regras específicas do Expo (instalação de pacotes, rotas, builds): [../../app/AGENTS.md](../../app/AGENTS.md).

## Camadas

```text
UI
↓
hooks / lógica de apresentação
↓
regras de negócio / serviços
↓
Supabase
↓
PostgreSQL / Storage
```

- **UI** não fala direto com o Supabase.
- **Hooks** ligam a interface ao estado e à chamada de serviços.
- **Regras de negócio / serviços** concentram as regras de [../product/](../product/product-definition.md) (transições permitidas, Memória final, referência temporal obrigatória…). Cada regra existe em um só lugar.
- Regras de segurança **não dependem só dessas camadas**: ficam também no backend ([security.md](./security.md)).
- Não criar abstrações antecipadas: uma camada só ganha estrutura própria quando há reutilização ou regra real.

## Princípios

- Todo dado compartilhado pertence a um Laço ([data-model.md](./data-model.md)).
- O MVP é **online-only**: sem armazenamento local de dados do casal, sem fila de sincronização ([ADR 009](../decisions/009-mvp-scope-and-offline.md)).
- Registros explícitos e tipados ([ADR 010](../decisions/010-explicit-typed-records.md)).
- Dependências novas só com necessidade clara; preferir módulos do Expo.

## Estado atual do aplicativo

`app/` ainda é o template padrão do Expo (SDK 57), com telas de demonstração. Nenhuma funcionalidade do Laço foi implementada. Pendências técnicas: [technical-decisions.md](./technical-decisions.md).

## Documentos

[data-model.md](./data-model.md) · [security.md](./security.md) · [technical-decisions.md](./technical-decisions.md)
