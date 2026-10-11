# Ciclo de vida da experiência

Fonte de verdade dos estados, transições, criação e cancelamento.
Datas e automação: [dates-and-automation.md](./dates-and-automation.md). Quem pode fazer o quê: [permissions.md](./permissions.md).

## Entidade e estados

A **experiência** é a entidade central. Os estados **não são entidades diferentes**: a mesma experiência evolui e acumula informação.

> **Desejo → Planejamento → Vivendo → Memória**

**Nossa História** não é um estado: é a área que apresenta as memórias ([memory.md](./memory.md)).

| Estado | Significa | Regras |
|---|---|---|
| **Desejo** | Algo que o casal gostaria de viver | Pode existir sem data, local ou planejamento, por tempo indeterminado. Só o título é essencial. |
| **Planejamento** | O casal decidiu tentar transformar o desejo em algo concreto | Começa praticamente vazio e ganha informação aos poucos. Não é formulário. |
| **Vivendo** | Está acontecendo, ou o casal decidiu iniciar | Informações planejadas continuam disponíveis; o foco é acompanhar e registrar. |
| **Memória** | Terminou e passou a fazer parte da história do casal | **Estado final.** A experiência continua a mesma; a memória preserva o contexto acumulado. |

> **Decisão:** [002](../decisions/002-experience-lifecycle.md).

## Transições permitidas

| De → Para | Ação | Observação |
|---|---|---|
| Desejo → Planejamento | "Começar planejamento" | "Nós decidimos que vamos tentar fazer isso acontecer." |
| Planejamento → Desejo | voltar | Quando o casal não quer fazer agora. |
| Planejamento → Vivendo | iniciar | Manual, ou automática com data clara ([dates-and-automation.md](./dates-and-automation.md)). |
| Vivendo → Planejamento | voltar | |
| Vivendo → Memória | finalizar | Manual. Exige referência temporal ([dates-and-automation.md](./dates-and-automation.md#memória-exige-referência-temporal)). |

**Regra:** só existem as transições acima. O que não está escrito não é permitido nem deve ser implementado (por exemplo, Desejo → Vivendo direto, ou Memória → Vivendo).

Ambos do casal podem executar as transições.

Exemplo válido: Desejo → Planejamento → Desejo → Planejamento → Vivendo → Planejamento → Vivendo → Memória.

### Reversibilidade

- Desejo, Planejamento e Vivendo são **reversíveis** entre si, conforme a tabela.
- **Memória é final.** Não volta para Vivendo nem para nenhum estado anterior. O conteúdo da memória continua editável ([memory.md](./memory.md)).
- **Voltar de um estado nunca apaga registros acumulados.**
- Como finalizar não tem volta, ela pede confirmação explícita.

### Princípio

> **O aplicativo deve acompanhar a experiência, não controlar como o casal vive a experiência.** Mudar de estado não obriga a preencher campos daquele estado.

## Criação

O casal pode criar:

1. **Um desejo** — fluxo normal. Só o título é necessário.
2. **Uma memória** — para algo que aconteceu antes do aplicativo. Exige **título** e **referência temporal**.

Não é permitido criar diretamente em Planejamento nem em Vivendo.

> **Decisão:** [008](../decisions/008-direct-memory-creation.md). Princípio: *o planejamento pode ser incerto; a história precisa saber quando aconteceu.*

## Desejo

Informações opcionais: local, referência temporal pretendida (qualquer precisão), observações. A criação não pode virar formulário. Adicionar informação não obriga a começar o planejamento (ex.: "Campos do Jordão" + "Outubro" continua sendo desejo).

> Categorias são **futuro**: ver [future.md](./future.md).

## Planejamento

- Informação adicionada conforme o casal decide: referência temporal, local, observações. Outros tipos ficam em [future.md](./future.md).
- **Local** é um texto livre e opcional (ex.: "Campos do Jordão - SP", "Restaurante X"). Sem mapa, coordenadas, geocoding nem seleção obrigatória de endereço.
- **Fotos e observações** (registros) podem ser adicionadas já em Planejamento, como preparação: referências, fotos de lugares, informações sobre reservas ([memory.md](./memory.md#registros)).
- Tudo é opcional e editável. Datas mudam, locais mudam; alterar não exige criar nova experiência.
- Informação faltante não significa planejamento incompleto.
- Avançar não depende de preenchimento, depende de a experiência começar a ser vivida.

Exemplo de crescimento: "Campos do Jordão" → + "Outubro" → + "12 a 15 de outubro" → + local → + observações. São apenas possibilidades, não etapas obrigatórias.

> **O planejamento organiza a experiência; não deve impedir que ela aconteça.**

## Vivendo

- O foco é acompanhar e registrar, não repetir a tela de planejamento.
- Registros no MVP: **fotos** e **observações simples** ([memory.md](./memory.md#registros)).
- Registrar é opcional. O casal pode simplesmente viver.
- O planejamento não precisa ser seguido nem permanecer como estava.

## Finalização

Vivendo → Memória é **manual** no MVP. Depois de finalizar, o casal pode completar a memória (impressões, momento favorito, fotos). Nada disso é obrigatório e não há quantidade mínima.

## Cancelamento

- **Cancelar** significa: *o casal decidiu que essa experiência não deve mais existir no aplicativo.*
- É **definitivo** e exige **confirmação explícita**.
- Vale em qualquer estado, **inclusive Memória**.
- **Qualquer um dos dois** pode cancelar sozinho (confiança no casal).
- A experiência deixa de existir, junto com o que é dela (registros e fotos).
- Se o casal só não quer fazer agora, a experiência **volta para Desejo**.
- **Não existe** estado "Cancelado". Memória não é uma forma de cancelamento.

> **Decisão:** [006](../decisions/006-cancellation.md).

## Em aberto

Ver [open-questions.md](./open-questions.md).
