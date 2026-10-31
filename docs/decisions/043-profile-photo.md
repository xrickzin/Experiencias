# 043 — Foto de perfil de cada pessoa do casal

**Status:** Aceita (pedido do usuário, 2026-10-31; os dois pontos abertos foram decididos no mesmo dia). Amplia as configurações simples de [navigation.md](../product/navigation.md) e a regra de "só o próprio" do nome exibido ([permissions.md](../product/permissions.md)).

## Decisão
- Cada pessoa pode ter **uma foto de perfil**, escolhida da galeria e recortada em quadrado, em Ajustes ("Sua foto"). Dá para trocar e tirar.
- **Só a própria pessoa** escolhe, troca ou tira a sua, como o nome. A outra pessoa vê.
- A foto aparece **pequena e discreta**, sempre ao lado de onde o nome ou a autoria já aparece:
  - no pé da polaroide, na foto aberta: no canto direito, quem guardou a foto; à esquerda, quem escreveu a legenda (quando é outra pessoa; sendo a mesma, basta o do canto);
  - no Início, os dois retratos ao lado de "Rick & Bia" ([ADR 044](./044-wish-sky-and-home.md));
  - ao lado da assinatura das cartas (impressões);
  - ao lado da assinatura dos bilhetes (observações do momento) na memória.
- Sem foto, aparece a inicial do nome no papel. A foto nunca substitui o nome e não é anunciada pelo leitor de tela.

## Decidido depois
1. **Autoria na legenda:** aparecem **quem escreveu a legenda e quem guardou a foto**. O servidor grava o autor da legenda a cada escrita (migração `20261031140000_autor_da_legenda.sql`, coluna `registros.legenda_autor_id`); tirar a legenda limpa o autor.
2. **Início:** os retratos aparecem ao lado do nome do casal. Nos Desejos e na lista de Nossa História, não.

## Consequências
- Migração `20261031130000_foto_de_perfil.sql`:
  - coluna `membros.foto_caminho`, com uma restrição que obriga o arquivo a ficar em `<laço>/perfil/<pessoa>-…`;
  - `meu_perfil` devolve `foto_caminho` e `companheiro_foto_caminho`;
  - política de Storage que só aceita envio na pasta `perfil` do próprio Laço, com o próprio id no nome. Ler e excluir seguem as regras do bucket.
- A foto é reduzida no aparelho (até 1080 px, como as miniaturas) antes de subir. Trocar envia a nova, passa a usá-la e só então apaga a anterior.
- Suítes do banco: `supabase/tests/foto-perfil.mjs` e, para o autor da legenda, `supabase/tests/legendas.mjs`.
- Até a migração do autor da legenda chegar ao projeto real, a lista de fotos segue sem ele (`listarFotos` repete a consulta sem a coluna). Serviço: `definirFotoDePerfil` em `app/src/services/fotos.ts`. Componente: `app/src/components/retrato.tsx`.
