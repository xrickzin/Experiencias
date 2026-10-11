# Laço — Definição de produto

Ponto de entrada do produto. Resume o essencial e aponta para o documento que contém cada detalhe.
`docs/product/` é a **fonte de verdade** das regras de produto.

## O que é

**Laço** é um aplicativo mobile privado para **casais** planejarem, viverem e preservarem experiências compartilhadas ao longo do tempo.

> Laço representa o vínculo entre duas pessoas e tudo aquilo que elas constroem e vivem juntas.

Dá ao casal um único lugar para desejar, planejar, viver e guardar o que fazem juntos. Não é um aplicativo de viagens, de tarefas, um Kanban, uma rede social, um diário genérico, um aplicativo de relacionamento nem uma galeria de fotos. Detalhes em [vision.md](./vision.md).

## Conceito central

A **experiência** é a entidade central: qualquer coisa que o casal queira viver junto, de qualquer tamanho. Os estados não são entidades diferentes; a mesma experiência evolui.

> **Desejo → Planejamento → Vivendo → Memória**

**Nossa História** não é um estado: é a área que apresenta as memórias como a história construída pelo casal.

## Ciclo em uma frase por estado

- **Desejo** — algo que o casal gostaria de viver.
- **Planejamento** — o casal decidiu tentar fazer acontecer.
- **Vivendo** — está acontecendo.
- **Memória** — terminou e faz parte da história do casal. **Estado final.**

Transições, reversibilidade, criação e cancelamento: [lifecycle.md](./lifecycle.md).

## Áreas do aplicativo

**Início**, **Desejos** e **Nossa História**. Planejamento e Vivendo não são áreas: são contextos da experiência. Entrada do casal ("Criar Laço" / "Vincular ao Laço"): [navigation.md](./navigation.md).

## Regras fundamentais

1. Só o título é essencial para uma experiência existir; tudo o mais é opcional e progressivo.
2. Sem hierarquia obrigatória de subexperiências.
3. Reversível: Desejo ⇄ Planejamento ⇄ Vivendo. **Memória é final.** Voltar nunca apaga registros.
4. Só se cria **Desejo** ou **Memória** (esta exige título e referência temporal). Nunca Planejamento nem Vivendo diretamente.
5. Data é opcional, exceto para virar Memória. Automação só com informação clara e nunca disputa a decisão do casal: [dates-and-automation.md](./dates-and-automation.md).
6. A experiência pertence aos dois; registros têm autor; impressão e momento favorito são individuais; uma impressão só é vista depois de registrar a própria: [permissions.md](./permissions.md).
7. Cancelar é definitivo, com confirmação, em qualquer estado, por qualquer um dos dois. Não existe estado "Cancelado": [lifecycle.md](./lifecycle.md#cancelamento).
8. Memória preserva o contexto e continua editável: [memory.md](./memory.md).
9. Impressão e momento favorito (uma foto) de cada pessoa só são vistos pelo outro depois de ele ter registrado a própria impressão.
10. O MVP é online-only e mobile (sem web).

## Escopo atual

O que está dentro e fora do MVP: [mvp.md](./mvp.md). Ideias futuras (não são requisitos): [future.md](./future.md). O que ainda não foi decidido: [open-questions.md](./open-questions.md).

## Terminologia oficial

| Termo | Uso |
|---|---|
| **Laço** | O produto e também o espaço compartilhado do casal ("Criar Laço", "Vincular ao Laço"). |
| **casal** | As duas pessoas. |
| **experiência** | A entidade central. |
| **Desejo, Planejamento, Vivendo, Memória** | Os estados (com inicial maiúscula). |
| **Nossa História** | A área que apresenta as memórias. |
| **registro** | Informação acumulada durante uma experiência (MVP: foto ou observação). |
| **impressão pessoal** | A reflexão individual de cada pessoa. |
| **momento favorito** | A escolha individual de cada pessoa. |
| **referência temporal** | A informação de "quando", com precisão variável. |

Evitar: dupla, usuários, participantes, jornada, projeto, tarefa, card, item, conceitos de Kanban. "Experiências Compartilhadas" não é mais o nome do produto.

## Mapa dos documentos

| Tema | Documento |
|---|---|
| Visão, identidade, princípios | [vision.md](./vision.md) |
| Estados, transições, criação, cancelamento | [lifecycle.md](./lifecycle.md) |
| Datas e automação | [dates-and-automation.md](./dates-and-automation.md) |
| Permissões e privacidade | [permissions.md](./permissions.md) |
| Memória, registros, Nossa História | [memory.md](./memory.md) |
| Áreas e entrada | [navigation.md](./navigation.md) |
| Escopo | [mvp.md](./mvp.md) · [future.md](./future.md) |
| Pendências | [open-questions.md](./open-questions.md) |
| Porquê das decisões | [../decisions/README.md](../decisions/README.md) |
| Arquitetura | [../architecture/overview.md](../architecture/overview.md) |
| Como implementar | [../development/implementation-guidelines.md](../development/implementation-guidelines.md) |
| UX (direção definida; telas não implementadas) | [../ux/README.md](../ux/README.md) |

## Rótulos usados na documentação

**Decisão** (definido, orienta a implementação) · **Regra** (comportamento que o sistema precisa respeitar) · **Possibilidade futura** (não é requisito) · **Em aberto** (precisa de decisão).
