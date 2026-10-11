# 026 — Direção visual, plataformas e elementos gráficos

**Status:** Aceita pelo usuário. Os **valores finais da paleta** e o **identificador do aplicativo** continuam **pendentes**, como descrito abaixo. A proposta completa está em [../ux/proposal/](../ux/proposal/visual-direction.md).

## Contexto
A proposta de Visual Direction e Design System foi avaliada. Esta decisão registra o que foi aprovado e o que continua condicionado a evidências.

## Decisão

**Aprovado**
- **Direção editorial "papel de álbum":** tons neutros quentes, fotografia protagonista e o **fio vermelho** como elemento de conexão da identidade.
- **Fontes Fraunces (títulos) e Figtree (interface)**, **condicionadas** à obtenção dos arquivos estáticos adequados e à validação técnica do carregamento.
- **Direção da paleta** aprovada. Os **valores finais não estão fechados** até verificar a distinção entre marca, aviso, erro e ação destrutiva.
- **MVP só com tema claro.** A estrutura de tokens pode permitir um tema escuro no futuro, mas o aplicativo **não acompanha automaticamente o tema escuro do sistema** no MVP.
- **Plataformas:** iOS e Android priorizados; **web fora do escopo inicial**.
- **`react-native-svg` aprovado condicionalmente**, para laços, curvas e elementos gráficos que justifiquem seu uso. Elementos simples (por exemplo, o fio reto) continuam em soluções mais leves.
- **Nenhuma skill ou ferramenta nova** será instalada neste momento.
- **`expo-glass-effect` pode ser removido na Fase 0**, depois de confirmar que não há uso nem dependência indireta relevante (ver Consequências).

**Continua pendente**
- **`@expo/ui`:** depende de avaliar e testar tecnicamente o seletor temporal nas plataformas-alvo.
- **Identificador do aplicativo `com.xrickzin.laco`:** é **sugestão pendente de confirmação explícita** do usuário. Nenhum arquivo de configuração deve receber esse valor antes disso ([021](./021-naming-and-identifiers.md)).

**Inalterado:** a regra de privacidade da impressão e do momento favorito ([005](./005-memory-and-impressions.md), [012](./012-favorite-moment-and-cover-photo.md)).

## Consequências
- **`expo-glass-effect` e dependências indiretas:** a verificação somente leitura mostrou que **nenhum arquivo de `src/` o usa**, mas que o **`expo-router` 57 o declara como dependência própria** (junto com `@expo/ui` e `expo-symbols`). Remover do `package.json` do aplicativo **não o tira do projeto**: ele continua instalado como dependência transitiva do roteador. Ganho esperado: apenas deixar de declará-lo; peso e módulo nativo permanecem. A remoção é segura em tese, mas de benefício pequeno; a Fase 0 decide com esse dado ([../development/phase-0-plan.md](../development/phase-0-plan.md)).
- **Tema claro:** o `app.json` hoje tem `userInterfaceStyle: automatic`. Seguir a decisão exige trocá-lo por `light` e fazer `useTheme()` usar só os tokens claros: mudança de configuração e de código prevista na Fase 0, **não executada**.
- **Pendências técnicas** (arquivos estáticos das fontes, distinção das cores, `@expo/ui`, seletores próprios, animação do fio, remoção do `expo-glass-effect`): [../ux/proposal/technical-feasibility.md](../ux/proposal/technical-feasibility.md).

## Nota de estado (posterior; não altera a decisão)
O texto acima registra o estado no momento da decisão. Depois dele, na Fase 0 ([phase-0-log.md](../development/phase-0-log.md)): na **E5**, o `app.json` passou a `userInterfaceStyle: light` e `useTheme()` passou a devolver só `Colors.light`; na **E6**, os tokens de cor entraram em `theme.ts` como primeira versão, sujeita à validação visual, e `Colors.dark` ficou como legado do template, sem uso no MVP. O `expo-glass-effect` não foi removido. **Identificador do aplicativo:** o usuário o confirmou explicitamente na **E11** e ele foi aplicado a `android.package` e `ios.bundleIdentifier` (ver [021](./021-naming-and-identifiers.md)); a pendência listada acima ficou resolvida.
