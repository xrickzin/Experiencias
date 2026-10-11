# Vivendo, finalização e Memória

Regras de produto: [../product/lifecycle.md](../product/lifecycle.md), [memory.md](../product/memory.md), [permissions.md](../product/permissions.md), [ADR 005](../decisions/005-memory-and-impressions.md), [012](../decisions/012-favorite-moment-and-cover-photo.md), [022](../decisions/022-entry-flow-and-solo-use.md). Pendências: [open-questions-ux.md](./open-questions-ux.md).

## Vivendo

A interface muda de foco. Planejamento responde "Como vamos fazer isso acontecer?"; Vivendo responde:

> O que está acontecendo conosco agora?

Não é o planejamento com outro rótulo. Ações de transição: [wishes-and-planning.md](./wishes-and-planning.md#ações-de-transição).

### Conteúdo no MVP

- **Contexto:** nome da experiência, data/período, localização quando existir.
- **Registros:** adicionar foto; registrar observação.
- **Planejamento existente:** acesso às informações planejadas. Roteiro está fora do MVP; se não houver nada planejado, não criar espaço vazio dizendo que falta planejamento.

### Linguagem durante Vivendo

Evitar transformar o momento em produção de conteúdo: sem progresso de documentação, porcentagem registrada ou cobrança por fotos/observações. Preferir **Guardar este momento** a "Adicionar registro". O casal decide o que vale preservar.

## Finalizar

Ação **Finalizar experiência**, sempre com **confirmação explícita**: a confirmação deixa claro que a ação muda o estado e inicia a transformação em Memória, e que não tem volta. Nunca um botão que finaliza irreversivelmente sem confirmar. **Finalizar** (vira Memória) é diferente de **excluir** (remove definitivamente).

> **Essa experiência virou uma memória.**

A memória é então registrada/enriquecida.

### Finalizar sem data

Uma experiência não entra em Memória sem referência temporal. Se não houver, a finalização é **interrompida** e a interface pergunta:

> **Quando vocês viveram isso?**

A pessoa escolhe mês/ano, data, data + horário ou período ([wishes-and-planning.md](./wishes-and-planning.md#referência-temporal)). **A primeira pessoa que a definir fixa a referência.** Depois, a experiência pode ser finalizada.

## Memória

Estado final: **preservada e não retorna para Vivendo.** A experiência terminou, mas a memória continua editável.

> A experiência termina. A memória continua.

### Criar diretamente uma memória

"Uma memória" é a porta de entrada para o que aconteceu **antes** do aplicativo. O fluxo pede só o necessário: **título** e **referência temporal**. Depois a pessoa pode adicionar fotos, momento favorito e impressão. Sem formulário longo; a memória pode ser criada sem fotos e sem impressão.

### Conteúdo ao finalizar

Cada pessoa pode adicionar/selecionar fotos, escolher seu momento favorito e escrever sua impressão. **Nada é obrigatório**, exceto a referência temporal.

### Fotos

A pessoa pode **adicionar várias fotos**, **escolher da galeria**, **remover** e **alterar** as escolhas depois.

- **Foto de destaque:** representa a memória em Nossa História; **compartilhada** como parte da experiência; escolhida manualmente. Nunca a primeira, a última, a "melhor por IA" nem o favorito automaticamente.
- **Momento favorito:** escolha **pessoal** de cada pessoa; no MVP é sempre **uma foto**. Observações são elementos separados. Sem ranking nem avaliação.

Sem fotos, a memória continua válida: não inventar imagem; usar composição visual de tipografia, espaço e identidade do Laço.

### Impressões individuais

> A impressão pertence individualmente à pessoa que a escreveu.

Cada pessoa pode criar, editar, apagar e reescrever a própria. Apagar volta ao estado "não registrada" e não afeta a do outro.

**"Escrever depois"** existe: a memória pode ser finalizada sem a impressão, e a pessoa volta quando quiser.

### Revelação

Cada pessoa só vê a impressão da outra **depois de registrar a própria**; o **momento favorito** segue a mesma lógica. Exemplo: Riquelme registra a sua e vê a própria; a de Bianca permanece oculta enquanto ela não registrar a dela; quando Bianca registra, as duas ficam visíveis. A memória inteira **não** é bloqueada.

**Linguagem sem cobrança.** Evitar "Seu parceiro já escreveu. Escreva também!". Preferir algo neutro:

> **A impressão da outra pessoa será revelada quando você registrar a sua.**

A interface não revela desnecessariamente se a outra pessoa já escreveu: o aviso neutro aparece da mesma forma, a quem ainda não registrou a própria impressão, independentemente do estado da outra.

### Registros

Pertencem à experiência e podem existir em Planejamento, Vivendo e Memória. No MVP: fotos e observações. Preservam quem os criou. Ambas as pessoas podem adicionar, editar e remover os registros compartilhados.
