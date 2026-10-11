# UX — Direção do produto Laço

> **Status:** direção de UX definida e divergências com o produto resolvidas; **nenhuma tela ou componente implementado**. **Proposta de Visual Direction e Design System pronta para avaliação**, ainda não aprovada: [proposal/](./proposal/visual-direction.md). Sequência: [design-direction.md](./design-direction.md#13-próxima-entrega). Este conjunto de documentos orienta a evolução da experiência sem transformar decisões de UX em implementação prematura.

## Precedência

1. Regras de produto ([../product/](../product/product-definition.md)) e decisões ([../decisions/](../decisions/README.md)) **prevalecem** sobre este documento.
2. Quando a UX diverge delas, **sinalizar a divergência em vez de assumir uma nova regra**. As divergências levantadas na análise inicial foram resolvidas ([ADR 022](../decisions/022-entry-flow-and-solo-use.md)); as pendências estão em [open-questions-ux.md](./open-questions-ux.md).
3. A hierarquia completa de decisão (produto → UX → direção visual → Design System → skills) está em [design-direction.md](./design-direction.md#1-princípio-fundamental).
4. Os textos de interface são direção de UX; a redação final pode ser ajustada sem alterar a regra de produto.

## Antes de implementar qualquer tela ou componente

- respeitar as decisões de produto já existentes no projeto;
- não criar funcionalidades que não estejam descritas ou aprovadas;
- não transformar o aplicativo em gerenciador de tarefas, rede social ou aplicativo de viagens;
- não introduzir complexidade apenas porque tecnicamente seria possível;
- preservar a identidade visual e conceitual descrita aqui.

A implementação deve privilegiar simplicidade, clareza e coerência com o conceito do produto.

## Mapa

| Tema | Documento |
|---|---|
| Conceito, linguagem, princípios de UX | [principles.md](./principles.md) |
| Identidade visual: fotografia, fio vermelho e laço, escopo visual | [visual-identity.md](./visual-identity.md) |
| Primeira tela, criar Laço, autenticação, entrar, sessão | [onboarding.md](./onboarding.md) |
| Navegação, botão `+`, Início | [home-and-navigation.md](./home-and-navigation.md) |
| Desejos, transição para Planejamento, Planejamento | [wishes-and-planning.md](./wishes-and-planning.md) |
| Vivendo, finalizar, memória, fotos, favorito, impressões, registros | [living-and-memory.md](./living-and-memory.md) |
| Nossa História | [our-story.md](./our-story.md) |
| Skills de design, hierarquia de decisão, Design System e processo visual | [design-direction.md](./design-direction.md) |
| Avaliação das skills e ferramentas de design | [design-tools.md](./design-tools.md) |
| **Proposta (não aprovada):** direção visual, motion e acessibilidade, telas, Design System, prévia | [proposal/visual-direction.md](./proposal/visual-direction.md) · [motion-and-accessibility.md](./proposal/motion-and-accessibility.md) · [screens.md](./proposal/screens.md) · [design-system.md](./proposal/design-system.md) · [technical-feasibility.md](./proposal/technical-feasibility.md) · [preview.html](./proposal/preview.html) |
| Divergências, lacunas e questões de UX | [open-questions-ux.md](./open-questions-ux.md) |

## Diretriz para implementação

1. Não alterar regras de produto já definidas em outros documentos.
2. Não inventar campos obrigatórios.
3. Não criar novas entidades apenas para representar estados.
4. Não introduzir telas adicionais sem necessidade.
5. Não transformar a experiência em formulário.
6. Não usar linguagem de Kanban ou gerenciamento de tarefas.
7. Não usar o vermelho como cor dominante da interface.
8. Não usar o laço como decoração repetitiva.
9. Não criar funcionalidades fora do MVP apenas para completar a interface.
10. Priorizar a experiência em dispositivos móveis.
11. Componentes reutilizáveis **só quando houver reutilização real**, como no [CLAUDE.md](../../CLAUDE.md): sem abstrações prematuras; priorizar clareza, simplicidade e manutenção.
12. Separar apresentação, lógica de negócio e serviços conforme [a arquitetura](../architecture/overview.md).
13. Antes de implementar uma decisão que contradiga este material ou os ADRs existentes, sinalizar a divergência.

## Regra geral de ouro

A experiência deve sempre responder:

> **Isso ajuda o casal a viver, planejar ou lembrar algo juntos?**

Se a resposta for não, questionar se a funcionalidade realmente pertence ao produto.

## Insumos herdados da etapa anterior

- Vivendo deve responder a "o que está acontecendo agora?" e não ser uma versão reduzida da tela de planejamento.
- Memória e Nossa História devem dar a sensação de revisitar um momento, não de ler um relatório.
- A criação de um desejo não pode parecer um formulário.
- Acessibilidade e diferentes tamanhos de tela fazem parte da qualidade (ver [../../CLAUDE.md](../../CLAUDE.md)).
- Mensagens de erro e de bloqueio (palavra-chave em uso, excesso de tentativas, palavra não encontrada) são exemplos; a redação final é da UX.

## Fora desta etapa

Wireframes, telas finais, design system definitivo (paleta, tipografia), especificação de animações e implementação de componentes. Ver [open-questions-ux.md](./open-questions-ux.md).
