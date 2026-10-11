# Viabilidade técnica da direção visual

> **Direção aprovada, itens técnicos pendentes** ([ADR 026](../../decisions/026-visual-direction-and-platforms.md)). Revisão da viabilidade de tipografia, `react-native-svg` e seleção temporal contra o projeto real (Expo SDK 57, React Native 0.86.3, Reanimated 4.5.1). **Nada foi baixado, instalado, removido ou alterado.** Onde não foi possível verificar, está dito.

Como verifiquei: arquivo `node_modules/expo/bundledNativeModules.json` do projeto (versões que o SDK 57 espera), documentação do Expo SDK 57 e do Reanimated, listagens públicas dos repositórios das fontes. As leituras de páginas foram resumidas automaticamente; **não testei nada em aparelho**.

## 1. Tipografia: Fraunces (títulos) e Figtree (interface)

| Ponto | Verificado | Incerto |
|---|---|---|
| **Licença** | Os dois estão no repositório `google/fonts` com `OFL.txt` (SIL Open Font License 1.1), que permite embutir em aplicativo | Texto da licença não foi lido por inteiro; **conferir antes de incluir os arquivos** |
| **Arquivos** | O diretório do Google Fonts traz **só fontes variáveis**: `Fraunces[SOFT,WONK,opsz,wght].ttf` e `Fraunces-Italic[...]`, `Figtree[wght].ttf` e `Figtree-Italic[wght].ttf` | Não vi arquivos estáticos nesses diretórios |
| **Variáveis no Expo** | O guia do Expo diz que fontes variáveis são suportadas **a partir do SDK 58**; "em versões anteriores, use arquivos estáticos". O projeto está no **SDK 57** | O guia consultado pode ser de versão posterior; reconferir no guia da versão instalada |
| **Como obter os estáticos** | Dois caminhos plausíveis: pasta `static/` do download oficial do Google Fonts, ou gerar instâncias a partir da variável com `fonttools` (ferramenta Python, fora do projeto) | **Não verificado** que o download traz `static/`. Fraunces: o repositório do autor descreve gerar com `make build` |
| **Formato** | TTF e OTF são oficialmente suportados | — |
| **Carregamento** | `useFonts` (funciona no Expo Go e em todas as plataformas) com `expo-splash-screen`; o plugin de configuração embute em tempo de build, mas **não funciona no Expo Go**. O template já chama `preventAutoHideAsync()` em `src/app/_layout.tsx` | — |
| **Impacto inicial** | 5 arquivos TTF (Fraunces SemiBold e Itálico; Figtree Regular, Medium, SemiBold) carregados antes da primeira tela, atrás da abertura | **Tamanho não verificado**: medir ao obter os arquivos; reduzir (menos pesos, subconjunto de caracteres do português) se passar do aceitável |
| **Fallback** | `Fonts.sans`/`Fonts.serif` do sistema já existem em `theme.ts`; a abertura continua visível até as fontes carregarem; se falhar, esconder a abertura e usar o sistema | Aparência do fallback não foi avaliada |

Alternativa: pacotes `@expo-google-fonts/fraunces` e `/figtree` (dependências novas que entregam arquivos estáticos). Não consegui abrir a página do pacote; **não verificado**.

**Avaliação:** viável e coerente com a stack. O ponto aberto real é **obter as instâncias estáticas** e **medir o peso**. Recomendável, sem instalar nada: preparar os cinco arquivos na Fase 0 e validar visualmente (principalmente a serifa em corpo pequeno e os eixos `opsz`/`SOFT`).

## 2. `react-native-svg`

| Ponto | Resultado |
|---|---|
| **Versão esperada pelo SDK 57** | **15.15.4** (do `bundledNativeModules.json`) |
| **Compatibilidade** | Versões ≥ 15.13 declaram suporte ao React Native ≥ 0.78; o projeto usa 0.86.3. Está no Expo Go. Instalação: `npx expo install react-native-svg` |
| **Animação com Reanimated 4** | A documentação do Reanimated descreve animar componentes SVG com `createAnimatedComponent` e `useAnimatedProps`, citando propriedades como `strokeDashoffset`. Não exige a *flag* experimental de CSS |
| **Incerto** | A documentação consultada **não** trata de medir o comprimento de um traço. Para "desenhar" o fio é preciso um comprimento conhecido (calculado ao exportar o desenho) e testar `strokeDasharray`/`strokeDashoffset`. **Precisa de um protótipo** |

**O que realmente exige SVG e o que não exige**

