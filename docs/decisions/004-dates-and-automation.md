# 004 — Datas e automação

**Status:** Aceita (mecanismo técnico definido na implementação)

## Contexto
Datas podem ser vagas ("outubro") ou exatas. Automatizar com base em informação ambígua, ou contra uma decisão do casal, tiraria o controle dele.

## Decisão
- Referência temporal com precisão variável: sem data, mês/ano, data, data + horário, período.
- Informação temporal **não é** gatilho automático. Automatizam o início (Planejamento → Vivendo): data, data + horário e período (pelo início). Não automatizam: sem data e mês/ano.
- A automação nunca infere data precisa e nunca altera a precisão escolhida.
- Memória exige referência temporal. Ao finalizar sem data, **o primeiro do casal que a definir a fixa na memória**.
- No MVP o término é sempre manual; término assistido é futuro.
- **Execução:** no **servidor**, para não depender de alguém abrir o aplicativo. Data sem horário dispara no **início do dia, no fuso do Laço**.
- **Data sem horário (confirmada):** a experiência passa a Vivendo **às 00:00 do dia definido, no fuso do Laço**. Ex.: início 12/10/2026 sem horário → Vivendo em 12/10/2026 às 00:00.
- **Data de início já passada (confirmada):** se o instante já passou quando a data é definida, a automação **não dispara imediatamente**; a experiência permanece no estado atual e pode ser iniciada manualmente. A automação vale para instantes de início futuros, ainda não atingidos.
- **Anti-loop:** a automação não repete a mesma transição após uma decisão manual; só uma nova data de início ainda futura a reabilita.

## Consequências
- O Laço guarda um fuso ([data-model.md](../architecture/data-model.md)); fuso e execução estão definidos em [019](./019-automation-implementation.md).
- Definir **hoje** uma data sem horário não inicia a experiência (a 00:00 de hoje já passou); a pessoa inicia manualmente.
- Execução, fuso e mecanismo contra o loop: [019](./019-automation-implementation.md).
