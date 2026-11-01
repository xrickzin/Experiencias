# 044 — Desejos como céu e o Início na voz do álbum

**Status:** Aceita (aprovação do usuário, 2026-10-31). Muda só a apresentação; nenhuma regra de produto muda. Proposta visual: [../ux/proposal/ceu-de-desejos.html](../ux/proposal/ceu-de-desejos.html). Crítica que motivou: [../ux/album.md](../ux/album.md).

## Desejos
- Cada desejo é uma **estrela** com o título e, embaixo, quando e onde. O fio liga os desejos da mesma categoria (a primeira de cada um), como constelações.
- **Horizontes**, de cima para baixo:
  - **Em breve:** com data nos próximos 90 dias, ou já passada;
  - **Algum dia:** com data mais longe;
  - **Sem pressa:** sem data.
- **Achar um desejo:**
  - a **busca** fica no topo e procura no título, no local e nas observações, sem diferenciar acentos;
  - os **filtros** de categoria e duração continuam; no céu, o que não combina fica apagado, como contexto, e não é anunciado pelo leitor de tela;
  - **Céu ou Lista:** a lista mostra os mesmos desejos em linhas, agrupados pelos horizontes. O aparelho lembra o último modo escolhido.
- **Sementes:** começos de frase ("Um lugar que nunca fomos…") que abrem a criação com a frase como exemplo do campo.
- Uma estrela cintila de vez em quando, nunca com "reduzir movimento" ligado.
- Ainda não existe a marca "novo" da proposta: o desejo não guarda quando foi criado.

## Revisão de 2026-10-31 (críticas independentes com o impeccable)
- **Controles:** "Céu | Lista", categorias e duração saem da tela e vão para uma folha ("Como ver o céu"), aberta por um botão só abaixo da busca, que diz o que está valendo ("Céu · todas as estrelas", "Lista · Filme"). A folha mostra quantos desejos ficam ("Ver 3 desejos") e oferece "Limpar filtros".
- **Busca:** procurando, só a lista do que combina; o céu volta quando a busca é limpa. Um "x" limpa a busca (o do iOS não existe no Android).
- **Horizonte "Algum dia"** no lugar de "Um dia", que colidia com a duração "Um dia".
- **Sem o botão "Adicionar desejo"** na tela: o "+" da barra e as sementes criam. As sementes sobem para logo abaixo do céu ("ou comecem por uma frase"), mais leves (só o fio embaixo), com "Outra coisa…" para começar em branco.
- **Céu com poucas estrelas:** "Ainda cabem muitas estrelas aqui.", que abre a criação.
- **Criar desejo como acalento:**
  - sem rótulo acima do título; "O que vocês sonham viver?" e "Uma frase basta. O resto pode esperar.";
  - a frase do desejo grande, em Fraunces, sem caixa nem asterisco, sublinhada pelo fio;
  - a semente vira o exemplo do campo, sem preencher o título;
  - quando, onde, que tipo, alguma lembrança e "mais para planejar" (roteiro e orçamento) viram perguntas de uma linha que se abrem ao toque, com a resposta à direita;
  - "Guardar no céu"; voltar com a frase escrita pede confirmação ("Deixar esse desejo para depois?");
  - de volta ao céu, a estrela nova cintila.
- A criação de memória continua com o fluxo anterior.

### Segunda rodada
- **Filtro e modo numa linha:** à esquerda, um botão que diz quais estrelas estão acesas ("Todas as estrelas", "Só Filme · Uma noite") e abre a folha "Quais estrelas acender"; à direita, o link "ver em lista" / "ver o céu". O modo escolhido fica guardado no aparelho.
- **A folha aplica na hora:** sem botão principal; mostra "N estrelas acesas", "Limpar filtros" e "Pronto".
- **Busca como linha de caderno** (Fraunces, sublinhada), sem caixa; o resultado usa as mesmas linhas da lista.
- **Sementes só com poucos desejos** (menos de 6). **Vazio:** o próprio céu limpo ("O céu de vocês ainda está limpo. Uma estrela começa com uma frase.") com as sementes, no lugar do estado vazio genérico.
- **Céu:** colunas que não se tocam, títulos em até 3 linhas.
- **Criar:** a pergunta "Por quanto tempo?" separa a duração; "Quando?" usa palavras humanas ("Sem pressa", "Num mês", "Num dia", "Dia e hora", "Uns dias"); local e lembrança viram linhas de caderno; "Que tipo de desejo?" sem "Editar categorias" (que levaria para Ajustes no meio do rascunho); "Querem já ir planejando?" com roteiro e orçamento compactos (uma linha e "ver um exemplo"). Cada pergunta sem resposta mostra um "+".

