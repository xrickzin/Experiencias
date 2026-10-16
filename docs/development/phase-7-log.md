# Fase 7: Automação do início (log)

Planejamento → Vivendo sozinho quando o instante de início chega, no servidor e no fuso do Laço, sem disputar a decisão do casal. Produto: [dates-and-automation.md](../product/dates-and-automation.md#automação-do-início). Decisões: [ADR 004](../decisions/004-dates-and-automation.md), [019](../decisions/019-automation-implementation.md), [027](../decisions/027-home-limits-and-past-planning.md).

> **Estado: concluída** (2026-10-16). Testada no Supabase local; a migração foi aplicada no projeto real (agendamento conferido em `cron.job`) e o usuário validou no celular.

## O que foi implementado
**Banco** (`supabase/migrations/20261015190000_fase7_automacao_inicio.sql`)
- **`pg_cron`** habilitado. A extensão de agendamento do Supabase está disponível em todos os planos.
- **`iniciar_experiencias_do_momento()`:** um único `update`. Passa para Vivendo as experiências em Planejamento que têm `inicio_em`, cujo início é posterior a `armado_em` (`inicio_em > armado_em`) e já chegou (`inicio_em <= agora`). Devolve quantas iniciou.
  - Só o servidor executa: o agendamento e `service_role`. O aplicativo, com ou sem sessão, não tem acesso.
  - O parâmetro `p_agora` (padrão `now()`) existe para os testes simularem o relógio.
- **Agendamento `iniciar-experiencias`**, a cada minuto. Ele tem nome, então reaplicar a migração substitui o agendamento em vez de duplicar.
- **O que já existia desde a Fase 3:** o cálculo de `inicio_em` no fuso do Laço e a renovação de `armado_em` a cada edição da referência e a cada transição. Por isso a própria transição automática impede a repetição.

**App:** nenhuma mudança. As telas recarregam ao receber o foco, então a experiência aparece em Vivendo ao voltar para Início ou para a lista. Se a tela estiver aberta no exato minuto da virada, a mudança só aparece ao sair e voltar; atualização ao vivo não faz parte do MVP.

## Validação (2026-10-16)

| Verificação | Resultado |
|---|---|
| `supabase/tests/automacao.mjs` (Supabase local) | 19 verificações passaram |
| `pg_cron` com o relógio real (Supabase local) | planejamento com início às 03:01 UTC estava em Vivendo às 03:02:30; execuções da rotina terminaram com `succeeded` |
| `supabase db reset` (local) | todas as migrações aplicam do zero, em ordem, e o agendamento fica registrado |
| `integracao`, `experiencias`, `planejamento`, `fotos`, `destaque`, `memoria`, `legendas`, `sessao-app` | passaram |

`automacao.mjs`:
- **Quando dispara:**
  - 00:00 no fuso do Laço (um minuto antes, nada);
  - data com horário no horário certo;
  - período no primeiro dia;
  - outro fuso (Tóquio: 00:00 de lá = 15:00 UTC do dia anterior).
- **Ao disparar:** não muda título nem referência, a precisão fica preservada e `armado_em` é renovado.
- **Volta a valer:** se o casal voltar a Planejamento e definir uma nova data futura.
- **Nunca dispara:**
  - data passada ao definir;
  - hoje sem horário (00:00 já passou);
  - volta manual a Planejamento;
  - sem data;
  - mês/ano;
  - Desejo com data.
- **Acesso:** o app com sessão e o app sem sessão não conseguem chamar a rotina.

Não executado: testes do app (nada mudou no app).

## Validado pelo usuário no projeto real e no celular (2026-10-16)
Roteiro usado:
1. **Aplicar no projeto real** `09 · Fase 7 · Automação do início`: `supabase/migrations/20261015190000_fase7_automacao_inicio.sql`. Para conferir, `select jobname, schedule, active from cron.job;` deve mostrar `iniciar-experiencias | * * * * * | t`.
2. **Testar no celular:**
   - criar um planejamento com data e horário daqui a 2 ou 3 minutos, esperar a hora e voltar para Início: deve aparecer em Vivendo;
   - voltar ela para Planejamento: não deve iniciar de novo sozinha.
