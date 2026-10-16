# Memória e Nossa História

Fonte de verdade de registros, memória, impressão pessoal, momento favorito, foto de destaque e Nossa História.
Estado Memória: [lifecycle.md](./lifecycle.md). Visibilidade: [permissions.md](./permissions.md#privacidade-da-impressão-e-do-momento-favorito).
**Decisão:** [005](../decisions/005-memory-and-impressions.md), [010](../decisions/010-explicit-typed-records.md), [012](../decisions/012-favorite-moment-and-cover-photo.md), [013](../decisions/013-records-in-planning.md).

## Memória

A memória é a experiência que terminou, no estado final **Memória**. **Não é uma entidade separada**: a mesma experiência segue existindo e a memória preserva o contexto acumulado em Desejo, Planejamento e Vivendo.

> **A experiência termina. A memória continua.**

- Os **registros** feitos antes (Planejamento e Vivendo) passam a compor o conteúdo da memória.
- O conteúdo da memória **continua editável** depois de criada: adicionar fotos, complementar registros, alterar foto de destaque e momento favorito, escrever ou editar a impressão.
- A memória pode reunir (conforme os recursos implementados): fotos, registros, momento favorito e impressão de cada pessoa, referência temporal, local, e o contexto de planejamento.
- Não existe quantidade mínima de nada. Uma memória com uma foto, ou sem foto, é válida.
- A memória nunca é escrita por IA no MVP.

## Registros

**Registro** = informação acumulada durante uma experiência.

- **MVP:** fotos e observações simples.
- Podem ser adicionados em **Planejamento**, **Vivendo** e **Memória**. Em Desejo, não está definido (não implementar).
- O estado dá contexto, não permissão: em Planejamento são registros de preparação (referências, fotos de lugares, observações de reserva); em Vivendo, do que acontece; em Memória, preservados como parte da história.
- **Não são apagados** quando a experiência muda de estado.
- Têm **autor**. Ambos podem adicionar, editar e excluir ([permissions.md](./permissions.md)).
- Fotos entram pela câmera ou pela galeria do aparelho, inclusive depois.
- Cada tipo é uma estrutura **explícita e tipada**, sem "bloco genérico" nem editor livre estilo Notion.
- A observação é um registro próprio, só texto, e não uma legenda de foto. Fotos e observações aparecem juntas na aba **Momentos** da experiência ([ADR 029](../decisions/029-moments-tab-and-create-choice.md)).
- A observação é **do momento**: pertence a um dia e a um período (madrugada, manhã, tarde, noite), por padrão o atual, que a pessoa pode escolher e alterar (nunca no futuro).
- Cada foto pode ter uma **legenda** opcional (até 300 caracteres), escrita ou alterada por qualquer um dos dois ([ADR 030](../decisions/030-photo-caption-and-observation-moment.md)).
- Outros tipos (vídeos, gastos, roteiro…) são futuro: [future.md](./future.md).

## Impressão pessoal

- Cada pessoa registra a própria percepção; nunca um texto único escrito em conjunto.
- Pergunta curta e aberta. Exemplos: "Como foi essa experiência para você?", "O que você vai querer lembrar dessa experiência daqui a alguns anos?"
- Escrita opcional. Pode escolher **"Escrever depois"** sem impedir a memória.
- Só a própria pessoa cria, edita, apaga e reescreve a sua. Regra de visibilidade: [permissions.md](./permissions.md#privacidade-da-impressão-e-do-momento-favorito).

## Momento favorito

- Cada pessoa escolhe o seu, **sem ranking**.
- **No MVP é sempre uma foto** da própria memória. Observações não podem ser momento favorito. Outros formatos são futuro.
- Na memória aparece associado à respectiva pessoa. Mesma regra de visibilidade da impressão.
- Não confundir com a foto de destaque.

## Foto de destaque

- Representa visualmente a experiência em Nossa História.
- É **escolhida manualmente**, entre as fotos da própria memória, por **qualquer um dos dois**, e pode ser trocada depois.
- **Não há escolha automática**: nem a primeira, nem a última, nem o momento favorito.
- Sem foto escolhida (ou sem fotos), a memória aparece normalmente, sem destaque.
- Pode ser escolhida **já em Planejamento e em Vivendo**, entre as fotos da experiência, e segue para a memória. No Início, a experiência em destaque de Vivendo aparece como cartão com essa foto; sem ela, com um substituto ([ADR 028](../decisions/028-cover-photo-before-memory.md)).

## Nossa História

Área que apresenta as experiências que viraram Memória, como a história construída pelo casal.

- Não é uma galeria genérica. Tem caráter **editorial, cronológico e de álbum**.
- A listagem usa: **foto de destaque** (quando existir), **título** e **agrupamento por mês/ano**.
- O mês/ano vem da referência temporal da memória. Se for um **período**, vale o **mês de início**; a memória aparece **uma só vez**, mesmo que o período cruze meses ou anos (28/10/2026 → 02/11/2026 aparece em outubro de 2026; 30/12/2026 → 03/01/2027, em dezembro de 2026). O período completo aparece ao abrir a memória.
- A quantidade de registros não define a importância na história.
- Ao abrir uma memória, o casal encontra o contexto acumulado, com a sensação de revisitar um momento, não de ler um relatório.

> **Memória guarda. Nossa História conta.**

## Foto excluída

Se a foto apontada pelo momento favorito ou pelo destaque for excluída, o ponteiro é limpo: o favorito volta a "não escolhido" e a memória fica sem destaque, sem substituta automática ([ADR 020](../decisions/020-photos-and-deletion.md)).
