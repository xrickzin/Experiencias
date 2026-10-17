# Registro de execução da Fase 0

Registro factual das etapas executadas do [plano](./phase-0-plan.md). Autorização atual: **E0 a E6**. Nada além foi autorizado.

## E0 — Linha de base (antes de qualquer alteração)

| Item | Resultado |
|---|---|
| Git | `HEAD` = `f1a7a91`; mudanças: `app/.claude/settings.json` (staged), `CLAUDE.md` e `docs/` (não versionados). Árvore do aplicativo limpa |
| Ambiente | Node 22.23.2, npm 10.9.8 |
| Hashes (Git) | `package.json` `d728833…`, `package-lock.json` `3dc5bc4…`, `app.json` `2dbe260…` |
| `npx tsc --noEmit` | **2 erros** (os já documentados): `animated-icon.web.tsx(5,21)` TS2307 e `theme.ts(6,8)` TS2882, ambos de importação de CSS |
| `npx expo-doctor` | **20/21 verificações**. Falha: "pacotes com versões diferentes das exigidas pelo SDK" — divergência de **patch** em 5 pacotes: `@expo/ui` 57.0.21 (esperado ~57.0.22), `expo` 57.0.26 (~57.0.27), `expo-constants` 57.0.20 (~57.0.21), `expo-linking` 57.0.11 (~57.0.12), `expo-router` 57.0.24 (~57.0.25). **Preexistente; não será corrigido** (atualizar dependências não está autorizado) |
| `npx expo export --platform ios --platform android` | **Sucesso** (saída em pasta temporária fora do projeto): bundle iOS 3,5 MB e Android 3,7 MB. Gerou só `.expo/dev/logs/export.log` (ignorado pelo Git), removido em seguida. O `tsc` continuou com os mesmos 2 erros: a exportação não gera `expo-env.d.ts` |
| `expo lint` | não executado: o ESLint não está instalado (E13) |
| Abrir em aparelho | **não executado**: não há aparelho nem emulador disponível nesta sessão |

## E1 — Aplicativo mínimo (concluída)

- **Arquivos:** `src/app/_layout.tsx` (Stack sem cabeçalho, `preventAutoHideAsync()` + `SplashScreen.hideAsync()` ao montar, sem `AnimatedSplashOverlay` nem `AppTabs`; ainda com a lógica de tema do sistema, que só sai na E5) e `src/app/index.tsx` (tela mínima com o título "Laço" usando `ThemedView` e `ThemedText`).
- **Validação:** `tsc` com os mesmos 2 erros da linha de base e nenhum novo; `expo export` iOS e Android com sucesso.
- **Não validado:** abrir em aparelho e ver a abertura sumir (sem aparelho). A lógica foi conferida por leitura.

## E2 — Remoção da demonstração (concluída)

- **Removidos:** `explore.tsx`; `animated-icon.tsx`, `animated-icon.web.tsx`, `animated-icon.module.css`; `hint-row.tsx`, `web-badge.tsx`, `ui/collapsible.tsx` (e a pasta `ui/`), `external-link.tsx`, `app-tabs.web.tsx`; 8 imagens da demonstração.
- **Verificação prévia:** busca de referências em `src/`, `app.json`, `package.json`, `README.md`, `AGENTS.md` e `tsconfig.json`: nenhuma fora dos próprios arquivos removidos, exceto o texto `explore` em `app-tabs.tsx`.
- **Validação:** `tsc` caiu para 1 erro (o de `global.css`, previsto para a E3); `expo export` com sucesso; bundles menores (Android 3,7 → 2,7 MB; iOS 3,5 → 2,3 MB).
- **Desvio a registrar:** `app-tabs.tsx` (mantido por dúvida e sem uso) ainda declara um gatilho para a rota `explore`, que não existe mais. Não quebra nada enquanto o componente não for usado.

## E3 — Resíduos de web e CSS (concluída)

