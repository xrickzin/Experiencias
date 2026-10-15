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

## Revisão da migração antes de aplicar (2026-10-12)

Revisão integral, sem aplicar nada ao banco real. Resultado: **pronta para aplicação manual no SQL Editor**, sem etapas de CLI ou Docker.

- **Corrigido:** conferência no início do script de que `pgcrypto` e `unaccent` estão no schema `extensions`; sem isso (projetos antigos) o script para com uma mensagem clara antes de criar qualquer coisa.
- **Teste mais fiel:** o `auth.uid()` do ambiente de testes passou a ser o do Supabase (lê `request.jwt.claims`), e o papel e o `sub` vêm do JWT simulado. Os testes continuam passando.
- **Verificado por leitura, sem poder testar localmente:** privilégios padrão do Supabase (tabelas e funções do schema `public` nascem executáveis por `anon` e `authenticated`; o `revoke` final cobre as 16 funções), `SECURITY DEFINER` com `search_path` vazio (tudo qualificado; `unaccent(text)` usa o dicionário do schema da própria função), `auth.users` legível pelo dono das funções, nomes de parâmetros das funções iguais aos do cliente, funções chamadas por `rpc` são `VOLATILE` (as que gravam), leitura do IP em `request.headers`.
- **Só um projeto real confirma:** quais cabeçalhos de IP chegam (ver o teste 2 abaixo), o comportamento do PostgREST ao recarregar o esquema, o `signUp` com a confirmação de e-mail desligada e os limites de taxa do próprio Auth.
- **Avisos esperados:** o editor do painel pode pedir confirmação por haver `delete` e `revoke` no script; o Security Advisor lista as funções `SECURITY DEFINER` expostas a `anon` (é o desenho: só elas dão acesso ao vínculo).
- **Não reaplicar:** o script não é idempotente e o segredo do HMAC é gerado nele; recriar a tabela de configuração invalida todos os códigos já criados.

## Configuração externa necessária

1. Criar o projeto Supabase e aplicar a migração (`supabase link` e `supabase db push`, ou colar o SQL no editor).
2. Auth: **desligar a confirmação de e-mail** e **senha mínima de 8** (também em `supabase/config.toml` para uso local).
3. Criar `app/.env.local` a partir de `app/.env.example` com `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`; reiniciar o Metro. Nunca usar a chave `service_role`.
4. Conferir no projeto real: o cabeçalho do IP chegando às funções (`request.headers`), os limites de taxa do próprio Auth e se `signUp` de e-mail existente devolve `user_already_exists`.
5. Rodar os fluxos com duas contas em dois aparelhos (ou um aparelho e a saída da conta): criar, entrar, palavra errada cinco vezes, e-mail errado, sair.

## Recuperação de senha (código pronto; sem teste real de e-mail)

Implementada depois da primeira validação com o Supabase real. **O envio do e-mail, o retorno pelo link e a troca da senha ainda não foram testados** (nem em Expo Go, nem em build).

**Fluxo**
1. Entrada → e-mail → senha → **"Esqueci minha senha"** (`src/app/entrada/esqueci-senha.tsx`): pede o e-mail (preenchido com o já digitado) e chama `resetPasswordForEmail`. A confirmação é a mesma exista ou não a conta. Um novo pedido só é permitido depois de 60 s (o Supabase também limita).
2. O e-mail traz um link do Supabase que redireciona para `redirectTo = createURL('redefinir-senha')`: `laco://redefinir-senha` em build e `exp://<endereço>/--/redefinir-senha` no Expo Go.
3. O Expo Router abre `src/app/redefinir-senha.tsx` (fora dos grupos protegidos, com ou sem sessão), que lê `code` e `sb_flow_id` (ou `error`/`error_code`) dos parâmetros da rota, troca o código por uma sessão com `exchangeCodeForSession` e só aceita fluxos do tipo `recovery`.
4. A pessoa define e confirma a nova senha (`updateUser`, mínimo de 8). Depois do sucesso o app encerra as sessões da conta em outros aparelhos (`signOut` com `scope: 'others'`), mostra "Senha atualizada" e "Continuar" leva a Início (ou à entrada, se a conta não tiver Laço).
5. Link expirado, já usado, incompleto, aberto em outro aparelho ou com a sessão perdida mostra "Esse link não vale mais" com **"Pedir outro link"**. Falha de rede na troca permite tentar de novo sem perder o link.

