# 024 — Entrada pelo e-mail

**Status:** Aceita. Ajusta a ordem das telas definida em [022](./022-entry-flow-and-solo-use.md) e o ramo por e-mail de [023](./023-keyword-check-before-account.md) (UX-F17).

## Contexto
"Quero entrar no nosso Laço" serve a quem vincula pela primeira vez e a quem retorna (novo aparelho, sessão expirada). Pedir o código primeiro obrigava quem retorna a lembrar um código que não é recuperável.

## Decisão
O fluxo de "Quero entrar no nosso Laço" **começa pelo e-mail**:

1. A pessoa informa o e-mail.
2. **E-mail já cadastrado:** pede a senha e autentica. **O código do casal não é pedido de novo.**
3. **E-mail ainda não cadastrado:** pede o **código do casal**.
4. Validado o código, a pessoa **cria a senha e a confirma**.
5. O primeiro vínculo é concluído e a pessoa vai para **Início**.

O código do casal continua sendo um mecanismo de **primeiro vínculo**: não é credencial de autenticação nem de recuperação. Sessão, recuperação de senha, limite de tentativas e mensagens ([015](./015-identity-and-session.md), [016](./016-keyword-abuse-protection.md), [017](./017-account-and-session-details.md), [018](./018-keyword-protection-implementation.md)) **não mudam**. O fluxo "Quero começar nosso Laço" (criar) também não muda.

## Consequências
- **Consulta de existência do e-mail:** é o primeiro passo, por função de servidor chamável sem sessão, **limitada por IP** com o mecanismo do [018](./018-keyword-protection-implementation.md), em contador próprio (valores iniciais ajustáveis na configuração do servidor). Ela **revela que um e-mail tem conta** a quem testar; risco baixo num aplicativo privado, já aceito no [023](./023-keyword-check-before-account.md) e agora no primeiro passo, não depois do código.
- **Código inexistente, incorreto ou de Laço já completo:** mensagem genérica da vinculação ([016](./016-keyword-abuse-protection.md)).
- **Senha incorreta:** mensagem de que os dados de acesso não foram validados, com recuperação de senha ([017](./017-account-and-session-details.md)).
- **Conta existente sem Laço** (onboarding interrompido): depois de autenticar, a pessoa é conduzida a Criar ou Vincular, e o código é pedido; um Laço por identidade.
- A verificação do código continua antes de existir conta ([023](./023-keyword-check-before-account.md)).

## Alternativas consideradas
- Código antes do e-mail: descartada, força quem retorna a digitar um código que pode não ter mais.