| Elemento | Sem dependência | Com `react-native-svg` |
|---|---|---|
| Fio reto (topo das telas, linha da timeline) | `View` fina, animável com Reanimated | desnecessário |
| Fio curvo e laçada (transição, conclusão) | não é viável com `View` | sim |
| Laço (nó) | imagem PNG fixa (sem "formar o laço") | sim, animável |
| Ícones | PNGs 1x/2x/3x tingidos pelo sistema (como no template) | sim, cor por token, nítidos |
| Ilustrações em linha única | PNG | sim |

Alternativas pesadas e desnecessárias: Lottie (outro formato, outra dependência) e Skia (muito maior).

**Avaliação:** agrega valor **real, mas concentrado**: a laçada animada do fio, o laço e os ícones/ilustrações com cor por token. Custo: uma dependência mantida pelo Expo, já na versão esperada pelo SDK. Se o produto aceitasse fio reto e laços estáticos, daria para dispensar. **Recomendado, pendente de sua aprovação; nada foi instalado.**

## 3. Seleção temporal

Requisito: cinco precisões (sem data, mês/ano, data, data + horário, período), **precisão preservada** e referência temporal **sem** significar transição automática ([dates-and-automation.md](../../product/dates-and-automation.md)). Plataformas pretendidas: iOS e Android.

### O que o `@expo/ui` oferece (SDK 57)

| Item | Verificado |
|---|---|
| **Estado** | Estável no SDK 57; incluído no Expo Go; versão esperada `~57.0.21` (a instalada) |
| **`DateTimePicker` (substituto direto)** | iOS **e** Android; modos `date`, `time`, `datetime`; valor é um `Date` do JavaScript; `minimumDate`/`maximumDate`; `locale` (só iOS); `is24Hour` (Android); `display` (`spinner`, `compact`, `inline`, `calendar`, `clock`); `presentation` `dialog` só no Android; **não exige `Host`** |
| **Limitações declaradas** | **Sem seleção de mês/ano e sem período (intervalo)** |
| **`DatePicker` do SwiftUI** | só iOS; exige `Host`; estilos `compact`, `graphical`, `wheel`; aceita `range` de datas selecionáveis |
| **Alternativa já prevista no SDK** | `@react-native-community/datetimepicker` 9.1.0 (não instalada): mesma natureza, também sem mês/ano e sem período |

### Cobertura das cinco precisões

| Precisão | Solução | Observação |
|---|---|---|
| sem data | nenhum seletor (ação "remover data") | — |
| mês/ano | **controle próprio** com componentes do React Native (seletor de mês e de ano) | os pickers nativos não cobrem |
| data | `DateTimePicker` modo `date` | — |
| data + horário | `DateTimePicker` modo `datetime` | em Android o comportamento do modo combinado **não foi verificado**; pode exigir data e hora em dois passos |
| período | **dois** seletores de data (início, fim) com validação de fim ≥ início | não existe intervalo nativo |

### Armadilhas que a proposta registra
1. **Não guardar um único `Date`.** Guardar a **precisão** e os **componentes** (ano; ano e mês; ano, mês e dia; mais hora e minuto; início e fim). Converter "outubro de 2026" em `01/10/2026` é exatamente o que o produto proíbe.
2. **Fuso.** Um `Date` de "12 de outubro" à meia-noite local vira outro dia ao serializar em UTC. O horário escolhido é o **horário do Laço**, não necessariamente o do aparelho ([ADR 019](../../decisions/019-automation-implementation.md)). Usar os componentes escolhidos pela pessoa, não o instante do `Date`; o servidor calcula o instante de início.
3. **Selecionar não dispara nada.** O seletor só grava a referência; a automação segue as regras do [ADR 019](../../decisions/019-automation-implementation.md).

**Avaliação:** o `@expo/ui` **resolve data e data + horário nas duas plataformas**, mas **não** mês/ano nem período. Esses dois são pequenos controles próprios. **Recomendado manter o `@expo/ui` por ora** (já instalado, sem custo novo), **pendente de verificação em aparelho** (iOS e Android): aparência frente à identidade editorial, `locale` em português, e o modo `datetime` no Android. Se não servir, as alternativas são o pacote da comunidade (nova dependência) ou controles próprios, com custo de interface e testes.

## 4. Cores semânticas

