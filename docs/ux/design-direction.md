# Direção de design e skills de apoio

Define as skills e referências de design que apoiam o desenvolvimento visual e de experiência do Laço, e **como** devem ser usadas. As skills **não** decidem qual é a identidade do produto: ela vem das decisões de produto e da direção de UX ([README.md](./README.md), [visual-identity.md](./visual-identity.md)).

As skills servem para pesquisar referências, propor soluções visuais, estruturar um Design System, avaliar consistência, melhorar UX, revisar acessibilidade, projetar microinterações, orientar a implementação, identificar problemas e manter a consistência entre telas.

## 1. Princípio fundamental

Instalar essas skills **não** autoriza reinventar a identidade do produto. A hierarquia de decisão é:

| # | Nível | Onde está |
|---|---|---|
| 1 | Decisões de produto | [../product/](../product/product-definition.md), [../decisions/](../decisions/README.md) |
| 2 | Decisões de UX do Laço | os documentos de [docs/ux/](./README.md) |
| 3 | Direção visual do Laço | [visual-identity.md](./visual-identity.md) |
| 4 | Design System aprovado | ainda não existe |
| 5 | Skills de design | este documento |
| 6 | Preferências ou sugestões genéricas de UI | — |

Uma sugestão de skill **nunca** sobrescreve uma decisão do projeto. Em conflito entre recomendação externa e decisão registrada do Laço, **prevalece o Laço**.

## 2. Skills desejadas e seus papéis

Uma por papel, formando uma cadeia clara; não instalar várias skills que façam exatamente o mesmo só para aumentar a quantidade.

> **Criar direção** → **Estruturar sistema visual** → **Projetar interações e motion** → **Revisar e polir**

### 2.1 Anthropic Frontend Design — criar direção
Referência principal para direção estética, composição, tipografia, hierarquia visual, uso de cor, diferenciação, qualidade de interface e execução coerente. Ajuda a evitar layouts genéricos, aparência de template, excesso de componentes sem função, estética genérica de SaaS e interfaces intercambiáveis com outros aplicativos.

**Regra:** interpreta a identidade definida pelo Laço e melhora sua execução. Não a substitui.

### 2.2 UI/UX Pro Max — estruturar o sistema visual
Referência estruturada para sistemas visuais, paletas, tipografia, estilos, componentes, padrões de UX, acessibilidade, responsividade, consistência e Design Systems. Também pesquisa combinações e alternativas antes da implementação. É a principal ferramenta para transformar a direção visual em um sistema concreto.

Exemplo. A direção do projeto é "base neutra, fotografia protagonista e vermelho como cor de assinatura". O trabalho da skill é determinar e propor cores exatas, tokens, contraste, hierarquia, escalas, tipografia, espaçamentos, componentes, estados e variantes. **As escolhas devem ser justificadas.**

### 2.3 Design Engineering / Motion — interações e motion
Motion, microinterações, transições, feedback visual, animações orientadas a estado, comportamento mobile e interação natural. Pode incluir as práticas associadas ao trabalho de Emil Kowalski e referências equivalentes.

> **Movimento deve comunicar mudança, relação ou continuidade.** É linguagem de interação, não decoração.

- **Desejado:** transição de Desejo para Planejamento, formação do laço, transições importantes entre estados, feedback de ações relevantes.
- **Indesejado:** animação em todos os botões, elementos pulando sem necessidade, excesso de parallax, animações constantes, movimento só para parecer "moderno".

### 2.4 Impeccable — revisar e polir
Crítica de interface, auditoria visual, revisão de UX, inconsistências, acessibilidade, refinamento e polish de interfaces já implementadas. É usada **depois** que existir uma primeira versão visual. Pergunta "o que está ruim aqui?", não "o que podemos adicionar?".

A revisão procura: inconsistências, excesso visual, problemas de hierarquia e de contraste, componentes desnecessários, espaçamentos inconsistentes, problemas de acessibilidade, comportamento estranho em telas pequenas, excesso de elementos e linguagem visual inconsistente.

## 3. Quando duas skills discordam

Não combinar as duas. Em ordem:

1. identificar o conflito;
2. verificar as decisões do Laço;
3. verificar a direção visual aprovada;
4. escolher a alternativa mais coerente;
5. explicar a decisão quando for relevante;
6. evitar complexidade desnecessária.

## 4. Dependências

Uma recomendação visual **não** significa instalar uma biblioteca. Antes de adicionar uma dependência, verificar:

1. se o Expo/React Native já oferece a capacidade;
2. se uma dependência existente resolve;
3. se dá para implementar sem nova dependência;
4. o custo de manutenção;
5. se ela é realmente necessária para a qualidade da experiência.

Novas dependências devem ser justificadas (ver também [../../CLAUDE.md](../../CLAUDE.md)).

## 5. Design System

As skills ajudam a criar um Design System **persistente** para o Laço. Ele concentra, quando definidos: cores, tipografia, escala tipográfica, espaçamento, bordas, raios, sombras, ícones, componentes, estados, feedback, motion, acessibilidade e tokens. Evita que cada tela seja uma peça independente.

**Fonte de verdade:** depois de aprovado, é a referência para novas telas. Uma tela nova **não** escolhe de novo cor, fonte, espaçamento, raio, sombra nem comportamento de botão quando o sistema já definiu.

## 6. Processo para decisões visuais importantes

