# Proposta de Visual Direction

> **Direção aprovada, valores finais pendentes** ([ADR 026](../../decisions/026-visual-direction-and-platforms.md)). Aprovados: direção "papel de álbum", neutros quentes, fotografia protagonista, fio vermelho, Fraunces e Figtree (condicionadas aos arquivos estáticos), tema claro no MVP. **Não fechados:** os valores finais das cores até verificar a distinção entre marca, aviso, erro e destrutivo. Nada aqui foi implementado. Valores e escolhas são para avaliação; depois da aprovação viram decisão registrada (ADR) e entram em `src/constants/theme.ts`. Ver [../design-direction.md](../design-direction.md) para a hierarquia de decisão e [../design-tools.md](../design-tools.md) para as ferramentas.

**Revisão desta versão:** paleta semântica separada (marca, interação, aviso, erro, destrutivo), tema claro como recomendação do MVP, demonstração dos dois estados de privacidade e do Início com muitos itens, viabilidade técnica em [technical-feasibility.md](./technical-feasibility.md). A paleta final continua **pendente de aprovação**.

Mock estático para avaliar a direção: [preview.html](./preview.html) (abrir no navegador; não é código do aplicativo).

## 1. Conceito: papel de álbum

> **Neutros contam a história. O vermelho conecta a história.**

O Laço é um álbum de papel quente em que as fotos são o centro e **um fio vermelho** costura os momentos. O vermelho é raro e por isso significa algo: conexão.

Referências de sensação (inspiração, não cópia): o bordado e a linha de costura; a fitinha amarrada a um pedido, tradição brasileira de atar um desejo (tomada só como imagem de "nó que marca um desejo", sem simbologia religiosa); álbuns de papel com legenda manuscrita; revistas editoriais de espaço generoso.

### Revisão contra os clichês (processo do `frontend-design`)

| Armadilha comum | Como evitamos |
|---|---|
| Creme + serifa de alto contraste + terracota | Marfim **mais frio e claro**, vermelho **carmim** (não argila), serifa **suave e só nos títulos**, interface em sans |
| Cartões idênticos, mesma sombra e mesmo raio | Listas editoriais separadas por espaço e fio fino; **sem sombra** no conteúdo; raios por função |
| Rótulo em caixa-alta acima de cada título | **Mantido por decisão do usuário (2026-10-16):** o rótulo curto em caixa-alta e espaçado (ex.: LAÇO, MEMÓRIA, NOITE) acima do título fica como parte da identidade. O resto do texto segue em minúsculas e sentença ([design-review-1.md](../../development/design-review-1.md)) |
| Vermelho em todos os botões | Botão primário em grafite; vermelho só no fio, no laço e em estados ativos |
| Coração como símbolo | Nenhum coração; o símbolo é o fio e o nó |
| Gradientes e vidro por tendência | Nenhum gradiente decorativo nem `expo-glass-effect` |

**O elemento memorável é um só: o fio.** O resto é calmo e disciplinado.

## 2. Paleta

Nomes em português para conversa; em código ficam nomes técnicos em inglês (mapeamento em [design-system.md](./design-system.md)). Razões de contraste (WCAG 2.x) **calculadas por script**.

### Modo claro ("marfim")

| Token | Hex | Papel |
|---|---|---|
| marfim | `#FAF6EE` | fundo das telas |
| papel | `#F2ECE0` | superfícies elevadas, campos, folhas |
| selecionado | `#E8E0D1` | item selecionado, pressionado |
| areia | `#D9CFBD` | filetes e divisórias (decorativos) |
| contorno | `#8A806F` | borda de campos e controles |
| grafite | `#2B2724` | texto e botão primário |
| cinza quente | `#6A6258` | texto secundário |
| fio | `#B3242B` | vermelho de assinatura: fio, laço, estado ativo |
| fio escuro | `#8E1A21` | fio pressionado, texto vermelho pequeno |
| fio suave | `#D38283` | fio decorativo (55 % sobre marfim) |
| aviso | `#8A5410` | atenção, não é falha (âmbar queimado) |
| erro | `#A3361C` | falha de validação ou de operação (ferrugem) |
| destrutivo | `#A3361C` | rótulo de ações irreversíveis (mesmo valor do erro; token próprio) |

