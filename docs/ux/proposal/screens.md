# Proposta: aplicação às telas

> **PROPOSTA, não aprovada.** Esboços para avaliar a direção, não telas finais. Textos vêm de [../](../README.md) e são exemplos. Versão visual: [preview.html](./preview.html). Legenda: `~~~` é o fio vermelho; `∞` é o laço; `[ ]` é campo ou botão.

Navegação: **Início · Desejos · `+` · Nossa História**. Planejamento e Vivendo são contextos da experiência, não áreas.

## Ciclo em uma olhada

| Estado | Como a linguagem visual muda |
|---|---|
| Desejo | texto sobre marfim, quase sem estrutura: só o título |
| Planejamento | o fio faz a laçada e a experiência ganha um bloco de informações que crescem aos poucos |
| Vivendo | foco no agora: "Guardar este momento" em destaque; o planejamento fica recolhido |
| Memória | a foto de destaque assume; o fio fecha o laço; impressões em itálico |

## Entrada e criação do Laço

```
~~~~~~~~~~
Laço
Um lugar para viver, guardar e
contar a história de vocês.

O que traz você até aqui?

[ Quero começar nosso Laço ]   (grafite)
[ Quero entrar no nosso Laço ] (contorno)
```

Criação, um ambiente que se transforma (o fio acompanha):

```
~~~~~~~~~~                       ~~~~~~~~~~
Vamos começar pelo começo.        Escolham um código para o casal
Como podemos chamar você?         Pode ser uma palavra, data, apelido...
[ Seu nome        ]               [ Código do casal ]
[ Continuar ]                     [ Continuar ]
```

Conclusão (única celebração, com o laço):

```
        ∞
O Laço de vocês está criado.
Código do casal:  ► laranjeira ◄   (guardem e compartilhem)
[ Copiar ] [ Compartilhar ]
[ Entrar no Laço ]
```

Entrada: e-mail primeiro; e-mail cadastrado pede só a senha; e-mail novo pede o código e depois a senha com confirmação ([ADR 024](../../decisions/024-email-first-entry.md)).

## Início

Responde "o que está acontecendo conosco agora e o que vem depois?". Ordem da hierarquia já decidida ([ADR 014](../../decisions/014-home-and-location.md)): Vivendo, próximas com data, Planejamento, atalho para Desejos. **Sem pontuação, sem feed, sem painel.**

### Poucos itens

```
~~~~~~~~~~
Riquelme & Bianca            (ou "Riquelme · aguardando Bianca")

Vivendo agora
Fim de semana em Campos do Jordão
12–14 de outubro · Campos do Jordão
[ Continuar experiência ]

Nosso próximo momento
Jantar naquele restaurante que salvamos
18 de outubro · 20:00

Estamos preparando
Teatro · Acampamento · Restaurante japonês
Coisas que queremos viver · 12 desejos  ›

 Início   Desejos   (+)   Nossa História
```

### Muitos itens (8 em planejamento, 5 com data, 2 vivendo, 40 desejos)

```
~~~~~~~~~~
Riquelme & Bianca

Vivendo agora                                  <- bloco grande
Fim de semana em Campos do Jordão
12–14 de outubro · Campos do Jordão
[ Continuar experiência ]
  Também vivendo                                <- linha pequena
  Trilha de sábado                          ›

Nossos próximos momentos                        <- tamanho médio
Jantar no restaurante japonês     18 de outubro
Show da banda                    02 de novembro
Viagem a Gramado             20 de dezembro
  Ver todos                                 ›

Também estamos preparando                       <- texto corrido, pequeno
Teatro · Acampamento · Piquenique de inverno
  Ver planejamentos                         ›

Coisas que queremos viver · 40 desejos      ›   <- só atalho
```

**Como a interface mantém a hierarquia com muitos itens (sem regra nova):**

1. **O tamanho cai a cada bloco**: Vivendo é grande; próximos, médios; "preparando", texto corrido pequeno; Desejos, uma linha. O olho lê de cima para baixo na ordem decidida.
2. **Teto por bloco** (provisório, aprovado no [ADR 027](../../decisions/027-home-limits-and-past-planning.md)): Vivendo 1 em destaque + até 2 compactas; próximos 3; Planejamento 3; o resto atrás de "Ver todos" (próximas com data) e "Ver planejamentos" (todas em Planejamento, com ou sem data).
3. **Nada sinaliza urgência nem antiguidade**: sem emblemas, contadores de atraso, vermelho ou "há 3 meses". Uma experiência antiga em Planejamento não ganha destaque; na ordem já decidida ela desce sozinha.
4. **Nenhuma pontuação.** Só a ordem do [ADR 014](../../decisions/014-home-and-location.md): Vivendo por referência temporal (sem ela, a atualizada mais recentemente); próximos em ordem cronológica; Planejamento sem data pela atualização mais recente.
5. **Desejos** continuam só como atalho com a contagem já prevista, sem listar desejos.

**Decidido ([ADR 027](../../decisions/027-home-limits-and-past-planning.md)):** os limites acima são provisórios; "Ver todos" e "Ver planejamentos" são telas secundárias de Início, sem nova aba; um Planejamento de data passada fica em Planejamento sem alerta de atraso.

