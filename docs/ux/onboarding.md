# Entrada, criação do Laço e sessão

Regras de produto: [../product/navigation.md](../product/navigation.md#entrada-criar-ou-vincular-o-laço), [ADR 011](../decisions/011-couple-linking.md), [015](../decisions/015-identity-and-session.md), [016](../decisions/016-keyword-abuse-protection.md), [017](../decisions/017-account-and-session-details.md), [022](../decisions/022-entry-flow-and-solo-use.md), [023](../decisions/023-keyword-check-before-account.md), [024](../decisions/024-email-first-entry.md). Pendências: [open-questions-ux.md](./open-questions-ux.md).

## Correspondência de nomes

| Produto | Texto de UX |
|---|---|
| Criar Laço | "Quero começar nosso Laço" |
| Vincular ao Laço (primeiro vínculo) e acesso em novo aparelho | "Quero entrar no nosso Laço" (começa pelo e-mail) |
| palavra-chave | "Código do casal" |

"Código do casal" é o termo de UX para a palavra-chave usada tecnicamente no vínculo inicial; o comportamento técnico não muda por causa do nome.

O código serve **somente ao primeiro vínculo**. Depois de a identidade estar vinculada ao Laço, não se pede o código de novo, não é login nem recuperação de senha. Não transformá-lo em um conceito emocional ou romantizado.

## Fluxos

**Criação:** nome → nome da outra pessoa → código do casal → e-mail → senha → confirmar senha → Laço criado → Início.
**Quero entrar no nosso Laço:** e-mail → (e-mail cadastrado: senha → Início | e-mail novo: código do casal → senha + confirmação → vínculo → Início).
**Novo aparelho ou sessão expirada:** o mesmo caminho; e-mail cadastrado pede só a senha, **nunca o código**.

A pessoa não precisa saber antecipadamente se está "criando conta" ou "entrando": o fluxo a conduz ao caso correspondente.

## 1. Entrada inicial

Não parece uma tela tradicional de login: apresenta o produto e direciona. É um **roteador de intenção**.

> **Laço**
>
> Um lugar para viver, guardar e contar a história de vocês.

> **O que traz você até aqui?**

- **Quero começar nosso Laço**
- **Quero entrar no nosso Laço**

Não usar como linguagem principal: Criar conta, Login, Cadastro, Já tenho uma conta.

## 2. Criar um Laço

Experiência **contínua**: um único ambiente que se transforma conforme a pessoa avança, com o fio vermelho acompanhando as transformações.

**Etapa 1 — nome da pessoa**
> **Vamos começar pelo começo.** Como podemos chamar você?
> `[ Seu nome ]` · **Continuar**

**Etapa 2 — outra pessoa**
> **E quem vai viver tudo isso com você?**
> `[ Nome da pessoa ]` · **Continuar**

**Etapa 3 — código do casal**
> **Escolham um código para o casal**
> Pode ser uma palavra, data, apelido ou qualquer coisa que vocês dois saibam.
> `[ Código do casal ]` · **Continuar**

O código é validado **nesta etapa**. Se já estiver em uso:

> **Essa palavra-chave já está em uso. Escolha outra.**

A pessoa altera o código e continua ([ADR 023](../decisions/023-keyword-check-before-account.md)). *(O texto usa "palavra-chave" no original; o termo de interface é "código do casal". Redação final: UX-V.)*

## 3. Autenticação durante a criação

Integrada ao onboarding; é **proteção do espaço**, não o propósito do aplicativo.

> **Nosso Laço está quase pronto.**
> Agora vamos criar seu acesso para que você possa reencontrá-lo depois.

Campos: **Seu e-mail** · **Crie uma senha** · **Confirme sua senha** · ação **Criar acesso**.

- senha e confirmação coincidem; a confirmação existe **somente** na criação de conta;
- senha inválida gera feedback claro e respeita os requisitos da autenticação (mínimo de 8 caracteres, dito de forma simples: "A senha deve ter pelo menos 8 caracteres.");
- mostrar/ocultar senha; sem lista excessiva de requisitos.

## 4. Conclusão da criação

É o **momento principal de celebração** do Laço; a Home que vem em seguida assume o estado normal, sem repetir a mensagem.

Pequena transição visual: o fio vermelho pode se encontrar e formar um pequeno laço.

> **O Laço de vocês está criado.** *(ou:* **O Laço de vocês começou.***)*

Nesta tela, o **código do casal** é apresentado claramente ao criador, com o aviso de que deve ser **guardado e compartilhado** com a outra pessoa, e com as ações **copiar** e **compartilhar**. Não existe tela posterior para recuperá-lo.

Ação: **Entrar no Laço** → Início. Sem tela adicional desnecessária.

## 5. Quero entrar no nosso Laço

A entrada **começa pelo e-mail**, para distinguir o primeiro vínculo de um acesso posterior ([ADR 024](../decisions/024-email-first-entry.md)). A pessoa não precisa saber de antemão se está criando conta ou entrando.

> **Qual é o seu e-mail?** `[ seuemail@email.com ]` · **Continuar**

**E-mail já cadastrado** (acesso posterior, novo aparelho, sessão expirada):

> **Vamos reencontrar vocês.**
> **Senha** · **Entrar**
> **Esqueci minha senha** (abaixo)

Autentica e vai para Início. **O código do casal não é pedido de novo**, nem nome, nem criação de código, nem confirmação de senha.

**E-mail ainda não cadastrado** (primeiro vínculo da segunda pessoa):

> **Qual é o código do casal?** `[ Código do casal ]` · **Continuar**

Validado o código, a pessoa cria a senha e a confirma. Depois do vínculo:

1. confirmação breve de que a pessoa entrou no Laço;
2. ela vê o nome associado à sua identidade (o que quem criou digitou) e pode editá-lo depois;
3. vai para Início.

**Sem segundo onboarding completo**: começa a usar o Laço imediatamente.

*Conta existente sem Laço* (onboarding interrompido): depois de autenticar, a pessoa é conduzida a Criar ou Vincular, e o código é pedido.

## 6. Sessão

Com **sessão válida**, o aplicativo abre direto em **Início**, sem onboarding, código, login ou criação.

> Autenticação protege o Laço; ela não deve ficar no caminho dele.

Em **novo aparelho** ou **sessão expirada**, a pessoa volta pela entrada por e-mail ([seção 5](#5-quero-entrar-no-nosso-laço)), sem pedir o código do casal.

## 7. Mensagens e estados

Claros, mas sem revelar informação indevida. Textos finais são da UX.

| Situação | Comportamento |
|---|---|
| Código não encontrado ou incorreto | mensagem **genérica**, sem indicar se o código existe |
| Código já em uso na criação | "Essa palavra-chave já está em uso. Escolha outra." |
| Excesso de tentativas | informar que novas tentativas estão **temporariamente bloqueadas**, sem detalhes do mecanismo |
| E-mail já cadastrado | tratar como conta existente e pedir só a senha |
| Senha incorreta | informar que os dados de acesso não foram validados e oferecer recuperação de senha |
| Sessão expirada | voltar à autenticação, sem pedir o código |
