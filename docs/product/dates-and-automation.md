# Datas e automação

Fonte de verdade das referências temporais e do que o aplicativo pode fazer sozinho.
Estados: [lifecycle.md](./lifecycle.md). **Decisão:** [004](../decisions/004-dates-and-automation.md).

## Referência temporal

Toda informação sobre "quando" é uma **referência temporal**, com uma destas precisões:

| Precisão | Exemplo |
|---|---|
| sem data | (nada informado) |
| mês/ano | outubro de 2026 |
| data | 12/10/2026 |
| data + horário | 12/10/2026, 19h |
| período | 12 a 15 de outubro (início e fim) |

**Regras**

- Opcional em Desejo, Planejamento e Vivendo. Uma experiência pode existir sem data.
- A precisão escolhida pelo casal é preservada: **a automação nunca a modifica** e nunca infere uma data precisa a partir de uma informação ambígua.
- Informação temporal **não** é gatilho automático (≠). Só algumas precisões permitem automação.

## Memória exige referência temporal

Uma experiência **não pode virar Memória sem referência temporal** (Nossa História se organiza por ela).

- Ao **registrar uma memória** diretamente, a referência é obrigatória.
- Ao **finalizar** uma experiência sem data, a referência precisa ser definida antes de ela virar Memória. **O primeiro do casal que a definir a fixa na memória.**
- Precisões válidas: mês/ano, data, data + horário, período.

## Automação do início

Escopo: **Planejamento → Vivendo**. Só atua sobre experiências em Planejamento ([lifecycle.md](./lifecycle.md#transições-permitidas)).

| Precisão | Automatiza o início? |
|---|---|
| sem data | Não |
| mês/ano | Não |
| data | Pode |
| data + horário | Pode |
| período | Pode, usando o **início** do período |

A transição manual para Vivendo continua sempre possível, com ou sem data.

> **Automação deve reduzir trabalho, não retirar decisões importantes do casal.**

### Quando e em que fuso

- **Direção:** a automação roda no **servidor**. A mudança de estado não depende de alguém abrir o aplicativo; o aplicativo apenas reflete o estado persistido. A tecnologia é definida na implementação.
- **Data sem horário (decisão confirmada):** a experiência passa a Vivendo **às 00:00 do dia definido, no fuso do Laço**. Ex.: início 12/10/2026 sem horário → Vivendo em 12/10/2026 às 00:00.
- O fuso é uma propriedade do Laço e **existe no modelo de dados**; não é inferido a cada abertura do aplicativo nem de cada aparelho. Como é definido e guardado fisicamente fica para a implementação.

## A automação não disputa a decisão do casal

> **A automação auxilia o casal; ela nunca disputa o controle do estado com ele.**

Loop a evitar: a experiência entra em Vivendo automaticamente; o casal volta manualmente para Planejamento; a automação dispara de novo sem nova decisão.

**Regras**

1. Depois de uma decisão manual do casal, a automação **não repete a mesma transição** só porque a data original já passou. A implementação registra a intervenção manual relevante.
2. **Só uma nova condição temporal válida reabilita a automação:** o casal editar o início para um novo instante **ainda futuro**.
3. **Data já passada ao definir ou editar em Planejamento: a automação não dispara (decisão confirmada).** A experiência permanece no estado atual e pode ser iniciada manualmente. A automação vale para instantes de início futuros, ainda não atingidos. Consequência: definir **hoje** uma data sem horário não inicia a experiência (a 00:00 de hoje já passou). Um Planejamento de data passada **permanece em Planejamento sem alerta nem indicador de urgência** até alguém alterar o estado ou a data ([ADR 027](../decisions/027-home-limits-and-past-planning.md)).

**Mecanismo técnico:** decidido em [ADR 019](../decisions/019-automation-implementation.md) (rotina no PostgreSQL e `armado_em`); ver [../architecture/technical-decisions.md](../architecture/technical-decisions.md#anti-loop-da-automação).

## Término

- Sem data de término clara: **não há automação de término**; a finalização é manual.
- No MVP a finalização é sempre manual.

**Possibilidade futura:** com data de término clara, o aplicativo pode perguntar se a experiência ainda está acontecendo ou se terminou ([future.md](./future.md#término-assistido)).