### Modo escuro ("noite quente")

| Token | Hex | Papel |
|---|---|---|
| noite | `#1B1815` | fundo |
| superfície | `#26221E` | superfícies |
| selecionado | `#322D28` | selecionado, pressionado |
| borda | `#3D3731` | filetes |
| contorno | `#7F766B` | borda de campos |
| texto | `#F3EDE2` | texto e botão primário |
| cinza | `#B5ACA0` | texto secundário |
| fio | `#E5636A` | assinatura |
| fio suave | `#944548` | fio decorativo |
| aviso | `#E3A24F` | atenção, não é falha |
| erro | `#EE8A68` | falha de validação ou de operação |
| destrutivo | `#EE8A68` | rótulo de ações irreversíveis |

### Contraste (mínimos: texto 4,5 : 1; gráficos e controles 3 : 1)

| Par | Claro | Escuro |
|---|---|---|
| texto / fundo | 13,73 | 15,17 |
| texto / superfície | 12,58 | 13,55 |
| texto / selecionado | 11,29 | 11,69 |
| texto secundário / fundo | 5,56 | 7,89 |
| texto secundário / superfície | 5,10 | 7,05 |
| texto secundário / selecionado | 4,57 | 6,08 |
| vermelho (texto) / fundo | 6,08 | 5,32 |
| vermelho (texto) / superfície | 5,57 | 4,76 |
| vermelho escuro / fundo | 8,40 | — |
| texto do botão primário / botão | 13,73 | 15,17 |
| aviso / fundo | 5,80 | 8,04 |
| aviso / superfície | 5,32 | 7,18 |
| erro e destrutivo / fundo | 6,28 | 7,13 |
| erro e destrutivo / superfície | 5,75 | 6,37 |
| erro e destrutivo / selecionado | 5,16 | — |
| foco (grafite) / fundo, superfície, selecionado | 13,73 · 12,58 · 11,29 | — |
| contorno de campo / fundo | 3,61 | 3,96 |
| contorno de campo / superfície | 3,31 | 3,54 |

Exceção declarada: **fio suave** (2,67 : 1 e 2,70 : 1) é só decorativo, nunca carrega informação (a cronologia é dita também pelo texto). Filetes de **areia** (1,43 : 1) idem.

### Semântica das cores (valores pendentes de verificação)

Cada cor tem uma função e só ela. O vermelho da marca **não** é a cor de botão, de erro nem de exclusão.

| Função | Token | Cor | Onde aparece | Onde nunca aparece |
|---|---|---|---|---|
| **Identidade da marca** | `fio`, `fio escuro`, `fio suave` | carmim | o fio, o laço, o traço sob o item ativo da navegação | texto de estado, botões, campos, erros |
| **Interação** | grafite (`text`) | grafite | botão primário (preenchido), links (sublinhados), ícones de ação, foco visível (anel de 2 pt) | — |
| **Seleção** | `selecionado` + marca de seleção em grafite | marfim escuro | item selecionado ou pressionado, opção escolhida em seletores | vermelho |
| **Aviso** | `aviso` | âmbar | faixa "sem conexão", bloqueio temporário, algo a atentar que não falhou | falhas |
| **Erro** | `erro` | ferrugem | texto de ajuda de campo inválido, contorno do campo com problema, falha ao salvar; sempre com ícone e mensagem | fundos grandes, botões |
| **Ação destrutiva** | `destrutivo` | ferrugem | só o rótulo do botão "Excluir" dentro da confirmação, em botão contornado (nunca preenchido) | fora de confirmações |

Erro e destrutivo têm tokens separados com o mesmo valor inicial, para poderem divergir sem refatorar. **Erro** é *feedback* de estado; **destrutivo** é *ação*; a forma também os separa (mensagem em linha × botão contornado em diálogo).

