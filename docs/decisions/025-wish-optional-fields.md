# 025 — Informações opcionais de um Desejo

**Status:** Aceita (UX-F18).

## Contexto
A UX exigia só o título em um Desejo, e o produto permitia local, mês pretendido e observações opcionais. Faltava dizer o que a tela do Desejo permite registrar antes de Começar planejamento.

## Decisão
- O **título** é o único campo obrigatório; informar só o título basta para salvar um Desejo, e a criação continua rápida.
- Ainda em Desejo, a pessoa pode **adicionar ou editar**, opcionalmente: **local**, **referência temporal pretendida** (qualquer precisão: mês/ano, data, data + horário ou período) e **observações**.
- Esses campos **não** viram etapas obrigatórias nem exigem iniciar o Planejamento para registrar o que a pessoa já sabe.
- Ao passar para Planejamento, **todos os dados são preservados**: é a mesma experiência em outro contexto, sem nova entidade.

## Consequências
- A referência temporal de um Desejo **não dispara automação**: a automação só atua em Planejamento ([004](./004-dates-and-automation.md), [019](./019-automation-implementation.md)). Ao ir para Planejamento, `armado_em` é atualizado; um início já passado não dispara.
- Um Desejo com data não entra em "próximas experiências" de Início, que considera Planejamento ([014](./014-home-and-location.md)).
- Registros (fotos e observações como registros) continuam não definidos para Desejo ([013](./013-records-in-planning.md)); as "observações" aqui são o campo da experiência.
- O modelo de dados não muda: local, referência temporal e observações já pertencem à experiência em qualquer estado ([data-model.md](../architecture/data-model.md)).
