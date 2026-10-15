# Decisões técnicas

O que já foi decidido e o que ainda precisa de validação. As decisões técnicas foram delegadas pelo produto e registradas nos ADRs; a implementação deve **validar cada uma contra a documentação vigente** do Supabase e do Expo SDK instalado e, se alguma não se sustentar, reabrir o ADR em vez de contornar.

## Decididas

| Decisão | Registro |
|---|---|
| Stack: React Native, Expo, TypeScript, Expo Router, Supabase, PostgreSQL, Supabase Storage, Git/GitHub | [overview.md](./overview.md) |
| Camadas UI → hooks → serviços → Supabase → PostgreSQL/Storage | [overview.md](./overview.md) |
| MVP online-only, sem offline-first | [ADR 009](../decisions/009-mvp-scope-and-offline.md) |
| Registros explícitos e tipados, sem blocos genéricos | [ADR 010](../decisions/010-explicit-typed-records.md) |
| Identidade = Supabase Auth com e-mail + senha no fluxo Criar/Vincular; sessão persistente; um Laço por identidade | [ADR 015](../decisions/015-identity-and-session.md) |
| Confirmação de e-mail desligada; e-mail já cadastrado vira entrada; "esqueci a senha" nativo; senha mínima de 8 | [ADR 017](../decisions/017-account-and-session-details.md) |
| Palavra-chave: 5 falhas em 10 min → bloqueio de 15 min (IP e identidade), cobrindo Criar e Vincular; só HMAC da forma normalizada | [ADR 018](../decisions/018-keyword-protection-implementation.md) |
| Automação: rotina no PostgreSQL a cada minuto; fuso IANA no Laço; `armado_em` contra loop | [ADR 019](../decisions/019-automation-implementation.md) |
| Foto excluída limpa favorito/destaque; Storage privado; arquivos antes do banco na exclusão | [ADR 020](../decisions/020-photos-and-deletion.md) |
| Nome `Laço`, slug/scheme `laco`, id `com.xrickzin.laco`; domínio em português, técnica em inglês; migrações versionadas | [ADR 021](../decisions/021-naming-and-identifiers.md) |
| Verificação da palavra-chave antes da conta, sem reserva, criação atômica | [ADR 023](../decisions/023-keyword-check-before-account.md) |
| Fluxo de entrada, uso com um membro, configurações e confirmações | [ADR 022](../decisions/022-entry-flow-and-solo-use.md) |
| Direção visual "papel de álbum"; MVP só com tema claro (sem seguir o tema do sistema); iOS e Android, sem web; `react-native-svg` condicional | [ADR 026](../decisions/026-visual-direction-and-platforms.md) |
| Limites do Início, listas completas e Planejamento com data passada | [ADR 027](../decisions/027-home-limits-and-past-planning.md) |
| Segurança de impressão, favorito e isolamento também no backend | [security.md](./security.md) |
| Aplicativo mobile; **sem suporte web** no produto | [mvp.md](../product/mvp.md#mobile) |
| Sem DDL definitivo agora: o mapeamento lógico está em [data-model.md](./data-model.md); o DDL nasce nas migrações | [data-model.md](./data-model.md) |

### Anti-loop da automação
Cada experiência guarda `armado_em`, atualizado a cada edição da referência temporal e a cada transição de estado. A automação só dispara em Planejamento quando o instante de início é maior que `armado_em` e menor ou igual a agora. Cobre decisão manual, retorno de Vivendo, edição para nova data futura e data passada ([ADR 019](../decisions/019-automation-implementation.md); regra de produto em [dates-and-automation.md](../product/dates-and-automation.md#a-automação-não-disputa-a-decisão-do-casal)).

## A validar na implementação

Não são decisões abertas: são premissas a conferir; se falharem, reabrem o ADR indicado.

- Existência e limites da rotina agendada no plano do Supabase usado ([019](../decisions/019-automation-implementation.md)).
- Segredo no servidor para o HMAC da palavra-chave e leitura do IP da requisição nas funções ([018](../decisions/018-keyword-protection-implementation.md)). **Implementado na Fase 1:** segredo em `configuracao_servidor` (gerado na migração) e IP lido dos cabeçalhos da requisição; falta conferir os cabeçalhos num projeto Supabase real ([phase-1-log.md](../development/phase-1-log.md)).
- Armazenamento seguro de sessão no aparelho, com o limite de tamanho de valor ([017](../decisions/017-account-and-session-details.md)). **Implementado na Fase 1:** `expo-secure-store` com a sessão dividida em blocos; não validado em aparelho.
- Formato do "esqueci a senha" (link ou código) e dependência do `scheme` ([017](../decisions/017-account-and-session-details.md)). **Implementado na Fase 1 como link por e-mail (PKCE) e `scheme` `laco`; falta o teste real** ([phase-1-log.md](../development/phase-1-log.md)).
- Remoção de arquivos pela API do Storage ([020](../decisions/020-photos-and-deletion.md)).
- **Barra de navegação com `+` central:** o `NativeTabs` provavelmente não hospeda um botão de ação; se não permitir, usar a solução mais simples que preserve Início, Desejos, `+` e Nossa História, **sem mudar o produto** e apresentando a alternativa antes ([../ux/home-and-navigation.md](../ux/home-and-navigation.md)). **Resolvido na casca visual:** abas JS do Expo Router com botão central ([visual-shell.md](../development/visual-shell.md)); falta validar em aparelho.
- **Copiar/compartilhar o código do casal:** preferir o compartilhamento nativo do sistema (que inclui copiar) a adicionar uma dependência só para a área de transferência.

## Pendências que exigem evidência ou teste (design e dependências)

Detalhe e situação (documentado, verificado em fontes ou dependente de aparelho) em [../ux/proposal/technical-feasibility.md](../ux/proposal/technical-feasibility.md#6-pendências-técnicas-abertas):

1. ~~arquivos estáticos de Fraunces e Figtree e seus tamanhos~~ **resolvido na E10**: 3 arquivos, 153 KB, licença OFL, carregados por `useFonts` (ver [phase-0-log.md](../development/phase-0-log.md)); resta validar em aparelho e decidir os pesos adiados;
2. distinção perceptiva das cores semânticas, com acessibilidade;
3. `@expo/ui` para data e data + horário em iOS e Android;
4. estratégia dos seletores próprios de mês/ano e período;
5. animação do fio com SVG, só se for necessária;
6. remoção do `expo-glass-effect`: sem uso em `src/`, mas o `expo-router` o declara como dependência própria;
7. **alinhar o fundo do tema de navegação aos tokens:** o `ThemeProvider` usa o `DefaultTheme` (fundo cinza `rgb(242, 242, 242)`), não o marfim. Pendência de implementação, não validada.

Plano e registro da Fase 0: [plano](../development/phase-0-plan.md) (E0 a E6 e E13 executadas; E7 a E12 não) e [log](../development/phase-0-log.md).

## Riscos conhecidos do template

- SDK 57, React Native 0.86 e TypeScript 6 são recentes: seguir a documentação da versão instalada.
- Abas nativas (`unstable-native-tabs`) usam API instável.
- `reactCompiler` está ligado (experimental).
- O template habilita web, mas o produto não a suporta no escopo inicial: não criar código específico para web.
- `app.json` já usa `userInterfaceStyle: light` (E5) e `useTheme()` devolve só `Colors.light`; o comportamento em aparelho e no Expo Go ainda não foi validado. `Colors.dark` é legado do template, sem uso no MVP.
- `expo-router` declara `expo-glass-effect`, `@expo/ui` e `expo-symbols` como dependências próprias: removê-los do `package.json` do aplicativo não os tira de `node_modules`.
- **Lint configurado (E13):** `eslint@^9` e `eslint-config-expo@~57.0.2` (modelo oficial, `eslint.config.js`); `expo lint` roda sobre `src/` com **0 erros e 0 avisos**. O `eslint@9.39.5` está marcado como descontinuado pelo ESLint e o ESLint 10 ainda não é aceito pelas peers de `eslint-plugin-import` e `-react`; o parser TypeScript aceita TypeScript `<6.1.0`. O `npm audit` reporta 30 vulnerabilidades (11 moderadas, 19 altas), preexistentes à E13, analisadas e **não corrigidas**: ver [../development/dependency-audit.md](../development/dependency-audit.md). A cadeia `decode-uri-component` / `query-string` / `expo-router` deve ser reavaliada antes de usar parâmetros de URL ou deep links.
- `tsc --noEmit` falhava com 2 erros de importação de CSS (falta do `expo-env.d.ts`); **resolvido na Fase 0 (E2 e E3)**, ver [phase-0-log.md](../development/phase-0-log.md).