**Ainda sem regra:** se um Planejamento de data passada aparece entre os três de Planejamento ou só em "Ver planejamentos" (a ordem do ADR 014 não o cobre).

Início recém-criado: estado vazio contextual com uma ilustração e "Criar nosso primeiro desejo", sem repetir a celebração.

## Desejos, criar e editar

```
O que queremos viver
─────────────────────────
Ver o nascer do sol juntos
Conhecer Campos do Jordão
  Outubro · Campos do Jordão
Fazer um piquenique
```

Criar: "O que vocês querem viver?" + um campo + **Adicionar desejo**. Editar (abrir o desejo): título; abaixo, **opcionais** (local, quando, observações) já visíveis como linhas discretas "Adicionar local", "Quando", "Observações", sem etapas e sem obrigatoriedade. Ação principal: **Começar planejamento**.

## Planejamento

```
~~~~~~~~∞   (a laçada acontece ao começar)
Conhecer Campos do Jordão
Planejando
12–14 de outubro · Campos do Jordão
Observações ...
Fotos e referências  [ + ]
─────────────────────────
Começar a viver          (grafite)
Voltar para desejos      (texto)
⋯ ações: Excluir esta experiência
```

Se não houver nada além do título, não é erro: nenhuma mensagem de "faltam informações".

## Vivendo

```
~~~~~~~~~~
Conhecer Campos do Jordão
12–14 de outubro · Campos do Jordão

[ Guardar este momento ]  (foto ou observação)

Planejamento ›  (recolhido)
─────────────────────────
Finalizar experiência   Voltar para planejamento
```

Sem porcentagem, sem cobrança por registros.

## Transição para Memória

```
Finalizar experiência?
Ela vira uma memória e não volta para Vivendo.
[ Finalizar ]   [ Ainda não ]
        ↓
Quando vocês viveram isso?   (só se não houver data)
        ↓   o fio fecha o laço
Essa experiência virou uma memória.
```

## Nossa História

```
Nossa História
Tudo o que já vivemos juntos.

│  Outubro de 2026
│  ┌────────────┐
│  │   foto     │  Campos do Jordão
│  └────────────┘  12–14 outubro · 2026
│  Nosso primeiro teatro (sem foto: composição tipográfica)
│  24 de outubro
│
│  Setembro de 2026
│  ...
│
E ainda tem muito por viver.   ~~~~~~~ (o fio continua)
```

Ordem: meses do mais recente ao mais antigo; dentro do mês, cronológica crescente; mês/ano sem dia em posição própria e discreta, sem sugerir um dia.

## Detalhe de uma memória: os dois estados de privacidade

Regra ([permissions.md](../../product/permissions.md#privacidade-da-impressão-e-do-momento-favorito)): a impressão e o momento favorito da outra pessoa só aparecem **depois que a pessoa atual registra a própria impressão** (texto não vazio). O conteúdo compartilhado (fotos, observações, data, local) é **sempre** visível. Cada pessoa vê, edita e altera **os seus** nos dois estados.

### Estado 1: ainda não registrei a minha impressão (inclui "escrever depois")

```
[ foto de destaque, grande ]
Campos do Jordão
12–14 outubro 2026 · Campos do Jordão

Fotos                      (visível)
O que aconteceu            (visível)

Nossos momentos
  Meu momento favorito     [foto]   Alterar
  Da outra pessoa          ┌──────────────────────────────┐
                           │ A impressão e o momento      │
                           │ favorito da outra pessoa     │
                           │ serão revelados quando você  │
                           │ registrar a sua impressão.   │
                           └──────────────────────────────┘

O que ficou para nós
  Minha impressão          [ Escrever minha impressão ]
```

- O bloco oculto tem **sempre o mesmo texto e a mesma altura**, esteja a outra pessoa com conteúdo ou não: **a interface não revela se ela já escreveu**.
- Se a pessoa escolheu "Escrever depois", a memória existe normalmente e a tela é exatamente esta.
- Se a pessoa **apagar** a própria impressão depois, volta a este estado (a visibilidade é decidida na leitura).

### Estado 2: já registrei a minha impressão

```
[ foto de destaque, grande ]
Campos do Jordão
12–14 outubro 2026 · Campos do Jordão

Fotos · O que aconteceu    (visíveis)

Nossos momentos
  Meu momento favorito     [foto]   Alterar
  Momento favorito de Bianca  [foto]
                              (ou: "Bianca ainda não escolheu o dela.")

O que ficou para nós
  Minha impressão
    “Quero lembrar do silêncio depois da chuva.”     Editar
  Impressão de Bianca
    “Foi a primeira vez que a gente ficou sem pressa.”
                              (ou: "Bianca ainda não registrou a dela.")
```

- Só aqui a tela pode dizer que a outra pessoa **ainda não** escreveu ou escolheu, porque quem registrou já tem direito de ver o conteúdo dela.
- Os textos de impressão usam a "voz" (Fraunces itálico).
- Editar a própria impressão ou trocar o próprio favorito não muda o que a outra pessoa tem.

## Configurações da conta

```
Configurações
Seu nome   [ Riquelme ]
[ Sair da conta ]
```

Simples, sem nova área principal. Ponto de entrada: ícone discreto no topo de Início (a aprovar).
