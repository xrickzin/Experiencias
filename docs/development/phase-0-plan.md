# Plano da Fase 0 (E0 a E6, E8, E10, E11 e E13 executadas; as demais **não executadas**)

> **Etapas E0 a E8 e E10 a E13 executadas** (registro em [phase-0-log.md](./phase-0-log.md)); **E7 e E12 executadas em 2026-10-16** (a E12 sem remover `react-native-web` e `react-dom`); **só a E9 continua pendente** e depende da arte do ícone e da abertura. Cada etapa só roda com o seu comando explícito. Decisões que o sustentam: [ADR 021](../decisions/021-naming-and-identifiers.md), [026](../decisions/026-visual-direction-and-platforms.md), [027](../decisions/027-home-limits-and-past-planning.md). Contexto: [roadmap.md](./roadmap.md), [technical-decisions.md](../architecture/technical-decisions.md), [proposal/](../ux/proposal/visual-direction.md).

Revisado em uma checagem operacional (somente leitura): linha de base, referências de cada arquivo, evidências de cada dependência. Nenhum ADR foi alterado.

## 1. Linha de base (preexistente)

### Os dois erros de `tsc --noEmit`

```
src/components/animated-icon.web.tsx(5,21): error TS2307: Cannot find module './animated-icon.module.css' or its corresponding type declarations.
src/constants/theme.ts(6,8): error TS2882: Cannot find module or type declarations for side-effect import of '@/global.css'.
```

| Ponto | Resultado |
|---|---|
| **Causa** | O `tsconfig.json` inclui `expo-env.d.ts` e `.expo/types/**`. Esses arquivos **não existem** porque são gerados pelo `expo start` e estão no `.gitignore`. Sem eles, o TypeScript não carrega `expo/types`, que é onde estão `declare module '*.css'` e `'*.module.css'` (`node_modules/expo/types/global.d.ts`) |
| **Prova** | Com uma configuração temporária **fora do projeto** que acrescenta `node_modules/expo/types/index.d.ts` à lista de arquivos, o `tsc --noEmit` termina **sem erros**. Nada no projeto foi alterado |
| **Origem dos imports** | `import '@/global.css'` (variáveis de fonte para web) em `theme.ts`; `import classes from './animated-icon.module.css'` em `animated-icon.web.tsx` (só web) |
| **Classificação** | **Preexistentes e de ambiente**, não regressões: o código do template é válido; falta o arquivo de tipos gerado. Em uma máquina que já rodou `expo start`, não aparecem |
| **Como somem** | (a) rodar `expo start` uma vez (gera `expo-env.d.ts`), **ou** (b) pela limpeza: o arquivo `.web.tsx` sai (E2) e o `import` de CSS sai de `theme.ts` (E3). **Situação atual: resolvidos pela limpeza (E2 e E3); `tsc --noEmit` roda sem erros.** Nenhuma dependência foi instalada |

### Outras medições ainda não feitas

`expo-doctor` e `expo export` foram registrados na E0 ([phase-0-log.md](./phase-0-log.md)). `expo lint` passou a rodar com a E13: 0 erros e 0 avisos em `src/` (ver o log).

### Estado do Git na linha de base
Na E0, a árvore do aplicativo estava limpa em relação a `f1a7a91` (só `app/.claude/settings.json` em *staging*). Os arquivos do template estão no commit e são recuperáveis. O estado depois das etapas executadas está em [phase-0-log.md](./phase-0-log.md).

## 2. Arquivos: o que sai, o que muda, o que fica

Verificado por busca de referências em `src/`, `app.json`, `package.json`, `.gitignore`, `README.md`, `AGENTS.md` e `docs/`.

### Remover (sem uso depois do que cada etapa indica)

