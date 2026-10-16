# 029 — Aba Momentos e escolha no "+"

**Status:** Aceita (escolhas do usuário, 2026-10-15). Ajustada pelo [030](./030-photo-caption-and-observation-moment.md): as fotos ganharam legenda e a observação passou a ser de um momento escolhido. Aplica o [010](./010-explicit-typed-records.md) e o [navigation.md](../product/navigation.md#ação-global-de-criar).

## Contexto
O MVP prevê dois tipos de registro, fotos e observações simples, mas a Fase 4 entregou só as fotos, numa aba "Fotos". A ação global de criar devia oferecer "Criar um desejo" e "Registrar uma memória", mas até aqui o `+` abria direto a criação de desejo, porque a memória ainda não existia.

## Decisão
- **Observação simples é um registro próprio** (tipo `observacao`, só texto, até 2.000 caracteres), não uma legenda presa a uma foto. Qualquer um dos dois escreve, edita e exclui; o autor original é preservado.
- Fotos e observações ficam **juntas na aba "Momentos"** (antes "Fotos"), agrupadas por dia e por período no horário de Brasília. A observação vale pelo momento em que foi escrita.
- O **`+`** abre uma escolha curta: **"Criar um desejo"** ou **"Registrar uma memória"**.

## Consequências
- Legenda em foto continua inexistente; se surgir a necessidade, é uma decisão nova.
- A aba Momentos existe em Planejamento, Vivendo e Memória; Desejo continua sem registros.
