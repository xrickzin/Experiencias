# 028 — Foto de destaque antes da Memória e no Início

**Status:** Aceita (pedido do usuário, 2026-10-15). Amplia o [012](./012-favorite-moment-and-cover-photo.md).

## Contexto
O casal quer que o que está em **Vivendo** apareça bem no Início, como um cartão com imagem, e quer ir escolhendo essa imagem enquanto vive a experiência. O [012](./012-favorite-moment-and-cover-photo.md) só previa a foto de destaque na memória.

O pedido falava em "foto favorita". No produto, porém, o **momento favorito** é individual e privado (cada pessoa escolhe o seu, com a regra de visibilidade da impressão). Uma imagem que os dois veem no Início é compartilhada, e o conceito que já tem essas regras é a **foto de destaque**.

## Decisão
- A foto de destaque pode ser escolhida **já em Planejamento e em Vivendo**, entre as fotos da própria experiência. Continua a mesma foto de destaque, que segue para a Memória e para Nossa História.
- As regras do 012 não mudam: escolha **manual**, por **qualquer um dos dois**, trocável e removível, **sem escolha automática**. Excluir a foto limpa o destaque ([020](./020-photos-and-deletion.md)).
- No **Início**, a experiência em destaque de "Vivendo agora" aparece como **cartão com a foto de destaque**. Sem foto escolhida, ou enquanto ela não carrega, o cartão mostra um **substituto** (papel com o fio e o convite "Escolham uma foto de destaque para este momento."), nunca uma área vazia.
- As demais experiências em Vivendo, e as dos outros blocos, continuam no formato compacto, sem foto.
- O **momento favorito** continua sendo da Fase 5 (Memória) e não é afetado.

## Consequências
- O banco ganha `experiencias.foto_destaque_id`, que aponta para um registro do tipo foto da mesma experiência. O servidor recusa qualquer outra foto (migração `20261015160000_foto_destaque.sql`).
- Voltar a Desejo mantém o destaque, assim como mantém as fotos.
