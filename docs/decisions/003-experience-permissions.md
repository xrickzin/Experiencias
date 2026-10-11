# 003 — Permissões da experiência

**Status:** Aceita

## Contexto
O espaço é de duas pessoas. Era preciso definir quem altera o quê.

## Decisão
- A experiência pertence aos dois: ambos editam dados gerais e planejamento, executam transições e adicionam, editam e excluem registros.
- Todo registro preserva o **autor**.
- Impressão pessoal e momento favorito pertencem a cada pessoa, que edita **somente os seus**.
- Princípio: **confiança no casal**. Qualquer um pode excluir sozinho, inclusive uma memória.

## Consequências
- O modelo de dados precisa guardar autoria e a pertença individual da impressão e do momento favorito ([data-model.md](../architecture/data-model.md)).
- As regras viram políticas de segurança no backend ([security.md](../architecture/security.md)).
- Não há desfazer nem consentimento do outro para exclusões; a confirmação explícita é a única proteção.

## Alternativas consideradas
- Exigir consentimento dos dois para excluir: descartada pelo princípio de confiança.
