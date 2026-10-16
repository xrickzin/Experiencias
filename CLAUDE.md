# Laço

## Projeto

**Laço** é um aplicativo mobile privado para **casais** planejarem, viverem e preservarem experiências compartilhadas.

Ciclo da experiência (entidade central): **Desejo → Planejamento → Vivendo → Memória**. **Nossa História** é a área que apresenta as memórias; não é um estado.

Não é aplicativo de viagens, gerenciador de tarefas, Kanban, rede social, diário genérico nem simples galeria de fotos. Viagens são só um tipo de experiência.

## Estado atual

Documentação de produto, decisões e arquitetura consolidadas. O aplicativo em `app/` partiu do template do Expo (demonstração removida na Fase 0) e hoje tem conta, Laço, desejos, planejamento e fotos no Supabase (Fases 1 a 4). A direção de UX está definida em `docs/ux/` e suas divergências com o produto foram resolvidas (ADR 022); a direção visual foi aprovada com pendências (ADR 026; proposta em `docs/ux/proposal/`) e a Fase 0 **não está concluída**: as etapas E0 a E6, E8 (configuração web removida), E10 (fontes Fraunces e Figtree), E11 (nome `Laço`, `slug`/`scheme` `laco`, id `com.xrickzin.laco`) e E13 (ESLint) foram executadas, com lint limpo (0 erros e 0 avisos) nos 7 arquivos de `src/` (`docs/development/phase-0-log.md`); **E7 foi executada (`expo-glass-effect` fora das dependências diretas, ainda instalado pelo `expo-router`), E12 foi concluída (`expo-device` e `expo-web-browser` removidos; `react-native-web` e `react-dom` mantidos, pois o `expo-router` os exige) e E9 não foi executada e aguarda a arte do ícone e da abertura** (plano em `docs/development/phase-0-plan.md`). A Fase 1 (onboarding, autenticação, vínculo, recuperação de senha) foi validada no Expo Go (`docs/development/phase-1-log.md`). A Fase 2 (desejos reais no Supabase: criar, listar, editar e excluir) está concluída: migração aplicada no projeto real e validada no app pelo usuário, com 83 testes automáticos (`docs/development/phase-2-log.md`). As Fases 3 (Planejamento, referência temporal, transições e Início) e 4 (fotos em Storage privado, abas, agrupamento por dia e período, foto de destaque no Início) estão concluídas: migrações aplicadas no projeto real e validadas no celular pelo usuário (`docs/development/phase-3-log.md`, `docs/development/phase-4-log.md`). A Fase 5 (Memória: finalizar, registrar memória, impressões e momento favorito com privacidade no banco, observações do momento e legendas nas fotos na aba Momentos, `+` com as duas opções) está concluída: migrações aplicadas no projeto real e validadas no celular pelo usuário (`docs/development/phase-5-log.md`). A Fase 6 (Nossa História: agrupamento por mês de início, foto de destaque, memórias só com mês/ano no fim do mês, ADR 031) está concluída e validada no celular pelo usuário (`docs/development/phase-6-log.md`). A Fase 7 (automação do início: `pg_cron` a cada minuto passa Planejamento → Vivendo no fuso do Laço, com o anti-loop de `armado_em`) está concluída: migração aplicada no projeto real e validada no celular pelo usuário (`docs/development/phase-7-log.md`). Todas as fases de produto do roadmap (1 a 7) estão concluídas; restam as pendências da Fase 0. A primeira revisão de design (cabeçalho com o título da experiência, voltar no topo, ícones próprios com `react-native-svg` e barra de abas com o fio que viaja entre os laços de cada ícone) foi aprovada pelo usuário (`docs/development/design-review-1.md`). Depois da Fase 0 técnica foi implementada a **casca visual integrada** (navegação com `+` central, Início, Desejos, Nossa História; `docs/development/visual-shell.md`). As validações em aparelho foram feitas pelo usuário no Expo Go, num celular Android. Não executar etapas além das autorizadas nem implementar telas além das já entregues.

---

## Documentação

`docs/product/` é a **fonte de verdade das regras de produto**. Ler apenas o que a tarefa exige, nunca a pasta inteira. Ponto de entrada: [product-definition.md](docs/product/product-definition.md).

