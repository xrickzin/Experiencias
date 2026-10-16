# 030 — Legenda nas fotos e observação do momento

**Status:** Aceita (pedido do usuário, 2026-10-15). Ajusta o [029](./029-moments-tab-and-create-choice.md).

## Contexto
O 029 deixou a legenda de foto de fora ("se surgir a necessidade, é uma decisão nova"), e a necessidade surgiu. Além disso, ao usar a aba Momentos, nada na tela deixava claro que a observação pertence a um dia e a um período: ela caía no momento em que era escrita, sem que a pessoa soubesse ou pudesse escolher.

## Decisão
**Legenda nas fotos**
- Cada foto pode ter uma **legenda opcional**, de até **300 caracteres**, escrita, trocada ou tirada por **qualquer um dos dois**. A foto continua sendo de quem a enviou.
- A legenda aparece na foto aberta ("Adicionar legenda" / "Editar legenda"); guardar em branco a tira. O leitor de tela também a lê na miniatura.
- Observação continua sem legenda: ela já é texto.

**Observação do momento**
- A observação é **do momento**: pertence a um **dia** e a um **período** (madrugada, manhã, tarde, noite, no horário de Brasília), os mesmos que organizam as fotos.
- Ao escrever, a tela se chama "Observação do momento", explica que ela fica guardada no dia e no período escolhidos, junto das fotos desse momento, e mostra onde vai aparecer ("Vai aparecer em: Hoje · Tarde").
- O padrão é **agora**. A pessoa pode escolher **Hoje**, **Ontem** ou **Outro dia** (digitado) e o período. Dias no futuro não são aceitos. Ao editar, dá para mudar o momento.
- O botão passou a se chamar "Escrever observação do momento".

## Consequências
- Banco: `registros.legenda` (só em fotos) e a observação passa a usar `capturada_em`, o mesmo campo que diz quando a foto foi tirada, agora editável pelos dois. Migração `20261015180000_legenda_e_momento_da_observacao.sql`.
- Momento escolhido que não é o atual é guardado no meio do período (3h, 9h, 15h ou 21h em Brasília): só o dia e o período importam.
- Observações escritas antes desta mudança continuam no momento em que foram escritas.
