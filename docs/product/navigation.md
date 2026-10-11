# Navegação e entrada

Fonte de verdade das áreas do aplicativo e do fluxo de entrada.
**Decisão:** [022](../decisions/022-entry-flow-and-solo-use.md), [007](../decisions/007-navigation.md), [011](../decisions/011-couple-linking.md), [014](../decisions/014-home-and-location.md), [015](../decisions/015-identity-and-session.md), [016](../decisions/016-keyword-abuse-protection.md). Detalhes visuais: [../ux/home-and-navigation.md](../ux/home-and-navigation.md) e [../ux/onboarding.md](../ux/onboarding.md).

> **Os estados pertencem à experiência. As áreas pertencem à navegação.**

## Entrada: criar ou vincular o Laço

O primeiro acesso é simples: **abrir o aplicativo → Criar Laço ou Vincular ao Laço**. A autenticação é **Supabase Auth com e-mail + senha**, mas **não aparece como tela de login/cadastro no primeiro contato**: e-mail + senha são pedidos dentro do fluxo de Criar ou Vincular, como parte de estabelecer o acesso ([ADR 015](../decisions/015-identity-and-session.md)).

Quando a pessoa ainda não tem um Laço, a primeira tela oferece duas opções:

- **Criar Laço**
- **Vincular ao Laço**

**Criar Laço** — próprio nome → nome da outra pessoa → palavra-chave → **e-mail + senha** → cria a identidade → cria o Laço → Início.

**Vincular ao Laço** — começa pelo **e-mail**: e-mail já cadastrado → senha → Início (sem pedir o código); e-mail novo → palavra-chave → senha e confirmação → cria a identidade → vincula ao Laço → Início ([ADR 024](../decisions/024-email-first-entry.md)). A pessoa não precisa saber de antemão se está criando conta ou entrando. Depois do vínculo, vê o nome associado à sua identidade e pode alterá-lo, sem autorização da outra ([permissions.md](./permissions.md)). **Sem segundo onboarding.**

**Regras**

- A conexão é **única**: um Laço é formado entre exatamente duas pessoas, e o Laço deixa de estar disponível para novos vínculos depois que a segunda entra.
- **Quem cria o Laço entra em Início logo, sem esperar a outra pessoa**, e usa o aplicativo normalmente (Desejos, Planejamentos, Memórias). A interface indica que a segunda pessoa ainda não foi vinculada e não finge dois membros ativos. A segunda pessoa vai para Início ao se vincular.
- **Palavra-chave do criador:** é mostrada claramente durante a criação, com copiar/compartilhar, e o aplicativo avisa que deve ser guardada e passada à outra pessoa. **Não há tela para recuperá-la depois.**
- **Sessão persistente:** depois de vinculada, a pessoa permanece autenticada. Ao reabrir o aplicativo, vai **direto ao seu Laço**, sem informar de novo palavra-chave, e-mail ou senha enquanto a sessão for válida.
- **Reinstalar, trocar de aparelho ou sessão expirada:** e-mail + senha recuperam a identidade e dão acesso ao Laço existente, **sem pedir a palavra-chave** ([ADR 015](../decisions/015-identity-and-session.md), [022](../decisions/022-entry-flow-and-solo-use.md)). "Esqueci a senha" usa o fluxo nativo do Auth ([ADR 017](../decisions/017-account-and-session-details.md)). Senha incorreta: mensagem de que os dados não foram validados, com recuperação de senha. A entrada de quem retorna é o fluxo "Vincular ao Laço" começando pelo e-mail ([ADR 024](../decisions/024-email-first-entry.md)).
- **Um Laço por identidade** no MVP.
- **Palavra-chave inexistente ou incorreta:** mensagem genérica (ex.: "Não encontramos um Laço com essa palavra."), sem revelar se a palavra existe, se está em uso nem nada sobre outros Laços, e sem criar um Laço automaticamente.
- **Excesso de tentativas:** bloqueio **temporário**, com aviso claro (ex.: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."), que acaba sozinho, sem suporte ([ADR 016](../decisions/016-keyword-abuse-protection.md)). Os textos são exemplos, não definitivos.
- **Palavra-chave já em uso** ao criar um Laço: verificada **na etapa do código**; o aplicativo informa que ela já está em uso e a pessoa escolhe outra e continua (ex.: "Essa palavra-chave já está em uso. Escolha outra."; [ADR 023](../decisions/023-keyword-check-before-account.md)). É uma decisão intencional e difere da vinculação, que não revela nada ([ADR 016](../decisions/016-keyword-abuse-protection.md)).
- A palavra-chave serve **só para o vínculo inicial**. Não é senha, autenticação nem recuperação de conta. Não pode ser trocada no MVP e não é substituída por código aleatório por enquanto.
- **Termo de interface:** "Código do casal" = palavra-chave.
- **Configurações:** área secundária, sem nova área principal, com editar o próprio nome e sair da conta (logout).
- **Fora do MVP:** sair do Laço, desfazer o Laço, múltiplos Laços, trocar de parceiro, transferir experiências. Não existe ação de "sair do Laço" (logout não é sair do Laço).

## Áreas principais

Três áreas:

| Área | Conteúdo |
|---|---|
| **Início** | O que está acontecendo e o que vem pela frente. Ver abaixo. |
| **Desejos** | Experiências em **Desejo**. |
| **Nossa História** | Experiências em **Memória** ([memory.md](./memory.md#nossa-história)). |

- **Não** existem abas separadas para Planejamento nem para Vivendo: são contextos da própria experiência.

### Início

Responde: *"O que está acontecendo com a gente agora e o que vem pela frente?"* Ordem simples e previsível:

1. **Vivendo** primeiro. Com mais de uma, ordena pela referência temporal disponível; sem ela, a mais recentemente atualizada primeiro.
2. **Próximas:** Planejamento com data futura definida (data, data + horário, período), em ordem cronológica, a mais próxima primeiro.
3. **Planejamento sem data** (inclui só mês/ano): acessível em Início, **sem posição artificial** baseada em data inexistente, depois dos anteriores; a mais recentemente atualizada primeiro.
4. **Desejos:** apenas um **atalho com a contagem** para a área Desejos. Não lista desejos em Início.

**Limites de apresentação (provisórios, [ADR 027](../decisions/027-home-limits-and-past-planning.md))**: Vivendo, 1 em destaque e até 2 compactas; próximas, até 3; Planejamento, até 3. Não limitam quantas experiências o casal cadastra.

**Listas completas** (telas secundárias abertas de Início, sem nova aba): **Ver todos** = próximas experiências com data definida; **Ver planejamentos** = todas as experiências em Planejamento, com ou sem data.

**Planejamento com data já passada** continua em Planejamento até alguém alterar o estado ou a data; não é iniciado automaticamente, nem tratado como atrasado, nem ganha alerta ou indicador de urgência.

Início **não** é dashboard, sistema de produtividade, lista de tarefas, algoritmo de pontuação nem feed social.

## Ação global de criar

Uma ação global permite escolher:

- **Criar um desejo**
- **Registrar uma memória**

Não existe criação direta de Planejamento nem de Vivendo ([lifecycle.md](./lifecycle.md#criação)).

## Em aberto

Nenhuma questão de produto em aberto. Divergências e lacunas de UX: [../ux/open-questions-ux.md](../ux/open-questions-ux.md).
