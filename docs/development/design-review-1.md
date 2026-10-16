# Revisão de design 1 (log)

Primeira revisão de design do app, feita com o Impeccable (`critique`) sobre prints tirados no celular do usuário (Android, Expo Go, via `adb`). A direção continua sendo a de [visual-direction.md](../ux/proposal/visual-direction.md). Cópia da análise: `.impeccable/critique/2026-10-16T04-40-35Z__app-src.md`.

> **Estado: concluída** (2026-10-16). Conferida no celular por prints e aprovada pelo usuário no aparelho.

**Nota antes:** 25/40 (aceitável). Base de identidade boa; problemas de hierarquia nas telas da experiência e de navegação.

## Decisões do usuário
- **Escopo:** tudo, inclusive as observações menores.
- **Rótulos em caixa-alta mantidos:** contrariam a proposta original, mas ficam como identidade. Registrado em [visual-direction.md](../ux/proposal/visual-direction.md).
- **Dados de teste:** permitido criar e mudar experiências no ambiente atual para avaliar todos os estados. O planejamento "Novo desejo" passou para Vivendo.
- **Memória com data futura continua permitida:** o usuário não quer bloqueio.
- **Laço na aba ativa** (pedido do usuário): exceção à regra "o fio nunca em ícones", registrada em [visual-direction.md](../ux/proposal/visual-direction.md).
- **Ícones próprios com `react-native-svg`** (aprovado): substituem os Material Symbols que tinham entrado para o voltar e os Ajustes.

## O que mudou
**Telas da experiência** (`app/experiencia/[id].tsx`)
- O cabeçalho mostra o **título da experiência**. A frase do estado ("Vamos começar a dar forma a isso.") fica abaixo como subtítulo; na memória, o subtítulo é quando e onde foi. As frases secundárias ("Juntem o que já decidiram…", "Guardem o que estão vivendo.") saíram.
- **Memória:** a foto de destaque fica logo abaixo do título e acompanha as três abas. A aba Memória deixou de repetir foto e título.
- **Momentos:** em Vivendo, as ações continuam no topo, com "Tirar foto" em destaque. Em Planejamento e na Memória, as fotos vêm primeiro e as ações descem, em botões secundários.
- A grade de fotos ocupa a largura toda (o lado da miniatura é medido). Sem filete duplo entre as abas e o primeiro dia ou a primeira seção.

**Navegação**
- **Seta de voltar no topo** (`ScreenHeader`, prop `onBack`) na experiência, nos Ajustes, nas listas completas e na tela de criar. Saíram o "Voltar" e o "Fechar" do fim das páginas; o "Cancelar" de criar continua.
- **Ajustes** viram um ícone de engrenagem ao lado do nome do casal, no Início (prop `action`). Ícones pelo `expo-symbols`, que já estava instalado (Material Symbols no Android).
- O **menu do `+`** sobe acima da barra de navegação do Android.

**Observações menores**
- Botões de texto alinham com a margem do conteúdo (sem recuo lateral).
- **Datas sempre por extenso:** "17 de outubro de 2026", "17 de outubro de 2026, 19:30", "28 de dezembro de 2026 a 2 de janeiro de 2027".
- **Nossa História:** meses em Fraunces; itens em "Em algum dia de…" mostram só o local; enquanto a foto carrega, o fio aparece no lugar dela; fotos com o raio de foto (4).

**Ícones e laço nas abas**
- `Icone` (`components/icone.tsx`): ícones no traço da direção (grade de 24, linha de 1,75, pontas arredondadas). Início = casa, Desejos = estrela, Nossa História = álbum aberto; também a seta de voltar e os Ajustes (dois controles deslizantes). O `expo-symbols` deixou de ser usado.
- **Barra de abas própria** (`components/barra-de-abas.tsx`), no lugar da padrão, pedida pelo usuário depois da primeira versão (em que cada aba só desenhava o próprio laço, rápido demais e igual nas três):
  - **Um fio só, que viaja:** ao trocar de aba, o laço se desfaz no ícone de origem, o fio atravessa a barra (por trás do `+`) e se enrola no de destino, em 650 ms, mantendo quase o mesmo comprimento o tempo todo. Feito com o `Animated` do React Native redesenhando o trecho visível do caminho; o Reanimated exigiria preparar outro módulo nativo nos testes.
  - **Um laço por ícone:** casa (volta por cima e nó embaixo, como fita), estrela (nó no alto, pendurada) e álbum (contorna o livro e fecha num laço de fita no canto).
  - Com menos movimento pedido pelo sistema, o laço só muda de lugar. O fio é decorativo; as abas têm papel de aba, rótulo e estado de selecionada.
  - **Toque contido:** sem o efeito de toque padrão do Android, que passava da barra e entrava na área da barra do sistema; ao tocar, ícone e rótulo só clareiam.
- A barra ficou 8 pt mais alta (72) para caber ícone, laço e rótulo.

**Fio entrelaçado em 3D (pedido do usuário, 2026-10-16)**
- Os ícones da barra ficaram **sólidos** (preenchidos com a cor do papel; `Icone` ganhou `preenchimento` e a silhueta de cada um). O fio é desenhado em duas camadas: a de trás, que some atrás do ícone, e a da frente, só com os trechos que cruzam por cima, com uma borda cor de papel que faz um traço passar sobre o outro.
- Cada laço virou um **anel em volta do ícone, como o de Saturno**: a metade de cima passa por trás e a de baixo pela frente; depois da volta, o fio cruza a própria chegada no nó. Casa: anel quase deitado, nó à esquerda. Estrela: anel inclinado para o outro lado, nó à direita. Álbum: anel em pé, como fita amarrando o livro pela lombada. Uma primeira tentativa, com o fio cruzando a frente em diagonal, formava um X sobre a casa ("cancelado") e foi descartada.
- **Fio mais marcado:** espessura 2,5.
- **Viagem mais lenta e em ondas:** cerca de 1 s entre abas vizinhas e 1,5 s de Início a Nossa História (800 ms + 230 ms por aba); a travessia ondula com uma crista por aba atravessada, passando por trás dos ícones e do `+`.

## Fora desta rodada
- Os chips de "Quando" continuam quebrando em duas linhas: cinco opções não cabem numa linha sem diminuir o toque.
- O filete vermelho à esquerda das observações foi mantido: é o fio do Laço.
- O onboarding não foi revisto (exigiria sair da conta).
- A auditoria de código (`expo-design-system`), com 31 tamanhos de fonte fixos nas telas, ficou para depois.

## Validação (2026-10-16)

| Verificação | Resultado |
|---|---|
| `npm test` (app) | 17 arquivos, **244 testes** (novos: ordem das ações em Vivendo e na memória; cabeçalho e voltar da memória; abas com rótulo, seleção e troca) |
| Abas no celular (prints ampliados) | laço próprio em cada ícone; com a viagem temporariamente em 3 s, quadros mostraram o laço se desfazendo, o fio atravessando por trás do `+` e se enrolando no destino; aba pressionada sem destaque fora da barra |
| `tsc`, `expo lint` | sem erros nem avisos |
| Celular (prints) | Início, planejamento, Vivendo, Nossa História, memória (três abas), `+` e Ajustes conferidos |

A animação do laço não aparece em prints: confira no celular.
