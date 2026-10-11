# 022 — Fluxo de entrada, uso com um membro e configurações

**Status:** Aceita. A ordem das telas em "Quero entrar no nosso Laço" foi ajustada pelo [024](./024-email-first-entry.md). Decisões de UX com efeito em produto, confirmadas pelo usuário.

## Contexto
A direção de UX ([../ux/onboarding.md](../ux/onboarding.md)) divergia dos ADRs 011, 015 e 017 em pontos do fluxo de entrada, do uso do Laço antes de a segunda pessoa entrar e das configurações da conta.

## Decisão
- **Termo:** na interface, **"Código do casal"**; nos documentos técnicos, **palavra-chave**. É o mesmo conceito e o comportamento técnico não muda.
- **Código só no primeiro vínculo.** Depois de a identidade estar vinculada ao Laço, não se pede a palavra-chave de novo, nem como login, nem como recuperação. Em novo aparelho ou sessão expirada a pessoa usa sua identidade de autenticação (e-mail + senha), sem código.
- **Primeiro vínculo** *(ordem das telas ajustada pelo [024](./024-email-first-entry.md): o e-mail vem primeiro)*: depois do código, a pessoa informa o e-mail. **E-mail ainda não cadastrado:** e-mail, senha e confirmação de senha; a conta é criada e a pessoa vinculada. **E-mail já cadastrado:** e-mail e senha, sem confirmação. A pessoa não precisa saber de antemão se está "criando conta" ou "entrando".
- **Uso com um membro.** Quem cria o Laço entra no aplicativo sem esperar a outra pessoa e pode criar Desejos, Planejamentos e Memórias. A interface deixa claro que a segunda pessoa ainda não foi vinculada e **não finge dois membros ativos**.
- **Segunda pessoa:** confirmação breve de que entrou no Laço, vê o nome associado à sua identidade (o que quem criou digitou), pode editá-lo depois e vai para Início. **Sem segundo onboarding.**
- **Palavra-chave do criador:** apresentada claramente durante a criação, com ações de **copiar/compartilhar** e o aviso de que deve ser guardada e passada à outra pessoa. **Não existe tela posterior para recuperá-la** (o servidor só guarda o derivado, [018](./018-keyword-protection-implementation.md)).
- **Configurações:** área secundária, acessível pela interface de conta/perfil, **sem nova área principal de navegação**. No MVP: **editar o próprio nome** e **sair da conta** (logout). Não existem: sair do Laço, desvincular, múltiplos Laços, trocar de parceiro.
- **Confirmações:** **finalizar** exige confirmação explícita (a experiência vira Memória, sem volta); **excluir/cancelar** exige confirmação explícita (remoção definitiva da experiência e seus registros). Se o casal só desistiu por ora, a experiência **volta para Desejo**.

## Consequências
- O Laço tem **um ou dois** membros: um depois de criado, dois depois do vínculo, nunca mais ([data-model.md](../architecture/data-model.md)). O nome da outra pessoa é provisório até o vínculo.
- O Laço fica disponível para vínculo enquanto tiver um só membro ([011](./011-couple-linking.md)).
- Verificação da palavra-chave antes de existir conta: [023](./023-keyword-check-before-account.md).