| Arquivo | Finalidade atual | Referenciado por | Etapa |
|---|---|---|---|
| `src/app/explore.tsx` | tela de demonstração | só o `app-tabs.tsx` (nome de rota, sem import) | E2 |
| `src/components/animated-icon.tsx` | animação de abertura do Expo; **também chama `SplashScreen.hideAsync()`** (linha 52) | `_layout.tsx`, `index.tsx` | E2 (depois de E1) |
| `src/components/animated-icon.web.tsx`, `animated-icon.module.css` | variante web e estilo | só o par acima | E2 |
| `src/components/hint-row.tsx` | dica da tela inicial do template | `index.tsx` | E2 |
| `src/components/web-badge.tsx` | selo do Expo | `index.tsx`, `explore.tsx` | E2 |
| `src/components/ui/collapsible.tsx` | exemplo de componente | `explore.tsx` | E2 |
| `src/components/external-link.tsx` | link externo do template | `explore.tsx`, `app-tabs.web.tsx` | E2 |
| `src/components/app-tabs.web.tsx` | abas da web | nenhum | E2 |
| `assets/images/{expo-logo,logo-glow,expo-badge,expo-badge-white,react-logo,react-logo@2x,react-logo@3x,tutorial-web}.png` | imagens da demonstração | só os arquivos acima | E2 |
| `src/hooks/use-color-scheme.web.ts` | tema na web (hidratação) | nenhum (extensão `.web`) | E3 |
| `src/global.css` | variáveis de fonte para web | `theme.ts` | E3 |
| `scripts/reset-project.js` | script do template | `package.json`, `README.md`, texto em `index.tsx` | E4 |
| `desktop.ini` | metadado do Windows, versionado por engano | nenhum | E4 (sai do Git e entra no `.gitignore`) |

### Modificar

| Arquivo | Mudança | Etapa |
|---|---|---|
| `src/app/_layout.tsx` | sem `AnimatedSplashOverlay` e `AppTabs`; **precisa esconder a abertura por conta própria** | E1 |
| `src/app/index.tsx` | tela mínima, sem os componentes do template nem `expo-device` | E1 |
| `src/constants/theme.ts` | remover `import '@/global.css'` e a entrada `web` de `Fonts` | E3 |
| `package.json` | remover o script `reset-project`; depois, dependências (E7 em diante) | E4, E7+ |
| `README.md` | tirar as instruções do template (`reset-project`) | E4 |
| `app.json` | `userInterfaceStyle: light` (E5); cores (E9); nome, slug, scheme e identificadores nativos (E11, executada); bloco `web` (E8, executada) | vários |
| `src/hooks/use-theme.ts`, `src/app/_layout.tsx` | tema só claro | E5 |
| `.gitignore` | acrescentar `desktop.ini` | E4 |

### Manter (inclusive os que geram dúvida)