- **Removidos:** `src/global.css`, `src/hooks/use-color-scheme.web.ts`. **Editado:** `src/constants/theme.ts` (sem `import '@/global.css'` e sem a entrada `web` de `Fonts`; `Fonts.mono` segue disponível para o `ThemedText`).
- **Verificação prévia:** nenhuma outra referência a `.css`, `.web` ou `var(--…)` em `src/`, `app.json` e `tsconfig.json`.
- **Validação:** `tsc --noEmit` **sem nenhum erro** (os dois da linha de base resolvidos pela limpeza, sem gerar `expo-env.d.ts`); `expo export` com sucesso.

## E4 — Higiene do repositório (concluída)

- **Removidos:** `scripts/reset-project.js` (e a pasta `scripts/`, vazia); script `reset-project` do `package.json`. **`desktop.ini`:** saiu do índice do Git (`git rm --cached`, **fica em staging**, o arquivo continua no disco) e foi para o `.gitignore`. **`README.md`:** reduzido a descrição, como rodar e como verificar.
- **Validação:** nenhuma referência restante a `reset-project`; `package.json` válido, scripts `start, android, ios, web, lint`; **dependências inalteradas** (23 + 2); hashes de `package-lock.json` e `app.json` iguais aos da E0 naquele ponto.

## E5 — Tema claro fixo (concluída)

- **Arquivos:** `app.json` (`userInterfaceStyle`: `automatic` → `light`, única linha alterada), `src/hooks/use-theme.ts` (devolve `Colors.light`), `src/app/_layout.tsx` (`DefaultTheme`, sem `useColorScheme`), `src/hooks/use-color-scheme.ts` removido (sem usos).
- **Sem antecipar tokens:** nenhum valor de cor foi tocado; `Colors.dark` permanece; a cor fixa `#3c87f7` em `themed-text.tsx` continua (é escopo da E6).
- **Validação:** `tsc` sem erros; `expo export` com sucesso; `expo-doctor` igual à linha de base (20/21, os mesmos 5 patches); `package-lock.json` inalterado.
- **Não validado:** aparelho com tema escuro do sistema (sem aparelho). Comportamento da configuração no Expo Go segue **não verificado** (a documentação consultada não o cobre; em builds Android de desenvolvimento o guia exige `expo-system-ui`, que já está instalado).
- **Dormente:** `app-tabs.tsx` (mantido) ainda lê o tema do sistema; não é usado.

## E6 — Tokens de cor, versão mínima (concluída)

Autorizada com as decisões do usuário: valores propostos como **primeira versão implementada**, ainda sujeitos à validação visual; sem `Radius`, `Motion` nem `TextStyles`.

- **Arquivos:** `src/constants/theme.ts` e `src/components/themed-text.tsx`.
- **Chaves existentes (claro):** `text` `#2B2724`, `background` `#FAF6EE`, `backgroundElement` `#F2ECE0`, `backgroundSelected` `#E8E0D1`, `textSecondary` `#6A6258`.
- **Chaves novas (claro):** `border` `#D9CFBD`, `outline` `#8A806F`, `accent` `#B3242B`, `accentStrong` `#8E1A21`, `accentSoft` `#D38283`, `warning` `#8A5410`, `error` `#A3361C`, `destructive` `#A3361C`, `focus` `#2B2724`. Cada uma com comentário de finalidade; o carmim documentado como nunca sendo erro, ação destrutiva ou botão; erro, destrutivo e aviso documentados como nunca comunicados só pela cor (ícone e mensagem obrigatórios). A regra de acessibilidade já constava nos documentos da proposta, então nenhuma documentação nova foi necessária.
- **`Colors.dark` e tipagem:** consumidores conferidos antes: `Colors` é lido por `use-theme.ts` (só o claro) e por `app-tabs.tsx` (mantido, sem uso; lê `text`, `background` e `backgroundElement`); `ThemeColor` é usado por `themed-text.tsx` e `themed-view.tsx`. Menor mudança: `ThemeColor = keyof typeof Colors.light` (sem interseção com o escuro) e **`Colors.dark` mantido sem alteração**, com comentário de legado do template. Nenhum valor escuro fictício foi criado e o `app-tabs.tsx` não foi tocado.
- **Link:** `linkPrimary` perdeu o azul fixo `#3c87f7` e ganhou `textDecorationLine: 'underline'`; a cor passa a ser a do texto (grafite, 13,73 : 1 sobre o fundo). As demais variantes não mudaram.
- **Validação:** `tsc --noEmit` sem erros; `expo export` iOS (2,3 MB) e Android (2,7 MB) com sucesso; nenhum hexadecimal fora de `theme.ts`; `package.json`, `package-lock.json` e `app.json` com hashes iguais aos de antes da etapa; staging inalterado (só `settings.json` e `desktop.ini`).
- **Não validado:** aparência em aparelho; validação visual das cores (inclui a proximidade carmim, ferrugem e âmbar, já registrada como pendência); cor do link em uso real (a variante `linkPrimary` não é usada hoje).
- **Desvios:** nenhum. Fora do escopo e intocados: `Radius`, `Motion`, `TextStyles`, fontes, ícone, abertura, `@expo/ui`, rotas, `app.json`, ADRs.

