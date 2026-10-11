# Desejos e Planejamento

Regras de produto: [../product/lifecycle.md](../product/lifecycle.md), [ADR 002](../decisions/002-experience-lifecycle.md), [006](../decisions/006-cancellation.md), [022](../decisions/022-entry-flow-and-solo-use.md), [025](../decisions/025-wish-optional-fields.md). Pendências: [open-questions-ux.md](./open-questions-ux.md).

## Desejos

Apresentada como:

> **O que queremos viver**

e não como backlog ou lista de tarefas. **Lista editorial vertical**; sem Kanban, colunas, cards de gestão, backlog ou tarefas. Transmite: *coisas que ainda queremos viver juntos.*

**Desejos contém só experiências no estado Desejo.** Planejamento não aparece como categoria ou seção dentro de Desejos; aparece na própria experiência e em Início quando relevante. A contagem de desejos considera só o estado Desejo.

### Item de desejo

O **título** é a única informação essencial. Ex.: "Conhecer Campos do Jordão", "Ir ao teatro", "Fazer um piquenique". Sem categoria nem descrição obrigatórias; sem entidade de categoria. "Uma viagem que queremos fazer juntos" é simplesmente o título de um desejo. O título pode ser editado antes de iniciar o planejamento.

**Informações opcionais** ([ADR 025](../decisions/025-wish-optional-fields.md)): ainda em Desejo, a pessoa pode adicionar ou editar **local**, **referência temporal pretendida** (qualquer precisão) e **observações**. Nenhuma é obrigatória nem exige iniciar o Planejamento; **só o título é necessário para salvar**. Ao passar para Planejamento, tudo é preservado: é a mesma experiência.

Não usar "STATUS: PLANEJANDO". A mudança de estado deve parecer evolução da experiência, não mudança de coluna.

### Criar um desejo

"Um desejo" no `+`:

> **O que vocês querem viver?**
> `[ Ex.: Ver o nascer do sol juntos ]` · **Adicionar desejo**

Nenhum outro campo. Depois de criar: volta à lista, o novo desejo aparece de forma suave, e **não** abre formulário de planejamento.

### Abrir um desejo

Apresenta o contexto da experiência. Se for só uma ideia:

> **Ainda é só uma ideia por enquanto.**

Ação principal: **Começar planejamento**.

## Transição Desejo → Planejamento

Não é mover um card de status; é **o mesmo desejo evoluindo**. Ao tocar em **Começar planejamento**, uma pequena animação:

- o fio vermelho se movimenta e faz uma pequena curva/laçada;
- o conteúdo se reorganiza, com mudança visual discreta;
- duração curta, cerca de **300–500 ms**, sem efeitos excessivos.

Depois:

> **Vamos começar a dar forma a isso.**

## Planejamento

A experiência mostra o título e **Planejando**, com as informações que já existirem (ex.: 12–14 de outubro, Campos do Jordão). Se não houver nenhuma, não é erro nem formulário incompleto.

**No MVP**, Planejamento trabalha com: **referência temporal**, **local**, **observações**, **fotos/registros** e acesso às informações já existentes. **Fora do MVP** (podem existir depois, sem aparecer na interface agora): roteiro, reservas, orçamento, hospedagem, checklist, transporte, como chegar, mapas e navegação. A arquitetura pode se preparar para evoluir, mas não antecipa esses módulos na interface.

> Começar o planejamento significa decidir que queremos tentar tornar a experiência real. Não significa preencher um formulário.

## Referência temporal

O casal **escolhe explicitamente a precisão**: mês/ano ("Outubro de 2026"), data ("12 de outubro de 2026"), data + horário ("12 de outubro de 2026, 19h") ou período ("12–14 de outubro de 2026").

A precisão escolhida é **preservada**. O aplicativo não transforma uma referência menos precisa em mais precisa: "Outubro de 2026" não vira "01/10/2026" internamente para facilitar a interface. O desenho do seletor é decisão de design (UX-V12).

## Ações de transição

Dentro do contexto da experiência, sem depender só da automação. Os nomes podem ser refinados, o significado permanece.

| De → Para | Ação |
|---|---|
| Desejo → Planejamento | **Começar planejamento** |
| Planejamento → Desejo | **Voltar para desejos** |
| Planejamento → Vivendo | **Começar a viver** |
| Vivendo → Planejamento | **Voltar para planejamento** |
| Vivendo → Memória | **Finalizar experiência** ([living-and-memory.md](./living-and-memory.md#finalizar)) |

Memória é estado final e não retorna para Vivendo.

## Excluir

Disponível **dentro da experiência**, em uma área de **ações secundárias**; não é ação primária. Pede **confirmação explícita**, por exemplo:

> **Excluir esta experiência?**
> Essa ação é definitiva e remove a experiência e seus registros.

A experiência é **excluída, não arquivada**. Se o casal só desistiu por ora, deve poder **voltar para Desejo**. Vale também para memórias.