Ver a tabela em [visual-direction.md](./visual-direction.md#2-paleta). Verificação feita: contrastes calculados por script. **Risco visual declarado:** vermelho da marca (matiz ~357°), vermelho-ferrugem de erro (~12°) e âmbar de aviso (~33°) são vizinhos; a mitigação é de uso (a marca nunca é texto de estado; erro e aviso sempre com ícone e mensagem) e **precisa ser julgada visualmente** em [preview.html](./preview.html).

## 5. Dependências do template: `expo-glass-effect`, `@expo/ui`, `expo-symbols`

Verificação **somente leitura** (busca em `src/` e `app.json`, `npm ls`, `package.json` do `expo-router` instalado):

| Pacote | Uso em `src/` | Quem depende dele |
|---|---|---|
| `expo-glass-effect` | **nenhum** | **`expo-router` 57.0.24 o declara em `dependencies`** |
| `@expo/ui` | **nenhum** | `expo-router` o declara em `dependencies` |
| `expo-symbols` | só telas do template (`SymbolView`) | `expo-router` o declara em `dependencies` |
| `react-dom`, `react-native-web` | só o template/web | `react-native-web` e `react-dom` são *peers* **opcionais** do `expo-router`; `react-dom` também é referenciado por `@expo/metro-runtime`, `@expo/cli` e `@expo/ui` |

**Consequência:** remover `expo-glass-effect`, `@expo/ui` ou `expo-symbols` do `package.json` do aplicativo **não os remove do projeto**; continuam instalados como dependências do roteador (e, em builds nativos, o código nativo deles segue sendo autolincado). O ganho é só deixar de declarar o que o produto não usa. Remover `react-dom` e `react-native-web` é outra conta: vários pacotes do Expo os referenciam e só um teste de bundle diz se é seguro.

## 6. Pendências técnicas abertas

Legenda: **Documentado** = consta nos documentos do projeto; **Verificado em fonte** = li documentação ou arquivos, sem testar; **Depende de aparelho** = só se confirma rodando em iOS e Android reais. **Nenhum teste foi executado.**

| # | Pendência | Documentado | Verificado em fonte | Depende de aparelho ou de execução |
|---|---|---|---|---|
| 1 | **Fontes estáticas de Fraunces e Figtree e seus tamanhos** | Aprovadas, condicionadas aos arquivos | OFL; Google Fonts só tem variáveis; SDK 57 exige estáticas | **Resolvido na E10** (arquivos obtidos pelos pacotes `@expo-google-fonts`, 153 KB, OFL conferida); resta validar em aparelho |
| 2 | **Distinção entre marca, aviso, erro e destrutivo** | Semântica proposta; valores não fechados | Contrastes calculados (todos ≥ 4,5 : 1 para texto) | Julgamento visual de carmim × ferrugem × âmbar, também para daltonismo; teste em tela real |
| 3 | **`@expo/ui` para data e data + horário** | Decisão pendente | `DateTimePicker` cobre iOS e Android; sem mês/ano e sem período | Aparência, `locale` em português, modo `datetime` no Android |
| 4 | **Seletores próprios de mês/ano e de período** | Precisão preservada exigida | Nenhum picker nativo cobre | Desenhar e testar a interação; definir entre controles de React Native puros ou outra opção |
| 5 | **Animação do fio com SVG** (só se necessária) | `react-native-svg` aprovado condicionalmente | Versão 15.15.4 esperada; Reanimated 4 anima propriedades de SVG | Medir o comprimento do traço e testar `strokeDasharray`/`strokeDashoffset`; decidir primeiro se a animação é necessária ou basta o fio reto e o laço estático |
| 6 | **Remoção do `expo-glass-effect`** | Autorizada após confirmar | Sem uso em `src/`; **o `expo-router` o declara como dependência** | Rodar `expo-doctor`, `tsc` e o bundle depois de remover do `package.json` para confirmar que nada quebra |

## 7. Situação das decisões

| Item | Situação |
|---|---|
| Direção "papel de álbum", neutros quentes, fotografia protagonista, fio vermelho | **Aprovado** ([ADR 026](../../decisions/026-visual-direction-and-platforms.md)) |
| Fraunces e Figtree | **Aprovado, condicionado** ao pendente 1 |
| Paleta | **Direção aprovada; valores finais pendentes** do pendente 2 |
| Tema só claro no MVP, sem seguir o tema do sistema | **Aprovado** |
| iOS e Android, sem web no escopo inicial | **Aprovado** |
| `react-native-svg` | **Aprovado condicionalmente** a elementos que o justifiquem |
| Nenhuma skill ou ferramenta nova agora | **Aprovado** |
| Limites do Início, listas completas e Planejamento com data passada | **Aprovado (limites provisórios)** ([ADR 027](../../decisions/027-home-limits-and-past-planning.md)) |
| Remover `expo-glass-effect` | **Autorizado após verificação** (pendente 6) |
| `@expo/ui` | **Pendente** (3 e 4) |
| Id `com.xrickzin.laco` | **Confirmado pelo usuário e aplicado na E11** (`android.package` e `ios.bundleIdentifier`) |