## E13 — ESLint (concluída; lint sem avisos nem erros)

Autorizada separadamente (fora da sequência E0 a E6), com limites: sem `--fix`, sem supressões, sem alterar código-fonte, sem Prettier nem plugins adicionais, sem `--max-warnings=0` como critério na primeira rodada.

- **Instalação:** pela integração oficial, `CI=1 npx expo lint`. A CLI instalou `eslint@^9.0.0` e `eslint-config-expo@~57.0.2` como devDependencies via npm ("added 232 packages"). Versões resolvidas: `eslint` 9.39.5, `eslint-config-expo` 57.0.2, `@typescript-eslint/parser` 8.71.1, `eslint-plugin-react-hooks` 7.1.1.
- **Arquivos:** novo `eslint.config.js` (modelo oficial do Expo: `defineConfig([expoConfig, { ignores: ["dist/*"] }])`, com `eslint-config-expo/flat`); `package.json` (+2 devDependencies); `package-lock.json` (258 entradas novas, 1 alterada = a raiz, 0 removidas; `dependencies` de runtime idênticas). O script `lint` (`expo lint`), `tsconfig.json` e `app.json` não mudaram (hashes iguais aos de antes).
- **Cobertura:** o `expo lint` analisa `src/` (diretórios padrão `src`, `app`, `components`; só `src` existe). Conferido com `eslint src --format json` (somente leitura): **7 arquivos**, todos os de `src/` (`app/_layout.tsx`, `app/index.tsx`, `components/app-tabs.tsx`, `themed-text.tsx`, `themed-view.tsx`, `constants/theme.ts`, `hooks/use-theme.ts`). Não há lacuna de código do aplicativo; `eslint.config.js` e arquivos de configuração não são analisados por padrão.
- **Resultado do lint (primeira rodada, linha de base):** **0 erros e 0 avisos em todos os 7 arquivos.** `npx expo lint` terminou com saída 0 e sem mensagens.
- **Configuração efetiva** (`npx eslint --print-config src/app/index.tsx`, saída 0): parser `@typescript-eslint/parser` 8.71.1; 83 regras; `react-hooks/rules-of-hooks` erro; `react-hooks/exhaustive-deps` aviso; `import/no-unresolved` erro (resolvedor TypeScript ativo, o alias `@/` resolve sem erros); `@typescript-eslint/no-unused-vars` aviso; `@typescript-eslint/no-require-imports` aviso com exceção para imagens e outros ativos; `expo/no-env-var-destructuring` erro.
- **Demais validações:** `tsc --noEmit` sem erros; `npm ls eslint eslint-config-expo` mostra `eslint@9.39.5` e `eslint-config-expo@57.0.2`; `expo-doctor` 20/21, os mesmos 5 patches da linha de base; `expo export` iOS (2,3 MB) e Android (2,7 MB) com sucesso.
- **Observações, sem ação nesta etapa:**
  - a instalação avisou que `eslint@9.39.5` está **descontinuado** ("no longer supported"); a CLI do Expo fixa `^9` e as peers de `eslint-plugin-import` e `eslint-plugin-react` não declaram o ESLint 10, então a atualização fica para quando o Expo a suportar;
  - o `npm install` informou **30 vulnerabilidades (11 moderadas, 19 altas)** na árvore de 840 pacotes; **foram analisadas depois, sem correção**: ver [dependency-audit.md](./dependency-audit.md);
  - o `expo export` voltou a criar `expo-env.d.ts` (ignorado pelo Git), que foi removido; o `tsc` passa com e sem ele;
  - o parser TypeScript aceita TypeScript `<6.1.0`; o projeto está em 6.0.3.
