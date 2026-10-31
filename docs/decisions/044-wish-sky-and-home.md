# 044 — Desejos como céu e o Início na voz do álbum

**Status:** Aceita (aprovação do usuário, 2026-10-31). Muda só a apresentação; nenhuma regra de produto muda. Proposta visual: [../ux/proposal/ceu-de-desejos.html](../ux/proposal/ceu-de-desejos.html). Crítica que motivou: [../ux/album.md](../ux/album.md).

## Desejos
- Cada desejo é uma **estrela** com o título e, embaixo, quando e onde. O fio liga os desejos da mesma categoria (a primeira de cada um), como constelações.
- **Horizontes**, de cima para baixo:
  - **Em breve:** com data nos próximos 90 dias, ou já passada;
  - **Um dia:** com data mais longe;
  - **Sem pressa:** sem data.
- **Achar um desejo:**
  - a **busca** fica no topo e procura no título, no local e nas observações, sem diferenciar acentos;
  - os **filtros** de categoria e duração continuam; no céu, o que não combina fica apagado, como contexto, e não é anunciado pelo leitor de tela;
  - **Céu ou Lista:** a lista mostra os mesmos desejos em linhas, agrupados pelos horizontes. O aparelho lembra o último modo escolhido.
- **Sementes:** começos de frase ("Um lugar que nunca fomos…") que abrem a criação com o título já escrito, no fim da tela e no estado vazio.
- Uma estrela cintila de vez em quando, nunca com "reduzir movimento" ligado.
- Ainda não existe a marca "novo" da proposta: o desejo não guarda quando foi criado.

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