| Arquivo | Motivo |
|---|---|
| `src/components/themed-text.tsx`, `themed-view.tsx`, `src/hooks/use-theme.ts` | usados e reaproveitáveis |
| `src/hooks/use-color-scheme.ts` | uma linha que reexporta o do React Native; sai só se E5 o deixar sem uso |
| **`src/components/app-tabs.tsx` + `assets/images/tabIcons/*`** | **dúvida registrada:** sem uso depois da E1, mas é a única referência de `NativeTabs` enquanto a barra com `+` central não for decidida ([technical-decisions.md](../architecture/technical-decisions.md#a-validar-na-implementação)). Mantidos; remover quando a navegação for definida |
| `assets/images/{icon,splash-icon,favicon,android-icon-*}.png`, `assets/expo.icon/` | referenciados por `app.json`; trocam quando houver arte nova |
| `LICENSE` | MIT em nome de "650 Industries, Inc. (aka Expo)", do template. **Dúvida:** não sei qual licença o projeto Laço adotará; mantido |
| `AGENTS.md`, `.vscode/*`, `.claude/settings.json`, `tsconfig.json`, `.gitignore` | configuração do projeto |

## 3. Dependências

Evidências coletadas só por leitura: busca de imports em `src/`, `npm ls`, `package.json` dos pacotes instalados. Nenhuma foi removida.

| Dependência | Motivo da remoção | Uso direto | Transitivas relevantes | Impacto esperado | Validação depois de remover |
|---|---|---|---|---|---|
| **`expo-glass-effect`** | produto rejeita vidro; só iOS 26+ | **nenhum** em `src/`/`app.json` | **`expo-router` 57.0.24 o declara em `dependencies`** | Nenhum em `node_modules`, bundle ou módulo nativo: só deixa de ser declarado pelo app. Ganho: clareza | `npm ls expo-glass-effect` (deve aparecer só sob `expo-router`), `npx expo-doctor`, `npx tsc --noEmit`, `npx expo export --platform ios --platform android` |
| **`react-native-web`** | web fora do escopo | **nenhum** import em `src/`; só o ramo `Platform.OS === 'web'` do template | *Peer* **opcional** de `expo`, `expo-image`, `expo-system-ui`, `expo-router`; `expo/types` traz um `.d.ts` dele | Em iOS/Android, nenhum esperado; `expo start --web` deixa de funcionar (intencional). Exige remover antes o bloco `web` do `app.json` e o script `web` | as mesmas quatro; mais `npm ls react-native-web` vazio |
| **`react-dom`** | web fora do escopo | **nenhum** | *Peer* **opcional** de `expo`, `expo-router`, `@expo/ui`, `@expo/metro-runtime`, `@expo/router-server` | Igual ao anterior | as mesmas; `npm ls react-dom` |
| `expo-device` | só a tela de demonstração | só `index.tsx` | nenhuma | nenhum | as mesmas |
| `expo-web-browser` | só o link externo do template | só `external-link.tsx` | nenhuma | nenhum agora. Pode voltar a ser útil se um dia houver login externo; hoje o login é e-mail e senha | as mesmas |
| `expo-symbols` | ícones SF do template (iOS) | `explore.tsx`, `app-tabs.web.tsx`, `collapsible.tsx` | **`expo-router` o declara** | Nenhum: continua instalado. **Não recomendo remover** (sem ganho) | — |
| `@expo/ui` | — | nenhum | `expo-router` a declara | **Pendente** (seletor de data); continua instalado de qualquer forma | — |

**Observações:**
- Todas as peers de `react-dom`/`react-native-web` são **opcionais**, o que sustenta a remoção, mas **só um `expo export` real confirma**; isso não foi feito.
- Se `react-dom`/`react-native-web` forem removidos, o `app.json` deixa de ter sentido com `web.output: static` e o plugin do roteador de renderização estática: por isso a remoção vem **depois** do bloco `web` (E8).
- A condição do ADR 026 para o `expo-glass-effect` ("sem dependência indireta relevante") **não está plenamente satisfeita**: existe a dependência do roteador. A remoção é inofensiva, mas a decisão de fazê-la é sua (E7).

## 4. Execução em etapas reversíveis

Regras: uma preocupação por etapa; **limpeza, mudanças visuais e dependências nunca na mesma etapa**; cada etapa termina com validação e fica na árvore de trabalho (sem commit, a menos que você peça; recomendo um commit por etapa). Reverter uma etapa: `git restore`/`git checkout` dos arquivos listados.

Legenda: ✅ **executada** (registro em [phase-0-log.md](./phase-0-log.md)) · ⏸ **não executada**, depende de decisão ou evidência pendente · 🛑 condição de interrupção.

| # | Etapa | Arquivos | Mudança | Validação | Resultado esperado | 🛑 Interromper e perguntar se |
|---|---|---|---|---|---|---|
| **E0** ✅ | Linha de base (só leitura) | nenhum | Rodar e anotar: `git status`, `npx tsc --noEmit`, `npx expo-doctor`, `npx expo export --platform ios --platform android` (cria `dist/`, ignorado) | comparar com a seção 1 | Mesmos 2 erros do `tsc`; `doctor`/`export` registrados | `export` falhar já na linha de base |
| **E1** ✅ | Aplicativo mínimo, **sem apagar nada** | `src/app/_layout.tsx`, `src/app/index.tsx` | Layout com `Stack` e **`SplashScreen.hideAsync()` próprio**; `index` com uma tela mínima. Os componentes do template ficam no disco, sem uso | `npx tsc --noEmit`; `expo export`; abrir em iOS e Android | O app abre numa tela simples e a abertura **some** | a abertura não esconder; rota quebrada; `typedRoutes` reclamar |
| **E2** ✅ | Remover a demonstração | lista "Remover" com etapa E2 | Apagar os arquivos e imagens listados (**`app-tabs.tsx` e `tabIcons` ficam**) | busca por importações das peças removidas = 0; `tsc`; `export`; abrir o app | Sem referências quebradas; o erro de `.module.css` desaparece | qualquer referência restante; alguma peça ser usada fora do previsto |
| **E3** ✅ | Remover resíduos de web e CSS | `use-color-scheme.web.ts`, `global.css`, `theme.ts` | Apagar os dois arquivos; tirar `import '@/global.css'` e `Fonts.web` | `tsc` **sem nenhum erro**; abrir o app | Os dois erros da linha de base resolvidos pela limpeza | `Fonts.web` ainda for usado; mudar a fonte na tela |
| **E4** ✅ | Higiene do repositório | `scripts/reset-project.js`, `package.json` (script), `README.md`, `desktop.ini`, `.gitignore` | Remover o script e seu uso; reduzir o `README`; tirar `desktop.ini` do Git (`git rm --cached`) e ignorá-lo | `npm run` não lista `reset-project`; `git status` só com o previsto | Repositório sem restos do template | o `README` ter conteúdo que você queira preservar |
| **E5** ✅ | Tema claro fixo | `app.json`, `use-theme.ts`, `use-color-scheme.ts` (se ficar sem uso), `_layout.tsx` | `userInterfaceStyle: light`; `useTheme()` devolve só os tokens claros | `tsc`; **aparelho com tema escuro do sistema** continua claro, em iOS e Android | O app não acompanha o tema do sistema | Expo Go ignorar a configuração; exigir novo *build* de desenvolvimento (decidir como testar) |
| **E6** ✅ | Tokens de cor, versão mínima (executada: cores, tipagem e link; `Radius`, `Motion` e `TextStyles` ficaram de fora) | `theme.ts`, `themed-text.tsx` (o `themed-view.tsx`, previsto, não precisou mudar) | Chaves novas conforme [design-system.md](../ux/proposal/design-system.md); tirar a cor fixa `#3c87f7` | `tsc`; busca de hexadecimais fora de `theme.ts` | Uma só fonte dos tokens | (condição original: valores das cores não aprovados; a E6 foi autorizada com os valores como primeira versão, sujeitos à validação visual) |
| **E7** ✅ | Remover `expo-glass-effect` | `package.json`, `package-lock.json` | `npm uninstall expo-glass-effect` | linha "Validação" da tabela de dependências | Pacote só sob `expo-router` | você preferir não remover pela dependência do roteador; `expo-doctor` com aviso novo | **Executada (2026-10-16): só a declaração saiu; o pacote segue instalado pelo `expo-router`.** |
| **E8** ✅ | Bloco web e script `web` | `app.json` (`web`), `package.json` (script) | Remover o que é só de web | `expo-doctor`; `export` | Nenhuma configuração de web | você querer manter web como possibilidade | **Executada: bloco `web` do `app.json` e script `web` removidos; `react-dom` e `react-native-web` seguem instalados (E12).**
| **E9** ⏸ | Cores de configuração | `app.json`, imagens de abertura e ícone | Trocar `#208AEF` e `#E6F4FE` pela direção; arte nova | abrir o app e ver a abertura | Sem cores do template | marfim final e arte indefinidos |
| **E10** ✅ | Fontes | `assets/fonts/*`, `theme.ts`, `_layout.tsx` | Obter estáticas (**download exige sua autorização**), conferir licença, medir peso, carregar com `useFonts` | primeira tela correta com e sem arquivos; peso registrado | Fraunces e Figtree funcionando com fallback | não houver como obter estáticas; peso inaceitável | **Executada à parte: 3 fontes estáticas (Fraunces SemiBold, Figtree Medium e SemiBold, 153 KB) em `assets/fonts/`, com as licenças OFL; sem validação em aparelho.**
| **E11** ✅ | Nome técnico e identidade nativa | `app.json` | `name: Laço`, `slug` e `scheme: laco`, `android.package` e `ios.bundleIdentifier` = `com.xrickzin.laco` (id confirmado pelo usuário). Feita em duas execuções: ids primeiro, depois nome, `slug` e `scheme` | `tsc`, `lint`, `expo-doctor`, `expo config --type public` | Config efetiva com os cinco valores | — | **Executada; sem build nativo nem teste em aparelho.**
| **E12** ✅ | Dependências do template, uma por vez | `package.json` | `expo-device`, `expo-web-browser`, depois `react-native-web` e `react-dom` (só após E8) | tabela de dependências, **a cada remoção** | `npm ls` coerente | qualquer falha de `export`; aviso novo do `doctor` | **Concluída: `expo-device` (E12.1) e `expo-web-browser` (E12.2) removidos; `react-native-web` e `react-dom` mantidos por decisão do usuário (o `expo-router` os exige; ver E12.3 no log).** |
| **E13** ✅ | Lint | `package.json`, config do ESLint | Instalar ESLint por `npx expo lint` | `npx expo lint` sem erros | Lint funcionando | a configuração gerada divergir de `AGENTS.md` | **Executada à parte: `eslint@^9` + `eslint-config-expo@~57.0.2`, `eslint.config.js` do modelo oficial; 0 erros e 0 avisos em `src/`.**

Fora deste plano: projeto Supabase e migrações (o [roadmap](./roadmap.md) os põe na Fase 0, mas dependem da sua conta); `react-native-svg` (instalada só quando um elemento a justificar).

## 5. Executado × pendente

| ✅ Executado (E0 a E6, E8, E10, E11 e E13, ver [phase-0-log.md](./phase-0-log.md)) | ⏸ Pendente (exige autorização ou decisão) |
|---|---|
| Linha de base; aplicativo mínimo; remoção da demonstração e dos resíduos de web e CSS; higiene do repositório; tema claro fixo; tokens de cor (primeira versão) | Validação visual das cores (inclui a distinção carmim, ferrugem e âmbar); arte de abertura e ícone (E9) |
| Web fora do escopo (nenhum código web criado) | `expo-glass-effect`: remover mesmo com a dependência do roteador (E7) |
| ESLint (E13): instalado e configurado; lint sem avisos nem erros; bloco `web` e script `web` removidos (E8) | Dependências web e do template (E12) |
| Fontes (E10): Fraunces e Figtree estáticas, carregadas por `useFonts` | Fontes (E10): pesos adiados (Figtree Regular e Fraunces Itálico) e escala de textos |
| Identidade (E11): `name` `Laço`, `slug` e `scheme` `laco`, id `com.xrickzin.laco` nas duas plataformas | `@expo/ui` e os outros 4 patches do `expo-doctor` |
| `react-native-svg` condicional (fora da Fase 0); `app-tabs.tsx` e `tabIcons` mantidos por dúvida | Fundo cinza do tema de navegação (ver riscos) |

## 6. Validação final e riscos

| Verificação | Comando | Critério |
|---|---|---|
| Tipos | `npx tsc --noEmit` | sem erros |
| Dependências e configuração | `npx expo-doctor` | sem avisos novos em relação à E0 |
| Lint (E13 concluída) | `npx expo lint` | sem erros (linha de base: 0 erros e 0 avisos) |
| Bundle | `npx expo export --platform ios --platform android` | sem falha |
| Declaração | `npm ls expo-glass-effect @expo/ui expo-symbols react-dom react-native-web` | coerente com o aprovado |
| Cores soltas | busca de `#[0-9A-Fa-f]{6}` em `src/` | só em `theme.ts` |
| Tema | aparelho iOS e Android com tema escuro | continua claro |
| Alterações | `git status`, `git diff --stat` | só o previsto |

Testes em aparelho real não foram feitos e dependem de você (ou de emulador).

**Riscos principais**
- **Fundo do tema de navegação (pendência de implementação, não validada):** o `ThemeProvider` usa o `DefaultTheme` do roteador, cujo fundo é cinza `rgb(242, 242, 242)`, diferente do marfim dos tokens. Em transições ou áreas fora do `ThemedView` o cinza pode aparecer. Alinhar o tema de navegação aos tokens ainda não foi feito.
- **Abertura que nunca some:** `hideAsync()` está no `animated-icon.tsx`. Por isso a E1 vem antes da E2.
- **`typedRoutes`:** apagar rotas deixa tipos defasados até o servidor rodar de novo.
- **`app.json`:** mudar abertura, tema e `scheme` pode exigir novo build de desenvolvimento; no Expo Go parte não vale.
- **Web:** remover `react-dom`/`react-native-web` antes do bloco `web` quebra `expo start --web` e pode gerar avisos.
- **Expectativa:** remover `expo-glass-effect` do `package.json` não reduz peso.
- **Ruído no Git:** avisos de fim de linha e `package-lock.json` com muitas linhas.
- **Fora do plano:** arte final de ícone, abertura, ilustrações e ícones.