- **Não executado de propósito:** `npx expo lint --max-warnings=0` (a linha de base real agora é conhecida: zero avisos); nenhuma correção, supressão ou `--fix`; nenhum código-fonte alterado.

## Auditoria de segurança das dependências (pós-E13; sem correção)

Diagnóstico somente leitura dos 30 avisos do `npm audit` (11 moderados, 19 altos, nenhum crítico). Resultado, cadeias, limitações e decisão estão em [dependency-audit.md](./dependency-audit.md); aqui fica só o registro de execução.

- **Preexistentes:** a mesma contagem aparece no lockfile anterior à E13; nenhum pacote da cadeia do ESLint consta como vulnerável.
- **Decisão:** nenhuma correção aplicada; `npm audit fix` e `--force` não devem ser usados; a cadeia `decode-uri-component` / `query-string` / `expo-router` será reavaliada antes de funcionalidades com parâmetros de URL ou deep links.
- **Não feito:** teste de exploração; auditoria das dependências nativas de iOS e Android.
- Nenhum arquivo do aplicativo, dependência ou lockfile foi alterado.

## E10 — Fontes tipográficas (concluída; sem validação em aparelho)

Autorizada separadamente. Fraunces (títulos e momentos editoriais) e Figtree (interface), com arquivos estáticos e carregamento por `useFonts`.

- **Origem dos arquivos:** pacotes `@expo-google-fonts/fraunces` e `@expo-google-fonts/figtree` 0.4.1, baixados como tarball (`npm pack`) **para uma pasta temporária fora do projeto**, sem instalá-los como dependência. Eles empacotam os arquivos estáticos do Google Fonts (Fraunces v38 e Figtree v9, ambos de setembro de 2025, segundo o `metadata.json` dos pacotes). O pacote em si é MIT; **as fontes são SIL Open Font License 1.1**.
- **Incluídos** em `app/assets/fonts/` (153 012 bytes no total), copiados sem modificação (conferidos byte a byte contra o pacote):

| Arquivo | Peso | Tamanho | Uso atual |
|---|---|---|---|
| `Fraunces-SemiBold.ttf` | 600 | 72 504 B | `ThemedText` `title` e `subtitle` (a tela inicial exibe "Laço" em `title`) |
| `Figtree-Medium.ttf` | 500 | 40 148 B | `ThemedText` `default`, `small`, `link`, `linkPrimary` |
| `Figtree-SemiBold.ttf` | 600 | 40 360 B | `ThemedText` `smallBold` |
| `OFL-Fraunces.txt`, `OFL-Figtree.txt` | — | 4,4 KB cada | texto integral da licença, com os avisos de copyright (2018 The Fraunces Project Authors; 2022 The Figtree Project Authors) |

