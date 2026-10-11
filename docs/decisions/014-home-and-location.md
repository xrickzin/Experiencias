# 014 — Início e localização

**Status:** Aceita

## Contexto
Início precisava de uma ordem que não virasse dashboard, e "localização simples" precisava de um limite.

## Decisão
- **Início** responde "o que está acontecendo com a gente agora e o que vem pela frente?": Vivendo, depois Planejamento com data futura em ordem cronológica, depois Planejamento sem data (sem posição artificial). Desejos aparece só como **atalho**.
- Início não é dashboard, produtividade, lista de tarefas, pontuação nem feed.
- **Localização** é texto livre e opcional. Fora do MVP: mapa, coordenadas, geocoding, Places API, endereço obrigatório, distância.

## Complemento
Limites de apresentação, destino das listas completas e Planejamento com data passada: [027](./027-home-limits-and-past-planning.md).

## Consequências
- Sem algoritmo de relevância: a ordem é derivada do estado e da referência temporal.
- Uma estrutura geográfica poderá vir depois sem prejudicar o texto atual.

## Alternativas consideradas
- Listar desejos recentes em Início: descartada; exigiria definir "relevante".
