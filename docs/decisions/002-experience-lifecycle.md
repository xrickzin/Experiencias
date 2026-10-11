# 002 — Ciclo de vida, transições e Memória final

**Status:** Aceita

## Contexto
Havia duas descrições do ciclo (com "Experiência" como fase e "Nossa História" como etapa final) e as regras de retorno estavam indefinidas ("conforme os casos de uso").

## Decisão
- Ciclo: **Desejo → Planejamento → Vivendo → Memória**. A experiência é a entidade; os estados não são entidades diferentes. Nossa História é uma área de apresentação, não um estado.
- Transições permitidas, apenas: Desejo→Planejamento, Planejamento→Desejo, Planejamento→Vivendo, Vivendo→Planejamento, Vivendo→Memória. O que não está escrito não se implementa.
- Desejo, Planejamento e Vivendo são reversíveis; **Memória é final**. Voltar nunca apaga registros.

## Consequências
- A regra de Memória final precisa aparecer na arquitetura e nas regras de negócio ([data-model.md](../architecture/data-model.md)).
- Finalizar é irreversível, portanto pede confirmação explícita.
- O conteúdo da memória continua editável; o que não muda é o estado.

## Alternativas consideradas
- Permitir Memória → Vivendo: descartada, pois a memória passa a ser a história do casal.
- Estado "Cancelado": descartada ([006](./006-cancellation.md)).