- **Verificações dos arquivos:** estáticos (sem tabela de variação `fvar`); mapa de caracteres com 624 glifos (Fraunces) e 391 (Figtree); todos os caracteres do teste em português (ç, ã, õ, acentos, maiúsculas acentuadas, aspas e travessões) presentes.
- **Pesos deliberadamente não incluídos (sem uso ainda):** Figtree Regular 400 e Fraunces Itálico 400 (a "voz" das impressões), previstos na proposta de estilos de texto.
- **Carregamento:** `src/app/_layout.tsx` usa `useFonts` do `expo-font` (já instalado; o plugin de build não vale no Expo Go). A abertura continua retida e só é escondida quando as fontes carregam **ou falham**; enquanto isso a raiz não renderiza nada, então não há troca brusca de tipografia. Em caso de erro o app abre e o sistema usa a fonte padrão.
- **Como referenciar:** `FontFamily` em `src/constants/theme.ts` (`display`, `body`, `bodyStrong`) é a única fonte dos nomes; o `_layout.tsx` associa cada nome ao arquivo. No SDK 57 cada peso é uma família própria (o mapeamento por `fontWeight` dentro de uma família é do SDK 58), então os estilos usam `fontFamily` e **não** `fontWeight`.
- **`ThemedText`:** `title`/`subtitle` → Fraunces SemiBold; `default`/`small`/`link`/`linkPrimary` → Figtree Medium; `smallBold` → Figtree SemiBold (era peso 700; agora 600). `code` continua com a fonte monoespaçada do sistema. Tamanhos e entrelinhas não mudaram; `fontWeight` foi removido desses estilos.
- **Validação:** `tsc --noEmit` sem erros; `expo lint` saída 0 e `eslint src`: 0 erros e 0 avisos nos 7 arquivos; `expo-doctor` 20/21, os mesmos 5 patches da linha de base; `expo export` iOS (2,4 MB) e Android (2,7 MB) com sucesso, com os 3 arquivos presentes nos ativos exportados; `package.json`, `package-lock.json`, `app.json`, `tsconfig.json` e `eslint.config.js` com hashes iguais aos de antes.
- **Observação:** o export de Android já incluía, na linha de base, um `.ttf` de ícones (`MaterialSymbols_400Regular.ttf`, 967 KB) vindo de `@expo/ui` por meio do `expo-router`; não tem relação com a E10.
- **Não validado:** abrir no Expo Go ou em aparelho (sem aparelho): carregamento real das fontes, aparência da tipografia e da abertura. Também não foi avaliado o tempo até a primeira tela.
- **Pendências:** o corpo de texto da proposta é Regular 400 e o `ThemedText` atual usa 500; a escala `TextStyles` (e os dois pesos adiados) fica para quando houver uso; as instâncias estáticas do Fraunces são as do Google Fonts (tamanho óptico padrão), e o resultado visual ainda precisa de avaliação; no SDK 58 as fontes variáveis passam a ser suportadas.

## E11 — Identidade do aplicativo (concluída; sem build nativo nem aparelho)

Autorizada separadamente, com o id `com.xrickzin.laco` confirmado pelo usuário no comando.

- **Alterado:** `app.json` ganhou `ios.bundleIdentifier` e `android.package`, ambos `com.xrickzin.laco`. Nada mais.
- **Antes:** nenhum dos dois campos existia; não havia credenciais, integrações nem `eas.json` que usassem identificador.
- **Preservado:** `name`, `slug` e `scheme` continuam `app`, como pedido (não alterar sem autorização específica). **Consequência: o nome exibido do aplicativo ainda é `app`, não `Laço`.** Trocar `name` (e `slug`/`scheme`, previstos como `laco` no ADR 021) fica pendente de decisão.
- **Validação:** `tsc --noEmit` e `expo lint` saída 0; `expo-doctor` 20/21 (os mesmos 5 patches de antes); `expo config --type public` mostra `ios.bundleIdentifier` e `android.package` = `com.xrickzin.laco`. Sem build, credenciais nem publicação; sem validação em aparelho.

### E11, segunda execução: nome, `slug` e `scheme`

Autorizada separadamente, depois da primeira execução acima (que ficou só com os identificadores; os itens "Preservado" e "Consequência" daquela execução valeram até aqui).

- **Alterado em `app.json`:** `name` `app` → `Laço`; `slug` `app` → `laco`; `scheme` `app` → `laco`. Identificadores nativos mantidos.
- **Inspeção antes de alterar:** nenhum uso de `scheme`, `slug`, `Linking`, `makeRedirectUri`, redirecionamento de autenticação ou deep link em `src/`; sem `eas.json`, `app.config.*` ou credenciais. As ocorrências de `scheme` em `src/` são do `useColorScheme`. O `name` `app` de `package.json` não é configuração de identidade do app e **não foi alterado** (não autorizado).
- **Efeito:** o nome exibido passa a ser `Laço`. O `scheme` só vale em build de desenvolvimento ou de produção; no Expo Go o esquema continua `exp://`.
- **Documentação:** ADR 021 e 026 receberam notas de estado (sem reescrever o texto original), além do plano, deste log, do roadmap e do `CLAUDE.md`; a linha desalinhada da tabela "Executado × pendente" do plano foi corrigida.
- **Validação:** `tsc`, `lint`, `expo-doctor` (20/21, os mesmos 5 patches) e `expo config --type public` com os cinco valores esperados. **Não houve** build nativo nem teste em aparelho.

