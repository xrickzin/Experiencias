# 019 — Automação do início: execução, fuso e anti-loop

**Status:** Aceita. Decisão técnica delegada pelo produto. Implementada na Fase 7 com `pg_cron` ([phase-7-log.md](../development/phase-7-log.md)).

## Contexto
O [004](./004-dates-and-automation.md) define o que a automação faz (servidor, 00:00 no fuso do Laço, data passada não dispara, não repete após decisão manual). Faltava o como.

## Decisão
- **Execução:** uma rotina agendada **no próprio PostgreSQL** (extensão de agendamento do Supabase), a cada minuto, que transforma em Vivendo as experiências elegíveis. Sem servidor adicional.
- **Fuso do Laço:** nome de fuso IANA (ex.: `America/Sao_Paulo`) na linha do Laço, definido na criação a partir do fuso do aparelho de quem cria e **sem edição no MVP**.
- **Instante de início:** ao salvar a referência temporal, o servidor calcula e guarda o **instante de início em UTC**: data → 00:00 no fuso do Laço; data + horário → esse horário no fuso; período → início do período; sem data e mês/ano → nenhum instante (não automatiza).
- **Anti-loop (opção unificada):** cada experiência guarda `armado_em`, atualizado a cada **edição da referência temporal** e a cada **transição de estado** (manual ou automática). A automação dispara **somente** se: estado = Planejamento **e** instante de início **> `armado_em`** **e** instante de início **<= agora**.
  - Data passada ao definir: início <= `armado_em` → não dispara (cobre a data passada).
  - Decisão manual (inclusive voltar de Vivendo): `armado_em` passa a ser agora → não repete.
  - Editar o início para um novo instante futuro: reabilita.

## Consequências
- Granularidade de um minuto. Sem fila, sem estado externo.
- O fuso fixo é um teto conhecido: se o casal mudar de fuso, o início continua no fuso original. Editar o fuso fica fora do MVP.
- Definir hoje uma data sem horário não inicia a experiência (00:00 já passou).
- Se a extensão de agendamento não estiver disponível, reabrir esta decisão (alternativa: função agendada do Supabase chamando o mesmo SQL).

## Alternativas consideradas
- Marcador "já disparou": não cobre o retorno manual com nova data.
- Automação ao abrir o aplicativo: descartada pelo produto ([004](./004-dates-and-automation.md)).