**Decisões técnicas**
- **PKCE** (`flowType: 'pkce'` em `src/services/supabase.ts`) em vez do fluxo implícito: o link carrega um código de uso único, não tokens, e o verificador fica no armazenamento seguro do aparelho. Consequência: **o link só funciona no aparelho que pediu**; em outro, cai em "link inválido" e a pessoa pede um novo. Esta versão do `auth-js` acrescenta `sb_flow_id` ao redirecionamento; a tela repassa o valor à troca.
- **Um único ouvinte de autenticação:** o de `SessaoProvider` (já existente). Nenhum novo listener; o evento `PASSWORD_RECOVERY` chega a ele como qualquer outro. A navegação não depende do evento: depende de a pessoa abrir o link.
- **Sessão de recuperação não vira acesso comum:** enquanto a tela está aberta, `reter(true)` impede o salto para a área principal; "Cancelar" (ou voltar à entrada) encerra a sessão. **Limite:** se o app for fechado no meio do processo, a sessão de recuperação permanece válida (é o comportamento do Supabase) e a pessoa entra sem ter trocado a senha.
- **Sem registro de links, códigos ou senhas:** o código não vai para log nem para o armazenamento do app, e a senha só existe nos campos da tela e na chamada `updateUser`. A biblioteca imprime um aviso fixo (`console.warn`) quando o aparelho não tem WebCrypto, sem dados.
- **Mensagens:** erro de rede, limite de pedidos (`over_email_send_rate_limit` vira o aviso de excesso de tentativas) e falhas genéricas, sem detalhe do serviço.

**Regressão corrigida (2026-10-15)**
- A rota `redefinir-senha` tinha sido declarada como a **primeira** tela da pilha raiz, fora dos grupos protegidos. Quando a sessão muda (fim da criação do Laço, fim do vínculo, abertura sem sessão), o Expo Router cai na primeira tela disponível: caía nela, mostrava "Esse link não vale mais" e o "Voltar" ainda encerrava a sessão. Agora ela é a **última** da pilha, só segura a pessoa quando há um código de recuperação e só encerra a sessão que ela mesma abriu.
- Por precaução, se o cadastro não devolver sessão (efeito possível do PKCE com a confirmação de e-mail desligada), o app entra com as mesmas credenciais em vez de mostrar erro.

**"Sair da conta" sem efeito no aparelho (2026-10-15)**
- Relato: o botão não fazia nada. Não consegui reproduzir: com a sessão simulada a saída funcionava, e `supabase/tests/sessao-app.mjs` confirmou que o armazenamento em blocos e o `signOut` do `supabase-js` limpam a sessão e disparam `SIGNED_OUT`. A causa no aparelho não foi confirmada.
- Hipóteses tratadas: (1) o `Alert` nativo sobre o modal podia não aparecer; (2) o Stack protegido remover o modal e as abas ao mesmo tempo podia deixar a tela parada. Agora a confirmação é na própria tela (dois toques), a saída leva explicitamente a `/entrada` assim que a sessão acaba, e o estado é relido depois do `signOut` sem depender só do evento.
- Segunda rodada: o relato seguinte (a confirmação aparecia e a pessoa continuava em Ajustes) ainda não tinha causa confirmada. Acrescentado: o `sair` do serviço espera o `signOut` por até 5 s e, se der erro ou travar, apaga a sessão só do aparelho (`apagarSessaoLocal`, mesma chave `sb-<projeto>-auth-token` do `supabase-js`); e a tela de Ajustes, se a saída não terminar em 12 s, volta a responder e mostra "Não foi possível sair agora".
- O servidor de desenvolvimento servia o código novo ("Sim, sair da conta" no pacote). No aparelho, **a confirmação nova é inline e não usa o aviso nativo do Android**: se o aviso nativo ainda aparecer, o aparelho está com o pacote antigo e precisa recarregar.
- **Confirmado no aparelho (2026-10-15, pelo usuário, Expo Go com túnel):** sair da conta funciona e a recuperação de senha funciona de ponta a ponta. A causa do relato anterior continua sem diagnóstico; o mais provável é o pacote antigo no celular.