## E8 — Configuração web removida (concluída; sem build nativo nem aparelho)

Autorizada separadamente.

- **Removido de `app.json`:** o bloco `web` inteiro (`output: "static"` e `favicon: "./assets/images/favicon.png"`). **Removido de `package.json`:** o script `"web": "expo start --web"`. O arquivo `assets/images/favicon.png` **não** foi apagado (só deixou de ser referenciado).
- **Inspeção:** nenhuma outra referência a esses campos ou a `expo start --web` em arquivos de configuração ou código; sem integração web fora do plano. Identidade conferida antes e depois: `name` `Laço`, `slug` e `scheme` `laco`, ids `com.xrickzin.laco`.
- **Mantido:** `react-dom`, `react-native-web` e todas as demais dependências instalados, aguardando a E12; nada mais foi alterado.
- **Validação:** `tsc --noEmit` e `expo lint` saída 0; `expo-doctor` 20/21, os mesmos 5 patches da linha de base; `expo config --type public` com os cinco valores e sem `web`; `expo export` para iOS e Android com sucesso; `npm run` não lista mais `web`. Sem build nativo nem aparelho.

## E12.1 — `expo-device` removido (E12 parcial; sem build nativo nem aparelho)

Autorizada separadamente; cobre só o `expo-device`. A E12 continua pendente para `expo-web-browser`, `react-native-web` e `react-dom`.

- **Evidências de desuso:** nenhuma referência em `src/`, `app.json`, `eslint.config.js` nem `tsconfig.json` (não é plugin de configuração); no `package-lock.json` só o declarante raiz e a própria entrada; nenhum outro pacote em `node_modules` o declara como dependência ou *peer* nem o importa; `npm ls` o mostrava apenas como dependência direta.
- **Comando:** `npm uninstall expo-device`. **Alterados:** `package.json` (uma linha) e `package-lock.json` (o pacote e o `ua-parser-js` 0.7.41, que só ele trazia). O `ua-parser-js` 1.0.41, vindo de `react-native-web` → `fbjs`, permanece.
- **Validação (códigos de saída reais):** `tsc` 0; `expo lint` 0; `expo-doctor` saída 1 como na linha de base (20/21, os mesmos 5 patches); `expo export` iOS e Android 0; `npm ls expo-device` saída 1 com árvore vazia (pacote ausente, como esperado); `npm ls` da árvore 0.
- **Não executado:** build nativo e aparelho; `npm audit` não foi reexecutado.

## E12.2 — `expo-web-browser` removido (E12 parcial; sem build nativo nem aparelho)

Autorizada separadamente; cobre só o `expo-web-browser`. A E12 continua pendente para `react-native-web` e `react-dom`.

- **Evidências de desuso:** nenhuma referência (`expo-web-browser`, `WebBrowser`, `maybeCompleteAuthSession`, `openAuthSessionAsync`, `openBrowserAsync`) em `src/`, `app.json`, `eslint.config.js` nem `tsconfig.json`; sem fluxo de autenticação externa (o login do Laço é e-mail e senha). No `package-lock.json` só o declarante raiz e a própria entrada, que tem apenas *peers* (`expo`, `react-native`). Nenhum outro pacote em `node_modules` o declara ou importa; a única menção fora dele é a lista de versões `bundledNativeModules.json` do `expo`, que não é dependência. A ausência de suporte web, sozinha, não foi usada como prova.
- **Comando:** `npm uninstall expo-web-browser`. **Alterados:** `package.json` (uma linha) e `package-lock.json` (a entrada do pacote e a declaração raiz); nenhuma outra dependência mudou.
- **Validação (códigos de saída reais):** `tsc` 0; `expo lint` 0; `expo-doctor` saída 1 com o mesmo resultado da linha de base (20/21, os mesmos 5 patches, sem aviso novo); `expo export` iOS e Android 0; `npm ls expo-web-browser` saída 1 com árvore vazia (pacote ausente); `npm ls` da árvore 0, sem itens inválidos, ausentes ou extras.
- **Se um login externo vier a existir,** o pacote pode ser reinstalado nesse momento (nota da tabela de dependências do plano).
- **Não executado:** build nativo e aparelho; `npm audit` não foi reexecutado.

