# Design System inicial (proposta)

> **Direção aprovada; valores e itens técnicos pendentes** ([ADR 026](../../decisions/026-visual-direction-and-platforms.md)). Nada foi implementado. Valores de cor, tipografia e movimento estão em [visual-direction.md](./visual-direction.md) e [motion-and-accessibility.md](./motion-and-accessibility.md); aqui ficam **estrutura, papéis, regras e o mapeamento para o código**.

## 1. Fonte única de verdade

> **`src/constants/theme.ts` é o único lugar dos valores.** Este documento **não** replica valores depois da aprovação: guarda papéis e regras.

A semântica das cores (marca, interação, seleção, aviso, erro, destrutivo) está em [visual-direction.md](./visual-direction.md#semântica-das-cores-valores-pendentes-de-verificação) e tem a direção aprovada, mas os **valores continuam pendentes de verificação**.

**Estado atual (depois da E6 da Fase 0):** `theme.ts` exporta `Colors` (`light` com as chaves da tabela abaixo; `dark` é **legado do template, sem alteração e sem uso no MVP**), `ThemeColor` (= `keyof typeof Colors.light`), `Fonts` (sem a entrada web), `Spacing`, `BottomTabInset` e `MaxContentWidth`. `useTheme()` devolve **somente `Colors.light`** (o MVP tem só o tema claro e não acompanha o tema do sistema). `ThemedText` e `ThemedView` leem esses tokens. `Radius`, `Motion` e `TextStyles` **ainda não existem**. A proposta **estende o mesmo arquivo**, sem segundo arquivo de tema.

## 2. Tokens e mapeamento

Nomes técnicos em inglês no código; nomes de conversa em português ([ADR 021](../../decisions/021-naming-and-identifiers.md)).

### Cores (`Colors.light`; `Colors.dark` fica fora do MVP)

| Chave em código | Estado | Nome de conversa | Papel |
|---|---|---|---|
| `background` | existe | marfim / noite | fundo das telas |
| `backgroundElement` | existe | papel / superfície | superfícies, campos, folhas |
| `backgroundSelected` | existe | selecionado | item selecionado ou pressionado |
| `text` | existe | grafite / texto | texto e botão primário |
| `textSecondary` | existe | cinza quente | texto secundário |
| `border` | **novo** | areia / borda | filetes decorativos |
| `outline` | **novo** | contorno | borda de campos e controles (≥ 3 : 1) |
| `accent` | **novo** | fio | fio, laço, estado ativo |
| `accentStrong` | **novo** | fio escuro | pressionado, texto vermelho pequeno |
| `accentSoft` | **novo** | fio suave | fio decorativo (nunca informação) |
| `warning` | **novo** | aviso (âmbar) | atenção que não é falha |
| `error` | **novo** | erro (ferrugem) | falhas, sempre com ícone e mensagem |
| `destructive` | **novo** | destrutivo (ferrugem) | rótulo de ação irreversível, só em confirmação; mesmo valor inicial de `error` |
| `focus` | **novo** | foco (grafite) | anel de foco de 2 pt |

Mantém as chaves existentes (sem renomear) para não quebrar `ThemedText` e `ThemedView`. A coluna "Estado" descreve a proposta original; **todas as chaves de cor da tabela foram implementadas na E6 como primeira versão**, com valores sujeitos à validação visual. `ThemeColor` agora deriva só de `Colors.light` (antes, da interseção com o escuro).

### Tipografia (`Fonts` e estilos de texto)
- `Fonts` ganha `display` (Fraunces) e `body` (Figtree), um nome de família por peso (fontes estáticas) e `voice` (Fraunces itálico). Mantém `mono`/`serif`/`sans` do sistema como *fallback*.
- Estilos de texto da tabela de [visual-direction.md](./visual-direction.md#3-tipografia) viram um objeto `TextStyles` no mesmo arquivo; `ThemedText` passa a usá-lo (na implementação), em vez de tamanhos fixos.

### Espaçamento, raios, superfícies
- `Spacing` **permanece** (2, 4, 8, 16, 24, 32, 64).
- Novo `Radius`: `photo` 4, `field` 10, `button` 14, `sheet` 20.
- Bordas: filete de 1 pt com `border`; campos com 1 pt de `outline`. Sombras: só folhas e diálogos.
- `MaxContentWidth` permanece; `BottomTabInset` (50 iOS / 80 Android) ficou sem uso: as abas JS da casca visual já tratam a área segura ([visual-shell.md](../../development/visual-shell.md)).

### Movimento
Novo `Motion`: durações (`instant` 100, `short` 200, `medium` 400, `long` 800 ms) e curvas.

## 3. Componentes (só com reutilização real)

Já existem: `ThemedText`, `ThemedView`. Os demais só nascem quando houver uso repetido, nesta ordem provável:

| Componente | Por que justifica | Usos previstos |
|---|---|---|
| Botão (primário, secundário, texto) | muitas telas | entrada, desejo, planejamento, vivendo, confirmações |
| Campo de texto | muitos formulários | entrada, desejo, observações, nome |
| Fio (topo, vertical, laçada) | linguagem recorrente e animada | topo das telas, Nossa História, transições |
| Ícone | conjunto fechado, uso em toda parte | navegação, ações |
| Capa de memória (foto ou composição tipográfica) | duas formas, um só lugar de decisão | Início, Nossa História, detalhe |
| Confirmação (finalizar, excluir) | três usos com o mesmo contrato | finalizar, excluir, sair |
| Estado (vazio, erro, sem conexão) | repetido em todas as listas | Início, Desejos, Nossa História |

Itens de lista editorial **não** viram componente único até haver três telas iguais.

## 4. Estados de interação

Padrão, pressionado (opacidade 0,7 ou `selecionado`), foco visível (anel de 2 pt em `focus`), desabilitado (40 %), erro (`error` + ícone + texto), aviso (`warning` + ícone + texto), carregando. Detalhes em [motion-and-accessibility.md](./motion-and-accessibility.md).

## 5. Regras do fio e do laço

1. O fio é a linguagem; o laço é o símbolo e só aparece nos quatro marcos.
2. O fio nunca entra em botões, campos, cartões ou em cada item de lista.
3. O vermelho da marca nunca preenche botão primário nem áreas grandes, nem é cor de erro ou de exclusão.
4. Fio e laço são decorativos para acessibilidade.
5. Com movimento reduzido, o fio aparece pronto.
6. Ilustrações em linha única, sem preenchimento e sem coração.

## 6. Limitações da estrutura atual

- `theme.ts` importava `@/global.css` e definia `Fonts.web`; **removidos na E3** da Fase 0 ([phase-0-log.md](../../development/phase-0-log.md)).
- `ThemedText.linkPrimary` usava `#3c87f7` direto no componente: **removido na E6**; o link agora é grafite sublinhado (a variante não é usada hoje).
- O `ThemeProvider` usa o `DefaultTheme` do roteador, de fundo cinza `rgb(242, 242, 242)`, diferente do marfim dos tokens: **pendência de implementação**, não validada.
- `app.json` tem cores próprias (abertura `#208AEF`, fundo do ícone Android `#E6F4FE`): não importam o tema e precisam ser alinhadas à paleta à mão.
- `expo-system-ui` já instalado: definir a cor de fundo raiz pode evitar um *flash* de cor diferente do marfim ao abrir; não foi feito nem validado.

## 7. Dependências do template

Estado verificado em `src/`, em `npm ls` e no `package.json` do `expo-router` ([technical-feasibility.md](./technical-feasibility.md#5-dependências-do-template-expo-glass-effect-expoui-expo-symbols)). **Nenhuma foi removida nem instalada.**

| Dependência | Uso em `src/` | Observação | Situação |
|---|---|---|---|
| `expo-glass-effect` | nenhum | só iOS 26+; `expo-router` a declara como dependência própria, então continua instalada mesmo sem o `package.json` do app | **Remoção autorizada após verificação**; ganho pequeno |
| `@expo/ui` | nenhum | `expo-router` também a declara; `DateTimePicker` para iOS e Android, sem mês/ano nem período | **Pendente** até testar o seletor temporal |
| `expo-symbols` | só telas do template | SF Symbols é iOS; `expo-router` a declara | Ícones próprios; remoção do `package.json` sem ganho real |
| `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler` | animações do template | base do motion | **Manter** |
| `expo-image`, `expo-font`, `expo-splash-screen`, `expo-system-ui`, `expo-status-bar`, `expo-linking`, `expo-constants` | template/Expo Router | `expo-system-ui` também é exigido para `userInterfaceStyle` em builds Android | **Manter** |
| `expo-device`, `expo-web-browser` | só telas do template | — | Remover com o template, se nada novo os usar (aprovação específica) |
| `react-native-web`, `react-dom` | web do template | referenciados por vários pacotes do Expo | **Não remover sem teste de bundle** (aprovação específica) |
| `react-native-svg` | não instalada | 15.15.4 esperada pelo SDK 57 | **Aprovada condicionalmente**; instalar só quando um elemento a justificar |
