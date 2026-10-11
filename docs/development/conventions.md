# Convenções

Apenas o que já está definido. O resto fica em aberto até haver necessidade.

## Documentação
- Em português do Brasil. Terminologia oficial: [../product/product-definition.md](../product/product-definition.md#terminologia-oficial).
- Cada tipo de informação tem **um** documento: regras em `docs/product/`, porquês em `docs/decisions/`, estrutura técnica em `docs/architecture/`, forma de trabalhar em `docs/development/`.
- Links relativos entre documentos. Em vez de repetir, linkar.
- Usar os rótulos **Decisão · Regra · Possibilidade futura · Em aberto**.
- Decisão nova: criar `docs/decisions/NNN-assunto.md` e atualizar o índice. Questão decidida sai de `open-questions.md`.
- Atualizar a documentação quando uma decisão de produto for consolidada.

## Código
- Rotas em `src/app/`; código que não é rota (componentes, hooks, utilitários) fora dele ([../../app/AGENTS.md](../../app/AGENTS.md)).
- Importar de `src/` com o alias `@/` (configurado em `tsconfig.json`).
- Instalar pacotes com `npx expo install`, para resolver versões compatíveis com o SDK.
- Nomes da interface em português do Brasil, com a terminologia oficial.
- Identificadores: termos de **domínio em português sem acentos** (`laco`, `experiencia`, `desejo`, `planejamento`, `vivendo`, `memoria`, `registro`, `impressao`, `momento_favorito`) e termos **técnicos em inglês**; banco em `snake_case` ([ADR 021](../decisions/021-naming-and-identifiers.md)).
- Nome técnico: `slug` e `scheme` `laco`; migrações do banco versionadas no repositório (Supabase CLI), sem alterações manuais no painel.

## Git
Regras em [../../CLAUDE.md](../../CLAUDE.md#git): commits pequenos e focados, sem commit automático, sem reescrever o histórico.