## E12.3 — `react-native-web` e `react-dom`: avaliada, não removida

Autorizada separadamente. **Nada foi removido; `package.json` e `package-lock.json` voltaram ao estado anterior.** A E12 continua parcial.

- **Uso direto:** nenhum. Não há import nem referência em `src/`, `app.json`, `eslint.config.js` nem `tsconfig.json`, e a E8 já tirou a configuração web.
- **Por que a remoção não surte efeito:** o npm manteve os dois pacotes instalados depois de `npm uninstall react-native-web react-dom`. Só saíram as duas linhas de `dependencies`; no lockfile os pacotes receberam as marcas `optional` e `peer`, e `ua-parser-js` 1.0.41, `fbjs` e as demais transitivas de `react-native-web` **continuaram instaladas** (nenhuma entrada do lockfile foi removida).
- **Quem os exige:** `react-dom` é *peer* obrigatório (não opcional) de pacotes que o `@expo/ui` (via `vaul` e `@radix-ui/*`) e o `expo-router` (via `@radix-ui/react-tabs` e afins) trazem como dependência; é *peer* opcional de `expo`, `expo-router`, `@expo/ui`, `@expo/metro-runtime` e `@expo/router-server`. `react-native-web` é *peer* opcional de `expo`, `expo-router`, `expo-image` e `expo-system-ui`, e exige `react-dom`.
- **Conclusão:** remover só as declarações deixaria a árvore igual, dependente da instalação automática de *peers* pelo npm, sem o ganho que a etapa buscava. Para tirá-los de fato seria preciso remover ou substituir o `@expo/ui`, ou o `expo-router`, ou aceitar um estado frágil; isso exige decisão sua, junto com a pendência do `@expo/ui` e do `expo-glass-effect`.
- **Código de saída das verificações após a restauração:** `npm ls` 0; `tsc` 0. O `package.json` e o `package-lock.json` foram comparados byte a byte com os backups feitos antes do comando.

## E7 — `expo-glass-effect` removido das dependências diretas (2026-10-16; sem build nativo nem aparelho)

Autorizada pelo usuário, sabendo que o `expo-router` também depende do pacote.

- **Uso direto:** nenhum em `src/`, `app.json`, `eslint.config.js` nem `tsconfig.json`.
- **Comando:** `npm uninstall expo-glass-effect`. **Alterados:** `package.json` e `package-lock.json` (uma linha cada: a declaração raiz).
- **Efeito real:** o pacote **continua instalado**, porque o `expo-router` 57 o declara como dependência normal, não como *peer*. Agora `npm ls expo-glass-effect` o mostra só sob `expo-router`. A instalação dele não depende da instalação automática de *peers*, então o estado não fica frágil, ao contrário do caso da E12.3.
- **Validação (códigos de saída reais):**
  - `tsc` 0; `expo lint` 0;
  - `npm test`: 17 arquivos, 242 testes;
  - `npm ls` 0;
  - `expo export` Android e iOS 0;
  - `expo-doctor` saída 1, com a saída idêntica antes e depois da remoção.
- **Linha de base do `expo-doctor` mudou (não por causa da E7):** agora são 19/21.
  - Patches desatualizados: `@expo/ui`, `expo`, `expo-constants`, `expo-linking` e `expo-router`.
  - Erro novo de esquema: `ios.icon` aponta para `./assets/expo.icon`, que é uma **pasta** (formato do Icon Composer, vinda do template), e o validador do Windows a rejeita como arquivo. Provavelmente veio com uma versão mais nova do `expo-doctor` baixada pelo `npx`. Fica para a E9, que troca o ícone.
- **Não executado:** build nativo e aparelho.

## E12 — encerrada sem remover `react-native-web` e `react-dom` (2026-10-16)

