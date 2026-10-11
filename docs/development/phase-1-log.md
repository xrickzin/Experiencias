# Fase 1: onboarding, autenticação e vínculo (log)

Registro do que foi implementado e do que depende de configuração externa. Decisões: [ADR 011](../decisions/011-couple-linking.md), [015](../decisions/015-identity-and-session.md), [016](../decisions/016-keyword-abuse-protection.md), [017](../decisions/017-account-and-session-details.md), [018](../decisions/018-keyword-protection-implementation.md), [022](../decisions/022-entry-flow-and-solo-use.md), [023](../decisions/023-keyword-check-before-account.md), [024](../decisions/024-email-first-entry.md). UX: [onboarding.md](../ux/onboarding.md).

> **Estado:** código e migração prontos; **nenhuma chamada a um projeto Supabase real foi feita** e **nada foi aberto em Expo Go ou aparelho**. A integração só está concluída quando o projeto externo estiver configurado (seção "Configuração externa") e os fluxos forem percorridos nele.

## O que foi implementado

**Banco** (`supabase/migrations/20261010120000_fase1_laco_membros_vinculo.sql`)
- Tabelas `lacos` (só o HMAC da palavra, fuso, nome provisório da outra pessoa), `membros` (identidade única, nome editável pela própria pessoa), `tentativas_vinculo`, `bloqueios_vinculo` e `configuracao_servidor` (segredo do HMAC e limites, gerados e guardados no banco, fora do repositório).
- RLS ligada em tudo. O cliente lê só o próprio Laço (sem a coluna do HMAC) e os membros dele, e só atualiza `membros.nome` do próprio registro. Escritas em `lacos` e `membros`, tentativas, bloqueios e configuração não são possíveis pelo cliente.
- Funções (todas `security definer`, `search_path` vazio, sem execução para `PUBLIC`): `verificar_email` e `palavra_disponivel` e `verificar_palavra_vinculo` (sem sessão, por IP), `criar_laco` e `vincular_laco` (com sessão, por IP e identidade), `meu_perfil`. Erros esperados voltam como `{ok:false, codigo}`, não como exceção, para o registro das falhas ser gravado.
- Gatilho que impede mais de dois membros por Laço, mesmo fora das funções.
- Limite (ADR 018): 5 falhas em 10 minutos geram bloqueio de 15 minutos, por IP e por identidade, com o mesmo contador para criar e vincular. A consulta de e-mail tem contador próprio (20 consultas em 10 minutos). Valores em `configuracao_servidor`.

**Aplicativo**
- Dependências novas: `@supabase/supabase-js`, `expo-secure-store` (sessão no armazenamento seguro, em blocos de 1500 caracteres por causa do limite de valor). Sem biblioteca de estado global; o estado de sessão é um contexto (`src/hooks/use-sessao.tsx`).
- Serviços: `src/services/supabase.ts` (cliente; sem chave configurada o app mostra uma tela de aviso), `laco.ts` (chamadas e mensagens), `validacao.ts`.
- Rotas: `src/app/entrada/` (`index`, `criar-laco`, `entrar`, `continuar`) e `src/app/ajustes.tsx`. A navegação usa `Stack.Protected`: sem Laço (ou com a tela de onboarding segurando a pessoa) só `entrada` existe; com Laço, as abas, `criar` e `ajustes`.
- Fluxos: **criar** (nome → outra pessoa → código → e-mail e senha com confirmação → código mostrado uma vez, com "Copiar ou compartilhar" pela folha do sistema) e **entrar** (e-mail → se cadastrado: senha; se novo: código → senha com confirmação → confirmação do vínculo). Conta existente sem Laço cai em `continuar` (criar ou informar o código). Sessão válida abre direto em Início.
- Início mostra "Nome & Nome" (ou o aviso de que a outra pessoa ainda não entrou) e um acesso a Ajustes (editar o próprio nome e sair da conta).
- Componentes novos: `mensagem-erro`, `tela-aviso`, `vinculo-confirmado`; `button` ganhou `loading` e a variante `text`; `text-field` ganhou uma ação ao lado do rótulo (mostrar/ocultar senha).
- Os desejos de [visual-shell.md](./visual-shell.md) continuam locais e temporários; nenhum dado de experiência foi ligado ao Supabase.