| Preciso de… | Consultar |
|---|---|
| Visão geral, terminologia, mapa dos documentos | [docs/product/product-definition.md](docs/product/product-definition.md) |
| Identidade, princípios, o que o produto não é | [docs/product/vision.md](docs/product/vision.md) |
| Estados, transições, criação, cancelamento | [docs/product/lifecycle.md](docs/product/lifecycle.md) |
| Datas e automação | [docs/product/dates-and-automation.md](docs/product/dates-and-automation.md) |
| Permissões, privacidade das impressões | [docs/product/permissions.md](docs/product/permissions.md) |
| Memória, registros, Nossa História | [docs/product/memory.md](docs/product/memory.md) |
| Áreas do app e entrada (Criar/Vincular Laço) | [docs/product/navigation.md](docs/product/navigation.md) |
| O que entra no MVP / ideias futuras | [docs/product/mvp.md](docs/product/mvp.md) · [docs/product/future.md](docs/product/future.md) |
| O que ainda não foi decidido | [docs/product/open-questions.md](docs/product/open-questions.md) |
| Por que algo foi decidido | [docs/decisions/](docs/decisions/README.md) |
| Camadas, modelo de dados, segurança, decisões técnicas | [docs/architecture/](docs/architecture/overview.md) |
| Como implementar, convenções, roadmap | [docs/development/](docs/development/implementation-guidelines.md) |
| Direção de UX e de design (telas ainda não implementadas) | [docs/ux/README.md](docs/ux/README.md) · [docs/ux/design-direction.md](docs/ux/design-direction.md) · [docs/ux/proposal/](docs/ux/proposal/visual-direction.md) · pendências: [docs/ux/open-questions-ux.md](docs/ux/open-questions-ux.md) |
| Regras de Expo / React Native | [app/AGENTS.md](app/AGENTS.md) |

> Antes de implementar uma funcionalidade de produto, consulte a documentação correspondente em `docs/product/` e as decisões relevantes em `docs/decisions/`.

> Não assumir comportamento de produto que não esteja definido. Quando uma decisão estiver aberta e impactar o comportamento, parar e apresentar alternativas antes de implementar.

**O que não está escrito não deve ser implementado.** Ideias em `future.md` ou em outros documentos conceituais não são requisitos; só o que está em `mvp.md` faz parte do escopo atual.

Quando uma decisão de produto for consolidada: registrar em `docs/decisions/`, atualizar o documento de produto e remover a pendência de `open-questions.md`.

---

## Stack

React Native · Expo · TypeScript · Expo Router · Supabase · PostgreSQL · Supabase Storage · Git/GitHub

Camadas: UI → hooks / lógica de apresentação → regras de negócio / serviços → Supabase → PostgreSQL / Storage. Detalhes em [docs/architecture/overview.md](docs/architecture/overview.md).

---

## Princípios

* Priorizar simplicidade; evitar overengineering; aplicar YAGNI.
* Não implementar funcionalidades futuras, nem adicionar funcionalidades sem necessidade identificada.
* Preferir soluções nativas e simples; não instalar dependências sem necessidade clara.
* Reutilizar o que já existe no projeto antes de criar algo novo; não criar abstrações antecipadamente.
* Criar componentes reutilizáveis só quando houver reutilização real.
* Manter separação clara entre UI, regras de negócio e serviços.
* Não alterar arquitetura sem justificar; não substituir código existente sem entender sua finalidade.

---

## Desenvolvimento orientado a etapas

Antes de implementar:

1. Entender o requisito e conferir a documentação (seção acima).
2. Identificar arquivos e dependências relevantes e impactos na arquitetura.
3. Propor abordagem quando houver decisão relevante.
4. Implementar a menor solução adequada.
5. Executar validações e corrigir problemas.
6. Atualizar a documentação quando necessário.

Detalhes em [docs/development/implementation-guidelines.md](docs/development/implementation-guidelines.md).

---

## Uso eficiente de contexto

* Não ler arquivos irrelevantes para a tarefa; identificar os necessários antes de abrir.
* Preferir alterações pequenas e focadas; evitar mexer em vários arquivos quando uma alteração localizada resolver.
* Não repetir conteúdo já conhecido; não gerar código especulativo nem documentação extensa para mudanças triviais.
* Tarefas simples: resposta objetiva. Tarefas complexas com decisão arquitetural: apresentar a estratégia primeiro.

---

## Qualidade

Uma tarefa não está concluída só porque o código compila. Verificar, quando aplicável: TypeScript, lint, testes existentes, comportamento esperado, estados de erro, vazios e de carregamento, acessibilidade, diferentes tamanhos de tela e efeitos colaterais.

Quando uma validação não puder ser executada, informar explicitamente.

---

## Git

* Commits pequenos e relacionados a uma mudança específica; sem commits gigantes com funcionalidades não relacionadas.
* Não criar commits automaticamente sem solicitação explícita.
* Não alterar o histórico sem autorização explícita.

---

## Decisões indefinidas

Se uma decisão de produto estiver indefinida:

1. explicar brevemente o problema;
2. apresentar alternativas relevantes;
3. indicar os impactos de cada alternativa;
4. perguntar antes de assumir uma solução.

Se uma decisão técnica estiver indefinida, evitar escolher solução complexa apenas por preferência técnica.

---

## Comunicação

* Determinar exatamente o que precisa ser alterado; não fazer alterações não relacionadas.
* Informar quais arquivos pretende alterar quando a mudança for relevante.
* Depois da implementação, informar o que foi alterado e quais validações foram executadas.
* Problema fora do escopo: informar sem corrigir automaticamente, salvo se impedir a tarefa atual.
* Priorizar clareza sobre quantidade de texto.
