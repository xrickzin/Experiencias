# 011 — Vínculo do casal por palavra-chave

**Status:** Aceita. Tentativas abusivas: [016](./016-keyword-abuse-protection.md). Identidade e sessão: [015](./015-identity-and-session.md).

## Contexto
O MVP precisa de uma forma de duas pessoas formarem o mesmo espaço, sem fluxo complexo.

## Decisão
- A primeira tela oferece **Criar Laço** e **Vincular ao Laço**.
- Quem cria informa o próprio nome, o nome da outra pessoa, uma **palavra-chave** e **e-mail + senha** ([015](./015-identity-and-session.md)). Quem vincula informa a palavra-chave e **e-mail + senha**, e depois pode alterar o próprio nome, sem autorização do outro.
- A conexão é **única** (exatamente duas pessoas). Feito o vínculo, ambos vão para **Início**.
- Palavra-chave inexistente ou incorreta: mesma mensagem genérica, sem revelar nada de outros Laços e sem criar Laço. Já em uso na criação: rejeitada, informando que está em uso e pedindo outra (decisão intencional, ver [016](./016-keyword-abuse-protection.md)).
- A palavra-chave serve só ao vínculo inicial; **não é senha**, autenticação nem recuperação de conta, e não é trocada no MVP.
- **Fora do MVP:** sair ou desfazer o Laço, múltiplos Laços, trocar de parceiro, transferir ou migrar experiências. Não há ação "sair do Laço".
- "Laço" também nomeia esse espaço compartilhado.

## Consequências
- Proteção contra tentativas abusivas, no servidor: [016](./016-keyword-abuse-protection.md). *(A versão inicial deste registro aceitava "sem limite de tentativas"; foi substituída pelo 016.)*
- Depois do vínculo, a sessão e a identidade sustentam o acesso ([015](./015-identity-and-session.md)). Fluxo de entrada, uso com um membro e configurações: [022](./022-entry-flow-and-solo-use.md); quem cria entra em Início antes da segunda pessoa.
- Toda informação compartilhada pertence ao Laço ([data-model.md](../architecture/data-model.md)).