### Terceira rodada
- **Itálico de verdade:** a voz do álbum usava a Fraunces SemiBold inclinada pelo Android. Entra o arquivo `Fraunces-Italic.ttf` (corte de 9pt, peso regular, OFL) e o token `FontFamily.voz`.
- **Céu:** todos os títulos em cor de texto, retos; a proximidade aparece no tamanho e no brilho da estrela (maior em "Em breve", menor e apagada em "Sem pressa"). O céu vai até as bordas da tela, sem cantos de cartão; o fio fica mais discreto; estrelas apagadas não abrem; a fonte cresce até 1,2x no céu, cujas linhas são medidas. Sem o convite dentro do céu: vazio, só "O céu de vocês ainda está limpo.", e as ideias abaixo ("Uma ideia para começar").
- **Controles:** o filtro vira uma legenda sem caixa ("Todas as estrelas ⌄", sublinhada pelo fio quando filtra) e some quando não há categoria nem duração para filtrar; o modo vira um ícone desenhado (linhas para a lista, estrela para o céu). A folha ganha "de que tipo" e "por quanto tempo" acima dos grupos. Subtítulo: "Perto em cima, sem pressa embaixo."; erro: "O céu não acendeu agora".
- **Criar:** só "Quando?", "Onde?" e "Que tipo de desejo?" à vista; "e, se quiserem, mais um pouco…" revela duração, lembrança e planejar. Roteiro e orçamento viram linhas marcáveis ("Montar um roteiro, dia a dia", "Pensar no quanto gastar"). "Quando?" aberto usa palavras sem caixa e linhas de caderno com perguntas ("Que dia?", "De que dia / a que dia?"). O título não aceita quebra de linha. Sair com a frase escrita, também pelo voltar do Android, pergunta "Sair sem guardar este desejo?".

### Quarta rodada
- **Estrela:** data curta na tela ("12 dez.", "12–14 dez.", "nov. 2026"; o ano só fora do ano corrente), para o local caber; o leitor de tela ouve a data por extenso. Título e detalhe em até 2 linhas cada. A fonte para em 1,2x no céu; quem precisa de letra maior tem a lista.
- **Chegada:** a estrela nova pisca logo e brilha como as de perto onde quer que caia, e a tela diz "Mais uma estrela no céu: “…”" (uma vez; saindo da aba, já foi vista).
- **Criar:** tipo e duração viram palavras soltas com o fio embaixo, como o "Quando?"; a categoria nova é uma linha de caderno ("Como vocês chamam?", "Criar", "deixa pra lá"); "+ Nova categoria" é botão, não caixa de marcar. "Algo para não esquecer?" no lugar da pergunta longa; "os dois" quando roteiro e orçamento estão marcados; exemplos de data reais ("12/06/2027") no lugar das máscaras; sem título: "Escrevam uma frase para o desejo virar estrela.".
- **Modo:** o ícone de lista ganha pontos, para não ser lido como menu.
- **Quinta rodada:** um "·" separa as palavras de escolha na voz do álbum; o fio da escolhida fica numa View (o Android nem sempre desenha borda em Text); a chegada limpa busca e filtros; o exemplo do título fica em itálico e o que o casal escreve, reto; o subtítulo some no céu vazio; o período que atravessa o ano mostra o ano do fim.
- **No aparelho (2026-11-01):** o topo do céu ganhava uma emenda reta; uma faixa que esmaece do fundo resolve (duas camadas no mesmo `experimental_backgroundImage` não pegaram no Android). Os exemplos das linhas de caderno ficam em itálico, como o do título. A folha de filtros usa as mesmas palavras com fio do criar. "Quando?" sem resposta enquanto a data está pela metade (antes dizia "sem pressa").
- **Vozes:** os títulos das abas falam como o casal ("O que sonhamos viver"); o app fala com o casal ("O céu de vocês…").

## Início
- Sem rótulo acima do título; os retratos do casal ([ADR 043](./043-profile-photo.md)) ao lado de "Rick & Bia".
- Seções na voz do álbum ("Vivendo agora", "Nosso próximo momento", "Estamos preparando"), em itálico, sem maiúsculas.
- "Criar uma experiência" vira link discreto: o "+" da barra já cria.
- Os atalhos que repetiam a barra de baixo saem. No lugar:
  - **a última página da nossa história:** a memória mais recente, na moldura, abrindo a memória, com "Ver toda a nossa história";
  - uma linha para o céu de desejos ("3 desejos no céu de vocês").
- A ordem e as regras do Início ([ADR 014](./014-home-and-location.md), [027](./027-home-limits-and-past-planning.md)) não mudam.

## Consequências
- `app/src/components/ceu-de-desejos.tsx` e `app/src/app/(tabs)/desejos.tsx`; a tela de criar aceita `titulo` como começo já escrito.
- `ScreenHeader` aceita ficar sem o rótulo acima do título e receber algo antes do título.
