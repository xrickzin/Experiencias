# 027 — Limites do Início e Planejamento com data passada

**Status:** Aceita. Os limites de apresentação são **provisórios**. Complementa o [014](./014-home-and-location.md).

## Contexto
Com muitas experiências, o Início precisa continuar compreensível sem virar feed, painel ou lista de tarefas, e faltava definir onde entram as listas completas e o que acontece com um Planejamento cuja data já passou.

## Decisão

**Limites de apresentação em Início (provisórios)**
- **Vivendo:** uma experiência em destaque e até **duas** adicionais em formato compacto.
- **Próximas:** até **três** experiências com data definida.
- **Planejamento:** até **três** experiências.
- **Desejos:** só um **atalho com a contagem**; a Home não lista desejos.

Esses limites organizam a apresentação. **Não limitam** quantas experiências o casal pode cadastrar. A ordem dentro de cada bloco continua a do [014](./014-home-and-location.md).

**Acesso às listas completas** (quando houver mais itens que o limite)
- **Ver todos:** lista completa das próximas experiências **com data definida**.
- **Ver planejamentos:** lista completa das experiências em **Planejamento, com ou sem data**.
- São telas secundárias abertas a partir de Início. **Não há nova aba principal**: a navegação continua Início, Desejos e Nossa História.

**Planejamento com data inicial já passada**
- Continua em Planejamento **até que alguém altere o estado ou a data manualmente**.
- Não é iniciada automaticamente, não é tratada como atrasada e **não ganha alerta nem indicador de urgência**.
- Concorda com a regra de automação: data já passada ao ser definida não dispara ([004](./004-dates-and-automation.md), [019](./019-automation-implementation.md)).

## Consequências
- O Início nunca esconde itens sem caminho de acesso; a proposta visual os representa em [screens.md](../ux/proposal/screens.md#início).
- Onde um Planejamento de data passada aparece em Início (bloco de próximas não, por ser data não futura) ficou **sem regra explícita**: ele é alcançável por "Ver planejamentos"; sua presença entre os até três de Planejamento segue a ordem do 014 e **não foi decidida**.
