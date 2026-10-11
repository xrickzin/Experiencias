# 015 — Identidade e sessão

**Status:** Aceita. Método de autenticação: **Supabase Auth com e-mail + senha**.

## Contexto
O Laço é privado e as regras de acesso (RLS) precisam saber quem é cada pessoa. A palavra-chave só vincula o casal ([016](./016-keyword-abuse-protection.md)); não identifica ninguém. O produto não deve abrir com uma tela tradicional de login/cadastro.

## Decisão
- Cada pessoa tem uma **identidade estável no Supabase Auth, criada com e-mail + senha**. Ela identifica o membro do Laço, mantém a sessão, sustenta o RLS e associa experiências, registros, impressões e demais dados à pessoa certa.
- O primeiro acesso continua sendo **abrir o aplicativo → Criar Laço ou Vincular ao Laço**. Não há tela de login/cadastro como primeiro contato. O e-mail + senha são pedidos **dentro do fluxo de onboarding**, como parte de estabelecer o acesso:
  - **Criar Laço:** próprio nome → nome da outra pessoa → palavra-chave → e-mail + senha → cria a identidade → cria o Laço → Início.
  - **Vincular ao Laço:** palavra-chave → e-mail + senha → cria a identidade → vincula ao Laço → Início.
- Depois da autenticação, a **sessão persiste**: abrir o aplicativo leva direto ao Laço, sem pedir de novo palavra-chave, e-mail ou senha enquanto a sessão for válida.
- **Recuperação** (reinstalação ou novo aparelho): e-mail + senha recuperam a identidade existente pelo Supabase Auth e dão acesso ao Laço existente. **Não se cria mecanismo próprio de recuperação.**
- No MVP, cada identidade pertence a **um único Laço**. Fora do MVP: múltiplos Laços, troca de parceiro, transferência, desvinculação, migração de experiências.

## Consequências
- A restrição anterior (login invisível × recuperação) deixa de ser um conflito: a identidade tem credencial recuperável e o e-mail + senha entram no onboarding, sem tela de login prévia.
- O modelo e as políticas partem da identidade do Auth ([data-model.md](../architecture/data-model.md), [security.md](../architecture/security.md)).
- É preciso impedir que uma identidade crie ou vincule um segundo Laço.
- Detalhes de conta (confirmação de e-mail, e-mail já cadastrado, esqueci a senha, senha mínima, armazenamento da sessão): [017](./017-account-and-session-details.md). Onde quem já tem conta entra a partir da primeira tela é definição de UX.

## Alternativas consideradas
- Sessão sem credencial recuperável: descartada, não permite recuperar o acesso em novo aparelho.
- Mecanismo próprio de recuperação de conta: descartada.
- Usar a palavra-chave como login: descartada ([016](./016-keyword-abuse-protection.md)).
