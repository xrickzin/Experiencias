# 023 — Verificação da palavra-chave antes da conta

**Status:** Aceita. O ramo por e-mail passou a ser o primeiro passo da entrada ([024](./024-email-first-entry.md)). Decisão técnica delegada pelo produto; complementa o [018](./018-keyword-protection-implementation.md).

## Contexto
O produto decidiu que "já está em uso" aparece **durante a criação do Laço**, na etapa do código, e que a pessoa pode trocar a palavra e continuar ([022](./022-entry-flow-and-solo-use.md)). Nessa etapa a conta ainda não existe (e-mail e senha vêm depois).

## Decisão
- **Verificação na etapa do código:** função de servidor chamável **sem sessão**, que informa só se a palavra está disponível. O limite de tentativas do 018 vale por **IP** para essas chamadas (ainda não há identidade); o contador é o mesmo.
- **Sem reserva:** a verificação não reserva a palavra.
- **Criação atômica:** ao criar o Laço, depois da conta, a unicidade é garantida pelo índice único do 018. Se outra pessoa tomou a palavra no intervalo, a criação falha, **nada é criado** e a pessoa volta à etapa do código com a mensagem "já está em uso".
- **Ramo por e-mail** ([022](./022-entry-flow-and-solo-use.md)): o fluxo pede confirmação de senha só quando o e-mail ainda não existe. Isso exige uma consulta de e-mail por função de servidor, limitada por IP; ela **revela que um e-mail tem conta** a quem testar, risco baixo num aplicativo privado e aceito.

## Consequências
- Quem não tem conta consegue enumerar palavras-chave em uso; o limite por IP e o bloqueio temporário são a contenção ([016](./016-keyword-abuse-protection.md)).
- Mensagens genéricas continuam valendo na vinculação ([016](./016-keyword-abuse-protection.md)).

## Alternativas consideradas
- Verificar só depois da conta: descartada, força voltar três etapas.
- Reservar a palavra por alguns minutos: descartada, complexidade sem necessidade.
