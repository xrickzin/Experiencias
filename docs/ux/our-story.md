# Nossa História

Como está implementado (material do álbum, memória aberta, foto aberta): [album.md](./album.md).

Regras de produto: [../product/memory.md](../product/memory.md#nossa-história), [ADR 014](../decisions/014-home-and-location.md). A ordem dos meses (do mais recente ao mais antigo) segue o exemplo do documento original; confirmar na proposta visual. Pendências: [open-questions-ux.md](./open-questions-ux.md).

## O que é

O grande álbum cronológico do casal. Título **Nossa História**; texto opcional: "Tudo o que já vivemos juntos."

Não apresentar como galeria genérica, relatório, dashboard ou lista de atividades. Linguagem **editorial/cronológica**.

## Organização

Cronológica: **ano → mês → experiências**, agrupada por **mês + ano**. Os meses seguem do mais recente ao mais antigo (Outubro de 2026 antes de Setembro de 2026) e, **dentro de cada mês, as experiências também seguem do mais recente ao mais antigo**:

> **Outubro de 2026** — 24 de outubro · 12 de outubro · 03 de outubro
> **Setembro de 2026** — 19 de setembro · 05 de setembro

**Memória só com mês/ano** aparece no mês correspondente. Não inventar um dia para ela: a posição dentro do mês usa uma regra visual que preserve a ausência de precisão, e a memória não aparenta ter data mais precisa do que realmente tem Elas ficam no fim do mês, sob "Em algum dia de {mês}" ([ADR 031](../decisions/031-month-only-memories-in-our-story.md)).

## Item da História

Cada mês é uma página do álbum: a experiência mais recente em foto grande, com o título sobre ela, e as outras em duas colunas. Cada experiência mostra **foto de destaque** (quando existir), **título** e **referência temporal**. Ex.: [foto] **Campos do Jordão** · 12–14 outubro · 2026. Sem transformar o item em ficha cheia de metadados: imagem e título são protagonistas.

## Timeline visual

O fio vermelho pode ser uma linha temporal **extremamente sutil** que conecta os momentos; pequenos laços podem marcar momentos importantes. Sem decoração pesada: é assinatura visual ([visual-identity.md](./visual-identity.md)).

## Abrir uma memória

Mostra o contexto completo.

> **Campos do Jordão** — 12–14 outubro 2026 · 📍 Campos do Jordão *(ver UX-V5)*

- **Fotos** — registradas na experiência.
- **O que aconteceu** — observações e registros preservados.
- **Nossos momentos** — momento favorito de cada pessoa, respeitando a regra de revelação.
- **O que ficou para nós** — impressões individuais, respeitando a regra de revelação.

Os registros da memória (fotos, legendas, observações do momento, destaque, favoritos e impressões) permanecem editáveis; os detalhes ficam só para leitura ([ADR 042](../decisions/042-memory-details-locked.md)).

## Final da timeline

Não existe "fim da história". Ao chegar ao final:

> **E ainda tem muito por viver.**

O fio continua: a História olha para trás, mas o Laço continua levando o casal para frente.