**Risco declarado:** carmim (matiz ~357°), ferrugem (~12°) e âmbar (~33°) são vizinhos. Mitigações: o carmim nunca vira texto de estado; erro e aviso sempre vêm com ícone e mensagem; a cor nunca é a única informação. **A confundibilidade precisa ser avaliada visualmente no [preview](./preview.html).** Alternativa se não passar: erro e destrutivo em um tom fora da faixa quente (por exemplo, ameixa), ao custo de fugir da convenção do vermelho.

### Regras de uso do vermelho da marca
- **Permitido:** o fio; o laço; o traço sob o item ativo da navegação.
- **Proibido:** preencher botão primário; fundos grandes; texto longo; ícones em massa; erro; exclusão.

## 3. Tipografia

Duas famílias, com papéis claros, ambas livres (licença OFL 1.1 no Google Fonts; **confirmar na fonte antes de baixar**):

- **Títulos e voz de memória: Fraunces** (serifa suave, com calor humano). Semi-negrito para títulos; regular em itálico para impressões e legendas.
- **Interface e texto corrido: Figtree** (sans humanista, legível em tela pequena).

| Estilo | Família / peso | Tamanho / entrelinha | Uso |
|---|---|---|---|
| título de tela | Fraunces 600 | 30 / 36 | "O que queremos viver", "Nossa História" |
| título de experiência | Fraunces 600 | 24 / 30 | título em detalhe, Vivendo |
| subtítulo | Figtree 600 | 18 / 24 | seções |
| corpo | Figtree 400 | 16 / 24 | texto corrido, campos |
| corpo pequeno | Figtree 400 | 14 / 20 | metadados, ajuda |
| legenda | Figtree 500 | 13 / 18 | datas, contagens |
| botão | Figtree 600 | 16 / 20 | botões |
| voz | Fraunces 400 itálico | 18 / 28 | impressões, favoritos, legendas |

Regras: linhas com menos de ~70 caracteres; sem caixa-alta decorativa além dos rótulos curtos acima dos títulos (ver a tabela acima); escala do sistema respeitada (corpo cresce até 200 %, títulos limitados a 130 % para não quebrar o layout).

**Estado (E10):** implementado com 3 dos 5 arquivos previstos (Fraunces SemiBold, Figtree Medium e SemiBold); Figtree Regular e Fraunces Itálico ficam para quando houver uso ([phase-0-log.md](../../development/phase-0-log.md)).