1. **Entender:** ler o CLAUDE.md, os documentos de produto, as decisões registradas, a documentação de UX, a direção visual e o Design System existente.
2. **Pesquisar:** usar as skills para buscar referências e alternativas.
3. **Propor:** apresentar uma proposta coerente com o produto. Em decisão relevante: escolha principal, justificativa, alternativas consideradas e possíveis impactos técnicos.
4. **Aprovar:** decisões estruturais de identidade visual são aprovadas **antes** de propagadas pelo aplicativo.
5. **Implementar:** usando o Design System.
6. **Auditar:** usar ferramentas de crítica e revisão.
7. **Refinar:** corrigir sem adicionar complexidade desnecessária.

## 7. Referências externas

Podem vir de aplicativos, sites, produtos digitais, editoriais, fotografia, tipografia, arquitetura, marcas e sistemas de design. São **inspiração, nunca cópia**: o que se busca é composição, hierarquia, ritmo, contraste, interação, linguagem e sensação.

## 8. O que as skills NÃO devem fazer

- transformar o Laço em aplicação de produtividade, dashboard, Kanban ou estética de SaaS;
- adicionar funcionalidades só porque são visualmente interessantes;
- adicionar gamificação ou transformar o aplicativo em rede social;
- usar excesso de cards;
- usar gradientes ou glassmorphism só por tendência;
- usar excesso de animações;
- usar vermelho em todos os elementos;
- tornar a interface excessivamente romântica ou clichê, ou usar corações como linguagem visual dominante;
- criar complexidade visual sem benefício funcional.

## 9. Princípio de qualidade

O objetivo não é parecer "bonito". O objetivo é parecer:

> **Laço.**

Com identidade reconhecível, consistente e apropriada ao propósito do produto.

## 10. Resultado esperado antes da implementação visual ampla

Uma proposta com, no mínimo: direção estética, paleta, tipografia, escala, espaçamento, componentes principais, iconografia, linguagem fotográfica, linguagem do fio, linguagem do laço, motion, acessibilidade, exemplos de aplicação e anti-padrões. Ela é **revisada antes** de virar a base definitiva da implementação.

## 11. Regra final

As skills são ferramentas de apoio; não definem o que é o Laço. A identidade vem das decisões de produto e da direção de UX. As skills transformam essas decisões em uma experiência visual mais consistente, sofisticada, acessível e tecnicamente sustentável.

## 12. Questões visuais delegadas às skills

As questões visuais **não foram decididas** nos documentos de UX e são analisadas pelas skills de design: paleta (UX-V1), tipografia (UX-V2), modo escuro (UX-V3), fio animado (UX-V4), ícones (UX-V5), estados de carregamento, erro, vazio e conexão (UX-V6), acessibilidade visual (UX-V7), tratamento visual do e-mail (UX-V8) e as demais UX-V em [open-questions-ux.md](./open-questions-ux.md).

**Restrições que as skills recebem:** identidade do Laço, decisões de produto, decisões de UX, conceito do fio, conceito do laço, fotografia como protagonista, estética editorial, elegância, intimidade e simplicidade. Elas propõem o sistema visual **e justificam as escolhas**; **não alteram** as decisões de produto e de UX já registradas.

## 13. Próxima entrega

Uma **proposta de Visual Direction e Design System**, não código ([seção 10](#10-resultado-esperado-antes-da-implementação-visual-ampla)). **Primeira versão pronta para avaliação:** [proposal/visual-direction.md](./proposal/visual-direction.md); avaliação das ferramentas em [design-tools.md](./design-tools.md). A interface inteira **não** é implementada antes da revisão dessa proposta.

> **Primeiro definimos como o Laço deve ser percebido.**
> **Depois definimos como isso vira interface.**
> **Só então implementamos.**

---

## Integração com o projeto

Acréscimos do Claude para encaixar este documento no repositório. Não fazem parte do texto de direção acima.

- **Status das skills:** as quatro estão registradas aqui como **referências desejadas**; no momento **nenhuma está instalada**. Instalar é etapa separada e com aprovação. Skills de terceiros mudam o comportamento do Claude, então o conteúdo deve ser revisado antes; a hierarquia da seção 1 é a salvaguarda.
- **Motion:** a direção cita "práticas associadas a Emil Kowalski e equivalentes" sem apontar uma skill concreta. Falta definir qual referência usar (UX-D2).
- **React Native:** skills de design podem ser orientadas a web (CSS, Tailwind, fontes web). Traduzir para React Native/Expo; web não faz parte do produto ([../product/mvp.md](../product/mvp.md#mobile)).
- **Onde mora o Design System:** a documentação em `docs/ux/`, criada só quando houver proposta aprovada, e os tokens no código em `src/constants/theme.ts`, que já existe (`Colors`, `Spacing`, `Fonts`), reutilizado em vez de criar outro arquivo de tema (UX-D3).
- **Registro:** decisões estruturais de identidade visual aprovadas viram ADR em [../decisions/](../decisions/README.md).
- **Dependências do template:** `expo-glass-effect` e `@expo/ui` estão instalados e o produto não os usa; `react-native-reanimated` já cobre motion. Reavaliar na Fase 0, coerente com o anti-padrão de glassmorphism (UX-D5).
- **Roadmap:** as telas da Fase 1 dependem da proposta visual aprovada; a parte de dados e serviços pode começar antes ([../development/roadmap.md](../development/roadmap.md), UX-D4).

Questões relacionadas: [open-questions-ux.md](./open-questions-ux.md#c-design-e-skills).
