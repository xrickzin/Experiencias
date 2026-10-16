# Questões em aberto de UX

Só o que **ainda** não está decidido. As divergências com o produto (UX-C1 a UX-C10) e as lacunas de fluxo (UX-F1 a UX-F16) foram respondidas pelo usuário e estão documentadas; ver "Resolvidas" abaixo.

Regra: até a decisão, prevalecem [docs/product/](../product/product-definition.md) e [docs/decisions/](../decisions/README.md); não assumir. Quando um item for decidido, registrar em `docs/decisions/` se alterar produto ou arquitetura, atualizar o documento de UX e removê-lo daqui.

## A. Pendências de fluxo

Nenhuma. UX-F17 (entrada pelo e-mail) e UX-F18 (informações de um Desejo) foram decididas: [ADR 024](../decisions/024-email-first-entry.md) e [025](../decisions/025-wish-optional-fields.md).

## B. Questões visuais (delegadas às skills de design)

**Direção aprovada ([ADR 026](../decisions/026-visual-direction-and-platforms.md)); valores finais pendentes.** Resolvidas e removidas daqui: UX-V3 (MVP só com tema claro), UX-V10 (limites do Início) e UX-V14 (destino de "Ver todos" e "Ver planejamentos"), pelo [ADR 027](../decisions/027-home-limits-and-past-planning.md). Dentro das restrições de [design-direction.md](./design-direction.md#12-questões-visuais-delegadas-às-skills); não decidem produto.

| ID | Questão |
|---|---|
| UX-V1 | Paleta exata (vermelho e neutros) e contraste do vermelho em texto e ícones. |
| UX-V2 | Tipografia editorial: fonte, licença, carregamento. |
| UX-V4 | Fio animado: o Reanimated já está instalado, mas desenhar um caminho (SVG) pode exigir dependência nova; preferir módulo do Expo e justificar. Respeitar "reduzir movimento" e 300–500 ms. |
| UX-V5 | Ícones: 📍 emoji ou ícone próprio. |
| UX-V6 | Estados de carregando, erro, vazio e **sem conexão** ([ADR 009](../decisions/009-mvp-scope-and-offline.md); [CLAUDE.md](../../CLAUDE.md)). |
| UX-V7 | Acessibilidade visual (tamanho de fonte, leitor de tela, alvos de toque) e telas pequenas. |
| UX-V8 | Tratamento visual do e-mail, sem confirmação de e-mail (o [ADR 017](../decisions/017-account-and-session-details.md) prevê dupla digitação opcional). |
| UX-V9 | Ponto de entrada visual para as configurações da conta (editar nome, sair da conta), sem nova área principal. |
| UX-V12 | Interação do seletor de precisão da referência temporal (mês/ano, data, data + horário, período). |
| UX-V15 | Cores semânticas (marca, interação, aviso, erro, destrutivo): valores implementados em `theme.ts` na E6 como primeira versão, ainda sujeitos à avaliação visual da proximidade carmim / ferrugem / âmbar ([visual-direction.md](./proposal/visual-direction.md#semântica-das-cores-valores-pendentes-de-verificação)). |
| UX-V13 | Redação final dos textos de interface ("código do casal", mensagens, nomes das ações de transição). |

## C. Design e skills

Origem: [design-direction.md](./design-direction.md). Avaliação: [design-tools.md](./design-tools.md).

| ID | Questão | Situação |
|---|---|---|
| UX-D1 | **Quais skills instalar.** Nenhuma está instalada. | **Investigado.** Recomendado no máximo o `frontend-design` (oficial); aguarda sua autorização. Terceiros não recomendados por ora |
| UX-D2 | **Referência concreta de motion.** | **Investigado.** Repositório do Emil Kowalski (terceiros) é a candidata; ler antes de decidir instalar; princípios já resumidos na proposta |
| UX-D3 | **Onde fica o Design System.** | **Proposto:** valores só em `src/constants/theme.ts` ([design-system.md](./proposal/design-system.md)); aguarda aprovação |
| UX-D4 | **Proposta visual no roadmap.** | Proposta pronta; as telas da Fase 1 dependem da aprovação ([roadmap](../development/roadmap.md)) |
| UX-D5 | **Dependências do template × anti-padrões.** | **Avaliado:** `expo-glass-effect` é candidata a remoção (aguarda aprovação); `@expo/ui` mantido por ora, pendente de teste em aparelho; `react-native-svg` recomendada, aguarda aprovação ([design-system.md](./proposal/design-system.md#7-dependências-do-template), [technical-feasibility.md](./proposal/technical-feasibility.md)). Nada foi alterado |

## D. Contradições e lacunas registradas na revisão da proposta

Nada abaixo foi resolvido em silêncio; cada item diz o impacto.

| # | Contradição ou lacuna | Impacto | Situação |
|---|---|---|---|
| R1 | **"Desejos relevantes ou recentes" em Início** (pedido de revisão) × decisão aprovada de que Início mostra Desejos só como **atalho** com contagem ([ADR 014](../decisions/014-home-and-location.md), UX-F13) | Listar desejos exige definir "relevante" (hoje vetado: sem pontuação) e rever o ADR 014 | **Resolvida:** Desejos é só atalho com contagem ([ADR 027](../decisions/027-home-limits-and-past-planning.md)) |
| R2 | **Planejamento com data já passada e não iniciado**: o ADR 014 só ordena Planejamento com data **futura** e **sem data** | Esse item não tem lugar definido em Início; pode desaparecer ou cair no grupo errado | **Resolvida em parte:** continua em Planejamento, sem alerta ([ADR 027](../decisions/027-home-limits-and-past-planning.md)). **Sem regra:** se aparece entre os três de Planejamento de Início |
| R3 | **Destino de "Ver todos" / "Ver planejamentos"** (UX-V14) | Sem uma tela de lista, o teto por bloco esconde itens | **Resolvida:** telas secundárias de Início ([ADR 027](../decisions/027-home-limits-and-past-planning.md)) |
| R4 | **Tema**: a versão anterior recomendava suportar claro e escuro; a recomendação atual é **só claro no MVP**. Mas, na época, `app.json` tinha `userInterfaceStyle: automatic` e `useTheme()` escolhia os tokens pelo tema do sistema | Com tokens do escuro prontos e sem forçar o claro, o aplicativo ficaria escuro em aparelhos no escuro, sem ter sido testado | **Resolvida:** MVP só claro e sem seguir o tema do sistema ([ADR 026](../decisions/026-visual-direction-and-platforms.md)). **Implementada na E5** da Fase 0: `userInterfaceStyle: light` e `useTheme()` devolve só `Colors.light` ([phase-0-log.md](../development/phase-0-log.md)). **Falta validar em aparelho** |
| R5 | **Cores**: a versão anterior dizia "excluir não é vermelho" e "erros em âmbar" | Erro e aviso estavam fundidos | Corrigido: aviso (âmbar), erro e destrutivo (ferrugem) separados; risco de confusão com o carmim registrado (UX-V15) |
| R6 | **Fontes variáveis**: o Google Fonts distribui só variáveis, e o SDK 57 exige estáticas | Falta um caminho confirmado para obter os arquivos e conhecer o peso | Pendente de verificação ([technical-feasibility.md](./proposal/technical-feasibility.md#1-tipografia-fraunces-títulos-e-figtree-interface)) |
| R7 | **Mês/ano e período** não existem nos seletores nativos | O produto exige as cinco precisões | Controles próprios para esses dois; custo de interface e testes |
| R8 | **Movimento reduzido**: o `useReducedMotion` lê a preferência uma vez ao iniciar | Mudar a configuração com o app aberto não atualiza | Decidir se basta |
| R10 | **Fundo do tema de navegação**: o `ThemeProvider` usa o `DefaultTheme` (cinza `rgb(242, 242, 242)`), não o marfim dos tokens | Cinza visível em transições e áreas fora do `ThemedView` | **Pendência de implementação**; não validada |
| R9 | **Id do aplicativo** (`com.xrickzin.laco`) é sugestão no [ADR 021](../decisions/021-naming-and-identifiers.md), que consta como "Aceita" | O status do ADR sugere decisão fechada | **Resolvido:** confirmado pelo usuário e aplicado na E11 ([ADR 021](../decisions/021-naming-and-identifiers.md)) |

## Resolvidas (onde estão documentadas)

| IDs | Decisão | Onde |
|---|---|---|
| UX-C1, C2, C5, F16 | Ramo por e-mail; código só no primeiro vínculo; "Código do casal" = palavra-chave; estados do fluxo de entrada | [onboarding.md](./onboarding.md), [ADR 022](../decisions/022-entry-flow-and-solo-use.md) |
| UX-C3, C4, F12, F15 | Desejos só com o estado Desejo; recursos avançados fora do MVP; título como essencial; conteúdo de Planejamento | [wishes-and-planning.md](./wishes-and-planning.md) |
| UX-C6, F6, F7, F8 | Confirmação ao finalizar e excluir; ações de transição; exclusão em ações secundárias; finalizar sem data | [wishes-and-planning.md](./wishes-and-planning.md), [living-and-memory.md](./living-and-memory.md) |
| UX-C7, F3, F4 | Uso com um membro; segunda pessoa sem segundo onboarding; configurações simples | [home-and-navigation.md](./home-and-navigation.md), [onboarding.md](./onboarding.md), [ADR 022](../decisions/022-entry-flow-and-solo-use.md) |
| UX-C8 | Barra de navegação: solução técnica mais simples, sem mudar o produto | [home-and-navigation.md](./home-and-navigation.md), [technical-decisions.md](../architecture/technical-decisions.md#a-validar-na-implementação) |
| UX-C9, F13 | Uma só celebração; Início com várias experiências em Vivendo | [home-and-navigation.md](./home-and-navigation.md) |
| UX-C10 | Reutilização só quando real | [README.md](./README.md) |
| UX-F1, F2 | "Já em uso" na etapa do código; código mostrado ao criador, sem recuperação | [onboarding.md](./onboarding.md), [ADR 023](../decisions/023-keyword-check-before-account.md) |
| UX-F5 | Precisão temporal escolhida e preservada | [wishes-and-planning.md](./wishes-and-planning.md#referência-temporal) |
| UX-F9, F10, F11 | "Escrever depois"; criar "Uma memória"; fotos, destaque e favorito | [living-and-memory.md](./living-and-memory.md) |
| UX-F14 | Nossa História: ano → mês → cronológico crescente | [our-story.md](./our-story.md) |