**Limites e riscos conhecidos**
- **Vários pedidos de recuperação:** o redirecionamento não traz `sb_flow_id` (confirmado no Supabase local), então só o link do pedido mais recente funciona no aparelho; os anteriores caem em "link inválido". A tela avisa para usar o e-mail mais recente.
- **Sem WebCrypto no runtime do Expo:** o `auth-js` gera o verificador com `Math.random` e usa o desafio `plain`. O código interceptado sozinho continua inútil sem o verificador, que nunca aparece no link, mas a aleatoriedade é mais fraca que a ideal. Endurecer exige uma dependência de criptografia (`expo-crypto`) e é decisão pendente.
- **Esquema personalizado (`laco://`):** no Android outro aplicativo pode registrar o mesmo esquema. O PKCE reduz o dano (o código sozinho não serve); a solução completa é link de app (HTTPS) com domínio próprio, pendente.
- **`decode-uri-component` (auditoria, cadeia C):** os parâmetros do link passam pelo `query-string` do `expo-router`, que usa a versão 0.2.2, vulnerável a negação de serviço por entrada malformada ([dependency-audit.md](./dependency-audit.md)). Efeito possível: o app travar ao abrir um link manipulado; não expõe dados nem contorna a autenticação. Não há correção compatível hoje; o risco foi reavaliado e **aceito** para este uso.
- **E-mail do Supabase:** o servidor de e-mail padrão do projeto tem limite baixo de envios por hora e, em planos novos, só entrega para endereços da equipe do projeto. Para uso real é preciso configurar SMTP próprio.

**Configuração manual no painel do Supabase** (nada foi alterado automaticamente)
1. *Authentication → URL Configuration → Redirect URLs*: adicionar `laco://**` e, só para testar no Expo Go, `exp://**`. Sem isso o Supabase ignora o `redirectTo` e manda para o *Site URL* (padrão `http://localhost:3000`), e o link não abre o app.
2. *Authentication → Email Templates → Reset Password*: manter o modelo padrão (que usa `{{ .ConfirmationURL }}`).
3. Para o teste, usar um e-mail da equipe do projeto ou configurar SMTP em *Authentication → SMTP Settings*.

**Como testar** (marcar cada item só depois de feito)
- *Expo Go:* o link do e-mail abre `exp://…`; abrir o e-mail **no mesmo celular** e tocar no link. O endereço muda a cada reinício do servidor; se mudar, pedir um novo link e conferir a URL permitida (`exp://**`).
- *Build de desenvolvimento ou de produção:* o link abre `laco://redefinir-senha`; exige a regra `laco://**`.
- *Casos:* conta existente (fluxo completo e entrar com a nova senha), e-mail inexistente (mesma confirmação, nenhum e-mail), link usado duas vezes, link aberto em outro aparelho, senha curta, senhas diferentes, cancelar, fechar o app no meio, sem internet.

## Fora desta entrega (pendente)

- **"Esqueci minha senha"** (ADR 017): implementado como link por e-mail, ver a seção acima; falta o teste real.
- Desejos, planejamento, experiências e memórias com dados reais (próxima entrega).
- A escolha "Um desejo / Uma memória" do `+` (ver [visual-shell.md](./visual-shell.md)).
- Fio e laço animados na criação do Laço; ícones; movimento reduzido.
