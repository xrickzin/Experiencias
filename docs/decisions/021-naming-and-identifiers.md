# 021 — Nome técnico e idioma dos identificadores

**Status:** Aceita. Decisão técnica delegada pelo produto. O identificador do aplicativo (`com.xrickzin.laco`) constava como sugestão pendente de confirmação ([026](./026-visual-direction-and-platforms.md)); ver a nota de estado ao final. Reversível apenas até a primeira publicação em loja.

## Contexto
O template usa `app` como `name`, `slug` e `scheme`. "Laço" tem cedilha e a documentação já fixa a terminologia oficial em português.

## Decisão
- **Nome exibido:** `Laço`. **`slug` e `scheme`:** `laco`.
- **Identificador do aplicativo (iOS e Android):** `com.xrickzin.laco`, a partir do usuário do GitHub do projeto; trocar antes de publicar se houver domínio próprio.
- **Idioma dos identificadores:** termos de **domínio em português sem acentos**, os da terminologia oficial (`laco`, `experiencia`, `desejo`, `planejamento`, `vivendo`, `memoria`, `registro`, `impressao`, `momento_favorito`); termos **técnicos em inglês** (hooks, serviços, `get`, `create`). Banco em `snake_case`; valores de estado `desejo`, `planejamento`, `vivendo`, `memoria`. Interface em pt-BR.
- Migrações do banco versionadas no repositório (Supabase CLI), em vez de alterações manuais no painel.

## Consequências
- O código fala a mesma língua da documentação, sem tabela de tradução.
- A mistura de idiomas é regra, não acidente: domínio em português, técnica em inglês.

## Alternativas consideradas
- Tudo em inglês: descartada, exigiria traduzir a terminologia oficial (Laço, Vivendo, Memória).

## Nota de estado (posterior; não altera a decisão)
O texto acima registra o estado no momento da decisão. Depois dele, na Fase 0 ([phase-0-log.md](../development/phase-0-log.md)): o usuário **confirmou explicitamente** o identificador `com.xrickzin.laco`, aplicado em `android.package` e `ios.bundleIdentifier` do `app.json`; na segunda execução da **E11**, `name` passou a `Laço` e `slug` e `scheme` a `laco`. Ainda sem build nativo nem validação em aparelho. A regra "trocar antes de publicar se houver domínio próprio" continua valendo.
