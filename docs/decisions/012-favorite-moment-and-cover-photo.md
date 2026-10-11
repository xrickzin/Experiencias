# 012 — Momento favorito e foto de destaque

**Status:** Aceita

## Contexto
O momento favorito precisava de uma regra de privacidade e de um formato no MVP. Nossa História precisava de uma imagem por experiência, sem confundi-la com o favorito.

## Decisão
- **Momento favorito:** individual, sem ranking; no MVP é sempre **uma foto** da própria memória. Observações não podem ser favorito.
- **Privacidade:** a mesma regra da impressão, que é **do leitor**: uma pessoa só vê o favorito e a impressão do outro depois de ter a própria impressão registrada (texto não vazio).
- **Foto de destaque:** representa a experiência em Nossa História. É **escolhida manualmente**, entre as fotos da memória, por **qualquer um dos dois**, e pode ser trocada. Sem escolha automática (nem primeira, nem última, nem o favorito).
- Memória sem foto, ou sem destaque escolhido, continua válida.

## Consequências
- Uma única regra de leitura no backend para dois itens ([security.md](../architecture/security.md)).
- Favorito e destaque apontam para fotos; quando a foto é excluída, o ponteiro é limpo ([020](./020-photos-and-deletion.md)).
- Formatos futuros do favorito: [future.md](../product/future.md).

## Alternativas consideradas
- Regra do autor (o favorito de A fica visível a B quando A escreve): descartada; permitiria B ser influenciado antes de escrever a sua.
- Destaque automático: descartada por decisão do produto.