Decisão do usuário, com base na avaliação da E12.3: o `expo-router` traz pacotes que exigem o `react-dom` como *peer* obrigatório, e o npm reinstala os dois automaticamente. Tirar só as declarações deixaria o projeto dependendo dessa instalação automática, sem nenhum ganho; tirá-los de fato exigiria abandonar o `expo-router`. Os dois ficam declarados como estão. A E12 está **concluída**, com a remoção de `expo-device` (E12.1) e de `expo-web-browser` (E12.2).

## Atualização de patches do SDK 57 (2026-10-16; fora das etapas, a pedido do usuário)

- **Comando:** `npx expo install --fix`, que usa as versões que o SDK indica. O `npm audit fix` sugerido pelo npm **não** foi executado.
- **Versões:**

  | Pacote | Antes | Depois |
  |---|---|---|
  | `@expo/ui` | 57.0.21 | 57.0.25 |
  | `expo` | 57.0.26 | 57.0.30 |
  | `expo-linking` | 57.0.11 | 57.0.13 |
  | `expo-router` | 57.0.24 | 57.0.28 |
  | `expo-splash-screen` | 57.0.9 | 57.0.10 |
  | `expo-constants` (transitiva, por meio de `expo`) | 57.0.20 | 57.0.22 |

- **Validação:**
  - `expo install --check`: "Dependencies are up to date";
  - `tsc` 0; `expo lint` 0;
  - `npm test`: 17 arquivos, 242 testes;
  - `npm ls` 0;
  - `expo export` Android e iOS 0;
  - `expo-doctor` 20/21. A única falha é o `ios.icon` em `./assets/expo.icon`, que fica para a E9 (ver E7).
- **No aparelho:** validado pelo usuário no Expo Go (Android), com cache limpo.

## E9 — ícone, ícone adaptativo e abertura (2026-10-16)

- **Arte:** entregue pelo usuário em `app/assets/images/icone-laco-original.png`: PNG de 2000×2000, fundo vinho sólido `#670C19` (medido), com casa, casal e laço em infinito. O desenho ocupa só o centro-alto da imagem.
- **Escolhas do usuário, vendo as prévias:**
  - ícone: o recorte mais fechado, com o casal e o laço grandes e a casa inteira;
  - abertura: o desenho inteiro sobre o vinho;
  - monocromático: uma silhueta do laço com a casa.
- **Gerador:** `app/scripts/gerar-icones.py`, que usa o Pillow da máquina e não é dependência do app. Ele recentraliza e recorta a arte, sem redesenhá-la:
  - `icon.png` (1024): o recorte do ícone, de borda a borda;
  - `android-icon-foreground.png` (1024): a arte estendida em volta, para o miolo que o aparelho mostra (72 de 108 dp) ser exatamente o recorte do ícone;
  - `android-icon-background.png`: o vinho sólido;
  - `android-icon-monochrome.png`: a silhueta autoral (telhado, paredes, janela 2×2 e o infinito por cima das paredes), branca sobre transparente, dentro da zona segura;
  - `splash-icon.png`: o desenho inteiro, com a borda do recorte esfumada. Ocupa 60% da imagem, o máximo que cabe sem corte no círculo de 160 dp em que o Android 12+ mostra a abertura.
- **`app.json`:**
  - `#208AEF` (abertura) e `#E6F4FE` (fundo do adaptativo) viraram `#670C19`;
  - `imageWidth` da abertura passou de 76 para 240;
  - `ios.icon` passou a ser `./assets/images/icon.png`, e a pasta `assets/expo.icon` do template foi removida.
- **Validação:**
  - `expo-doctor` 21/21 (antes 20/21: a falha era o `ios.icon` em pasta);
  - prévias com as máscaras reais (círculo, gota, quadrado arredondado), nos tamanhos de 96, 72 e 48 px.
  - **No aparelho:** o Expo Go mostra o ícone e a abertura dele, então a conferência fica para o primeiro APK.

## Resumo

E0 a E6 executadas sem condição de parada. Nada foi instalado, removido ou atualizado em dependências; ícone, abertura e bloco `web` intactos (`name`, `slug` e `scheme` mudaram depois, na E11); nenhum ADR alterado; nenhum commit. **E7 em diante (exceto a E8, a E10, a E11 e a E13, executadas à parte) aguarda nova autorização.**