## Decisões técnicas desta fase

- **Ordem do fluxo de entrada:** segue o ADR 024. E-mail já cadastrado pede só a senha e **não** o código; o código só é pedido a e-mail novo ou a conta sem Laço. (O pedido da fase falava em concluir o vínculo com a palavra-chave para identidade existente; isso só ocorre quando ela ainda não tem Laço.)
- **Nome de quem entra:** não é digitado; vem do que quem criou informou (ADR 022 e UX), e pode ser editado em Ajustes.
- **Tamanho mínimo do código:** 4 caracteres e máximo de 60, como decisão técnica de segurança (o produto não define). Fica em `configuracao_servidor` e em `validacao.ts`; precisam andar juntos.
- **Segredo do HMAC:** tabela `configuracao_servidor`, gerada na migração, em vez do Vault.
- **IP:** `cf-connecting-ip`, depois `x-real-ip`, depois o primeiro `x-forwarded-for`; sem cabeçalho todos caem na mesma chave (mais severo, nunca mais frouxo).
- **Copiar:** a folha de compartilhamento do sistema, como previsto em [technical-decisions.md](../architecture/technical-decisions.md#a-validar-na-implementação), sem `expo-clipboard`.
- Erro de rede em qualquer chamada mostra uma mensagem própria; a interface nunca indica salvo o que não foi gravado.

## Validação

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | saída 0 |
| `npx expo lint` | saída 0 |
| `npx expo export --platform android` e `--platform ios` | saída 0 nos dois |
| `npx expo-doctor` | saída 1, 20/21: os mesmos 5 patches da linha de base, sem aviso novo |
| `supabase/tests/vinculo.mjs` (Postgres real via PGlite, ambiente que **imita** o Supabase) | todos passaram: criação, palavra em uso (com acento e espaços), um Laço por identidade, Laço órfão inexistente, resposta genérica na vinculação (inexistente = Laço completo), terceiro membro bloqueado, RLS (leitura só do próprio Laço, sem `palavra_hmac`, sem acesso a configuração, tentativas e bloqueios), edição só do próprio nome, bloqueio por IP e por identidade, expiração do bloqueio, contador de e-mail separado |

**Não validado:** a migração não foi aplicada num Supabase de verdade (sem CLI, Docker nem projeto aqui; o PGlite não reproduz o gateway, o PostgREST, o `auth.uid()` real nem os cabeçalhos reais); `signUp`/`signInWithPassword` reais; o armazenamento da sessão no aparelho; o comportamento do `Stack.Protected` ao trocar de estado (redirecionamento ao entrar e sair); o teclado, a área segura e a aparência das novas telas; Expo Go e aparelho.

## Configuração externa necessária

1. Criar o projeto Supabase e aplicar a migração (`supabase link` e `supabase db push`, ou colar o SQL no editor).
2. Auth: **desligar a confirmação de e-mail** e **senha mínima de 8** (também em `supabase/config.toml` para uso local).
3. Criar `app/.env.local` a partir de `app/.env.example` com `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`; reiniciar o Metro. Nunca usar a chave `service_role`.
4. Conferir no projeto real: o cabeçalho do IP chegando às funções (`request.headers`), os limites de taxa do próprio Auth e se `signUp` de e-mail existente devolve `user_already_exists`.
5. Rodar os fluxos com duas contas em dois aparelhos (ou um aparelho e a saída da conta): criar, entrar, palavra errada cinco vezes, e-mail errado, sair.

## Fora desta entrega (pendente)

- **"Esqueci minha senha"** (ADR 017, MVP): não implementado. Depende do formato (link ou código) e de links profundos, e a auditoria de dependências pede reavaliar `decode-uri-component` antes disso ([dependency-audit.md](./dependency-audit.md)). Enquanto isso, quem perder a senha não tem recuperação.
- Desejos, planejamento, experiências e memórias com dados reais (próxima entrega).
- A escolha "Um desejo / Uma memória" do `+` (ver [visual-shell.md](./visual-shell.md)).
- Fio e laço animados na criação do Laço; ícones; movimento reduzido.
