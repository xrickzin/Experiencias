# 020 — Fotos: ponteiros e exclusão

**Status:** Aceita. Decisão técnica delegada pelo produto.

## Contexto
Favorito e foto de destaque apontam para fotos ([012](./012-favorite-moment-and-cover-photo.md)); cancelar uma experiência é definitivo ([006](./006-cancellation.md)); o MVP é online-only e nunca deve afirmar algo que não foi persistido.

## Decisão
- **Foto excluída apontada por favorito ou destaque:** o ponteiro é **limpo automaticamente**; o favorito volta a "não escolhido" e a memória fica sem destaque. Sem escolha automática de substituta. A impressão não é afetada.
- **Caminho no Storage:** `{laco}/{experiencia}/{arquivo}`, em bucket **privado**, com acesso por URL assinada de curta duração para membros do Laço ([security.md](../architecture/security.md)).
- **Cancelar uma experiência:** o serviço remove primeiro **os arquivos** da experiência pela API do Storage e só então exclui as linhas no banco. Se a remoção falhar, a exclusão é **abortada com erro claro** (nada é dado como excluído) e pode ser repetida.
- Excluir apenas uma foto segue a mesma ordem: arquivo e depois registro.

## Consequências
- Linhas de metadados do Storage não bastam para apagar arquivos; a remoção precisa passar pela API do Storage.
- Uma falha no meio pode deixar a experiência sem algumas fotos até a repetição; aceito.
- Arquivos órfãos por falhas inesperadas não são varridos no MVP.

## Alternativas consideradas
- Banco primeiro, arquivos depois: descartada, deixaria arquivos privados órfãos com a experiência já "excluída" para o casal.
