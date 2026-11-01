# O álbum: material e telas da memória

Como Nossa História e a memória aberta se apresentam no app. Direção pedida pelo usuário: **um lugar de alento**, aconchegante, que lembre um álbum de casal. Regras de produto: [../product/memory.md](../product/memory.md). Crítica que orientou esta versão: `.impeccable/critique/` (2026-10-31).

## Material

- **Papel** (`papel` e `papelBorda` em `app/src/constants/theme.ts`): mais claro e mais quente que as superfícies da interface, nos dois temas. No escuro, um creme apagado que se destaca do fundo; os textos sobre ele passam do contraste mínimo.
- **Moldura única** (`app/src/components/moldura.tsx`), em três tamanhos: miniatura (grade de momentos), pequena (polaroides lado a lado, fotos da lista) e retrato (capas, foto aberta). Só as polaroides soltas giram de leve; capas e grades ficam retas.
- **O fio:** ondulado e fino em toda Nossa História, inclusive a linha lateral que liga os meses. Nas guias, o próprio fio dá o laço (não há desenho por cima).
- **Voz do álbum:** rótulos e datas em Fraunces itálico ("favorito", "capa", "8 de outubro, à noite"), com `FontFamily.voz`, o arquivo itálico de verdade, e nunca `fontStyle: 'italic'` sobre a SemiBold; sem maiúsculas espaçadas. Nada de rótulo acima de título.

## Lista de Nossa História

Cada mês é uma página: a memória mais recente como foto grande colada no papel, com o título e quando foi escritos no pé; as outras em duas colunas, com até três linhas de título. Do mais recente ao mais antigo, inclusive dentro do mês ([our-story.md](./our-story.md)).

## Memória aberta

- **Capa:** a foto de destaque na moldura retrato (3:2), com o título e quando foi no pé; baixa o bastante para as polaroides e as guias aparecerem na primeira tela. O local some quando repete o título.
- **Guias** (Memória, Momentos, Detalhes; Roteiro e Orçamento quando houver): as páginas ficam lado a lado e **acompanham o dedo**; o laço anda junto, desfaz-se no meio do caminho e refaz-se ao chegar. Soltando, assenta na guia mais próxima, ou na seguinte se o gesto foi rápido; nas pontas, resiste como elástico. Tocar numa guia anda até ela.
- **Memória:** os favoritos como polaroides com o nome de quem escolheu (tocar abre a foto inteira, com zoom); as impressões como cartas em papel, com aspas no fio e assinatura com a foto de perfil. "Editar" fica no pé da própria carta; "Apagar" só dentro da edição.
- **Momentos:** dias como capítulos, fotos na moldura miniatura, observações como bilhetes assinados. Acrescentar fica num "+ Acrescentar à memória" no topo, que abre a escolha entre foto, galeria e observação.

## Foto aberta

- A foto é uma polaroide, na proporção dela. No pé, a marca ("seu momento favorito", "foto de capa"), a legenda e os retratos ([ADR 043](../decisions/043-profile-photo.md)): à esquerda, quem escreveu a legenda (se for outra pessoa); no canto direito, quem guardou a foto. Sem legenda, o pé diz quando foi tirada.
- Deslizar para o lado passa para a próxima foto; o contador mostra a posição ("2 de 89").
- **Ações**, num botão só: "Para esta memória" (capa, favorito) e "Levar com vocês" (salvar, compartilhar); alterar a data e excluir ficam discretos no fim.

## Movimento

Decidido com a skill de animação (`expo:expo-animation`): gestos e animações ligados a eles rodam no thread da interface (Reanimated + Gesture Handler), com "reduzir movimento" respeitado. A barra de abas do app troca só por toque (abas são pares; deslizar entre elas não é o padrão do Android). Pendente: o fio da barra de abas ainda anima redesenhando a tela a cada quadro ([open-questions-ux.md](./open-questions-ux.md)).
