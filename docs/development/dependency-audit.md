# Auditoria de segurança das dependências

Registro técnico único do resultado de `npm audit` no aplicativo (`app/`). **Nada foi corrigido.** Este documento não declara as vulnerabilidades corrigidas, exploradas nem inofensivas: registra o que foi observado, o que não foi verificado e a decisão atual.

## Resumo

- `npm audit` reportou **30 vulnerabilidades: 11 moderadas e 19 altas, nenhuma crítica**, em 875 pacotes.
- Foram reportadas durante a E13 (ESLint) ([phase-0-log.md](./phase-0-log.md)), mas **a mesma contagem (30) aparece no `package-lock.json` anterior à instalação do ESLint** (auditado em cópia temporária). Não há evidência de que a configuração do ESLint as tenha introduzido, e **nenhum dos 57 pacotes da cadeia do ESLint** consta como vulnerável.
- Todos os achados estão na árvore do **Expo e do React Native**. `npm audit --omit=dev` dá o mesmo total, porque `expo` e `react-native` estão em `dependencies`; isso não indica, por si só, que o código vá para o aplicativo.
- Só **4 avisos** são a origem. Os outros 26 itens são propagação pelos pacotes que dependem deles.
- Não houve teste de exploração. Não foi aplicado `npm audit fix` nem `--force`.

## Cadeias identificadas

| Cadeia | Pacote-raiz (instalado) | Aviso | Severidade npm | Caminho até o projeto | Versão corrigida disponível? |
|---|---|---|---|---|---|
| **A** | `braces` 3.0.3 | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): estouro de pilha com padrões muito aninhados; faixa afetada ≤ 3.0.3 | alta | `micromatch` 4.0.8 → `@expo/metro-file-map` → `@expo/cli`, e Metro | Na consulta, a mais recente publicada era 3.0.3, ainda na faixa afetada |
| **B** | `node-forge` 1.4.0 | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv): verificação de assinatura RSA PKCS#1 v1.5 aceita elementos extras; faixa ≤ 1.4.0 | alta | `@expo/cli`, `@expo/code-signing-certificates` | Na consulta, a mais recente publicada era 1.4.0, ainda na faixa afetada |
| **C** | `decode-uri-component` 0.2.2 | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr): negação de serviço por decodificação exponencial de entrada malformada; faixa ≤ 0.4.2 | moderada | `query-string` 7.1.3 → `expo-router` 57.0.24 | Existe a 0.5.0 (só ESM); o `expo-router` 57.0.24 e 57.0.25 declaram `query-string ^7.1.3` |
| **D** | `uuid` 7.0.3 | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq): falta de checagem de limite de buffer em v3/v5/v6 quando `buf` é passado; faixa < 11.1.1 | moderada | `xcode` 3.0.1 (fixa `^7.0.3`) → `@expo/config-plugins` → `expo-splash-screen` | Existem versões ≥ 11.1.1, mas o `xcode` fixa a série 7 |

Os pacotes restantes (`metro*`, `@expo/metro*`, `@react-native/*`, `react-native`, `react-native-reanimated`, `react-native-worklets`, `expo`, `@expo/cli`, `@expo/config*` e outros) aparecem **por propagação** dessas quatro cadeias.

## Relevância prática observada (não é garantia de segurança)

| Cadeia | Onde parece rodar | Observação |
|---|---|---|
| A e B | ferramentas de build e CLI na máquina de desenvolvimento | Exploração exigiria controlar entradas dessas ferramentas. Menor relevância aparente |
| D | plugins de configuração de build | O `xcode` chama apenas `uuid.v4()`, sem `buf` (conferido no código instalado), e o aviso trata de v3/v5/v6 com `buf`. Menor relevância aparente |
| **C** | **código do aplicativo (via `expo-router`)** | A única cadeia que parece ir no pacote do app. Entrada malformada em URLs ou parâmetros poderia travar a decodificação. Hoje há uma só rota e nenhum deep link em uso. O caminho exato de decodificação dentro do `expo-router` não foi rastreado ponto a ponto |

Isso é leitura de títulos, faixas e código local, **não** análise de exploração.

## Decisão atual

1. **Não corrigir as vulnerabilidades neste momento.** Nenhuma dependência foi alterada por causa do audit.
2. **Não executar `npm audit fix` nem `npm audit fix --force`.** As correções automáticas que o npm sugere são trocas amplas e rebaixamentos (por exemplo `expo@44` e `react-native@0.72`) e **não devem ser aceitas**.
3. **Tratar os achados como risco conhecido e monitorado**, não como risco resolvido.
4. **Reavaliar a cadeia C (`decode-uri-component` / `query-string` / `expo-router`) antes de implementar funcionalidades que dependam de parâmetros de URL ou deep links**, incluindo o "esqueci a senha" por link e o uso do `scheme` ([ADR 017](../decisions/017-account-and-session-details.md)).

## Opções a avaliar na reavaliação da cadeia C (nenhuma testada)

- Aguardar uma versão do `expo-router` que atualize ou dispense o `query-string`. A consulta de metadados da versão `next` (SDK 58) não retornou essa dependência; **não confirmado**.
- Usar `overrides` para `decode-uri-component` ≥ 0.5.0. **Compatibilidade pendente**: a versão é só ESM e o `query-string` 7.1.3 a carrega com `require`.
- Limitar na aplicação o tamanho e o formato dos parâmetros recebidos por link.

Atualizar os 5 pacotes do Expo com patch pendente (apontados pelo `expo-doctor`) **não corrige estes avisos**, segundo os metadados consultados.

## Limitações da análise

- Os dados vêm da base de avisos consultada pelo `npm audit` no momento da execução; a severidade é a reportada pelo npm, sem ajuste ao contexto.
- Foram lidos o título, a faixa afetada e a gravidade de cada aviso; não o texto completo nem provas de conceito. Nenhum teste de exploração.
- Só dependências JavaScript. As **dependências nativas de iOS e Android não foram auditadas** separadamente.
- A versão mais recente de cada pacote e as dependências declaradas vêm de consultas de metadados ao registro; a compatibilidade de qualquer correção **não foi testada**.
- A cópia do lockfile anterior foi auditada em pasta temporária fora do projeto.

## Como repetir

Somente leitura, no diretório `app/`: `npm audit`, `npm audit --omit=dev` e `npm ls <pacote> --all`. Repetir depois de cada atualização do SDK do Expo e antes da fase que introduzir links ou parâmetros de URL.

## Relacionados

[phase-0-log.md](./phase-0-log.md) (E13), [technical-decisions.md](../architecture/technical-decisions.md), [roadmap.md](./roadmap.md) (Fase 1).