**Carregamento:** `expo-font` já está instalado; **sem dependência nova**. No SDK 57 as fontes variáveis não são suportadas (o guia do Expo as lista a partir do SDK 58), então a proposta usa **arquivos estáticos** (5: Fraunces SemiBold e Itálico, Figtree Regular, Medium e SemiBold), carregados com `useFonts` atrás da abertura. O Google Fonts distribui só as variáveis; **como obter as instâncias estáticas e o peso dos arquivos estão pendentes de verificação**. Detalhes em [technical-feasibility.md](./technical-feasibility.md#1-tipografia-fraunces-títulos-e-figtree-interface). Fallback: serifa e sans do sistema.

## 4. O fio

Linguagem contínua, **sutil e abstrata**. Traço de 1,5 pt (2 pt no topo), pontas arredondadas, cor `fio`.

| Onde | Como |
|---|---|
| Topo das telas | um filete curto que entra pela borda esquerda e termina em uma pequena curva, acima do título |
| Nossa História | linha vertical `fio suave` à esquerda, ligando os meses; sem pontos em todo item |
| Mudança de estado | o fio se desenha durante a transição (ver [motion-and-accessibility.md](./motion-and-accessibility.md)) |
| Carregamento longo | filete que se traça no topo; só depois de 400 ms |
| Navegação | **exceção aprovada pelo usuário (2026-10-16):** na aba ativa, o fio forma um laço próprio de cada ícone; ao trocar de aba, o mesmo fio se desfaz, atravessa a barra em ondas e se enrola no ícone novo (de 1 a 1,5 s; com menos movimento pedido pelo sistema, só muda de lugar). O ícone é sólido e o laço é um anel em volta dele, passando por trás em cima e pela frente embaixo. Substitui o traço sob o item ativo |

Nunca em: botões, campos, cartões, ícones (salvo a exceção da navegação acima), cada item de lista.

## 5. O laço

O próprio fio forma um nó pequeno; **sem ícone literal de presente nem coração.** Aparece em poucos marcos:

1. conclusão da criação do Laço;
2. início do Planejamento (laçada curta);
3. finalização, quando a experiência vira Memória;
4. quando a segunda pessoa entra no Laço;
5. **exceção (2026-10-16):** na aba ativa da navegação, como assinatura constante. Com isso o laço deixa de ser só marco; a escolha é do usuário ([design-review-1.md](../../development/design-review-1.md)).

Opcional a aprovar: um nó estático discreto marcando a virada de cada ano em Nossa História.

## 6. Iconografia

Traço fino de 1,75 pt, pontas e cantos arredondados, grade de 24 pt, no mesmo gesto do fio. Conjunto mínimo (~14): início, desejos, história, mais, câmera, galeria, nota, compartilhar, copiar, configurações, confirmar, fechar, seta, voltar. Sem SF Symbols (só iOS) e sem emoji 📍 nas telas finais: o local usa ícone próprio.

**Implementado (2026-10-16), com aprovação do usuário:** `react-native-svg` 15.15.4 e o componente `Icone` (`app/src/components/icone.tsx`), com início (casa), desejos (estrela), história (álbum aberto), voltar (seta) e configurações (dois controles deslizantes). Os demais entram quando forem usados.

## 7. Ilustração

Poucas, pequenas (até ~120 pt), afetivas, **em linha única contínua** com o mesmo traço do fio, sem preenchimento: duas xícaras, um nascer do sol, uma janela, um banco de praça, uma câmera. Usos: Início vazio, Desejos vazio, Nossa História vazia, sem conexão, erro. Sem corações, sem personagens. *Limite honesto:* a arte final precisa ser desenhada por quem ilustra; aqui está a linguagem e o mock traz esboços provisórios.

## 8. Fotografia, destaque e ausência de imagem

- A foto é protagonista: sem moldura pesada, **sem sombra**, raio de 4 pt (canto de papel), proporção 4:5 em Nossa História e livre no detalhe.
- A interface recua: texto sobre foto só com a legibilidade garantida por área própria, nunca por gradiente decorativo.
- Legenda em Fraunces itálico, abaixo da foto.
- **Sem foto**, a memória usa uma **composição tipográfica**: fundo em um dos três neutros (papel, selecionado, areia), título grande em Fraunces, mês e ano pequenos e o fio cruzando. Sem vermelho em preenchimento e sem imagem inventada.
- Espera de carregamento da foto: `placeholder` do `expo-image` (já instalado) na cor `selecionado`.

## 9. Espaçamento e composição editorial

- Escala existente em `Spacing` (2, 4, 8, 16, 24, 32, 64); telas usam 4, 8, 16, 24, 32 e 64. Margem lateral 24; blocos separados por 32 ou 64, não por cartões.
- Largura máxima de leitura já existente (`MaxContentWidth`).
- Raios por função (nunca um só para tudo): foto 4, campo 10, botão 14, folha 20 (só o topo).
- Hierarquia: **um título por tela** em Fraunces; o resto em Figtree; no máximo dois níveis de cinza.
- Sombra só em folhas e diálogos.

## 10. Tema

**Aprovado ([ADR 026](../../decisions/026-visual-direction-and-platforms.md)):** o MVP tem **só o tema claro** e **não acompanha o tema escuro do sistema**. Os tokens do escuro podem ser preparados para o futuro. A tabela do escuro acima e o botão do [preview](./preview.html) mostram só a **prévia do que está preparado**, fora do MVP. Fotos nunca são escurecidas.
