# Registro de decisões

Registro curto do **porquê** das decisões importantes, para evitar regressões de produto. As **regras** vivem em [../product/](../product/product-definition.md) e [../architecture/](../architecture/overview.md); aqui fica o contexto.

## Modelo de cada registro

`NNN-assunto.md` com: **Status** · **Contexto** · **Decisão** · **Consequências** · **Alternativas consideradas** (quando houver).

Status: *Aceita* · *Substituída por NNN*. Uma decisão aceita só muda por um novo registro que a substitua; nunca se reescreve o histórico.

## Índice

| # | Decisão | Regra em |
|---|---|---|
| [001](./001-product-identity.md) | Identidade do produto: Laço | [vision.md](../product/vision.md) |
| [002](./002-experience-lifecycle.md) | Ciclo de vida, transições e Memória final | [lifecycle.md](../product/lifecycle.md) |
| [003](./003-experience-permissions.md) | Permissões da experiência | [permissions.md](../product/permissions.md) |
| [004](./004-dates-and-automation.md) | Datas e automação | [dates-and-automation.md](../product/dates-and-automation.md) |
| [005](./005-memory-and-impressions.md) | Memória e impressões | [memory.md](../product/memory.md) |
| [006](./006-cancellation.md) | Cancelamento | [lifecycle.md](../product/lifecycle.md#cancelamento) |
| [007](./007-navigation.md) | Navegação em três áreas | [navigation.md](../product/navigation.md) |
| [008](./008-direct-memory-creation.md) | Criação direta de Memória | [lifecycle.md](../product/lifecycle.md#criação) |
| [009](./009-mvp-scope-and-offline.md) | Escopo do MVP e online-only | [mvp.md](../product/mvp.md) |
| [010](./010-explicit-typed-records.md) | Registros explícitos e tipados | [memory.md](../product/memory.md#registros) |
| [011](./011-couple-linking.md) | Vínculo do casal por palavra-chave | [navigation.md](../product/navigation.md) |
| [012](./012-favorite-moment-and-cover-photo.md) | Momento favorito e foto de destaque | [memory.md](../product/memory.md#momento-favorito) |
| [013](./013-records-in-planning.md) | Registros desde o Planejamento | [memory.md](../product/memory.md#registros) |
| [014](./014-home-and-location.md) | Início e localização | [navigation.md](../product/navigation.md#início) |
| [015](./015-identity-and-session.md) | Identidade (Supabase Auth, e-mail + senha), sessão e um Laço por identidade | [navigation.md](../product/navigation.md#entrada-criar-ou-vincular-o-laço) |
| [016](./016-keyword-abuse-protection.md) | Palavra-chave e proteção contra tentativas abusivas (substitui parte do 011) | [navigation.md](../product/navigation.md#entrada-criar-ou-vincular-o-laço) |
| [017](./017-account-and-session-details.md) | Detalhes de conta e sessão | [technical-decisions.md](../architecture/technical-decisions.md) |
| [018](./018-keyword-protection-implementation.md) | Palavra-chave: limite de tentativas e armazenamento | [security.md](../architecture/security.md#palavra-chave-do-vínculo) |
| [019](./019-automation-implementation.md) | Automação do início: execução, fuso e anti-loop | [dates-and-automation.md](../product/dates-and-automation.md) |
| [020](./020-photos-and-deletion.md) | Fotos: ponteiros e exclusão | [memory.md](../product/memory.md#foto-excluída) |
| [021](./021-naming-and-identifiers.md) | Nome técnico e idioma dos identificadores | [conventions.md](../development/conventions.md) |
| [022](./022-entry-flow-and-solo-use.md) | Fluxo de entrada, uso com um membro e configurações | [navigation.md](../product/navigation.md#entrada-criar-ou-vincular-o-laço) |
| [023](./023-keyword-check-before-account.md) | Verificação da palavra-chave antes da conta | [security.md](../architecture/security.md#palavra-chave-do-vínculo) |
| [024](./024-email-first-entry.md) | Entrada pelo e-mail (ajusta 022 e 023) | [navigation.md](../product/navigation.md#entrada-criar-ou-vincular-o-laço) |
| [025](./025-wish-optional-fields.md) | Informações opcionais de um Desejo | [lifecycle.md](../product/lifecycle.md) |
| [026](./026-visual-direction-and-platforms.md) | Direção visual, plataformas e elementos gráficos | [ux/proposal/](../ux/proposal/visual-direction.md) |
| [027](./027-home-limits-and-past-planning.md) | Limites do Início e Planejamento com data passada | [navigation.md](../product/navigation.md#início) |

Pendências ainda sem decisão: [../product/open-questions.md](../product/open-questions.md).
