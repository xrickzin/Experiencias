# Diretrizes de implementação

Como transformar a documentação em código. Qualidade e Git estão em [../../CLAUDE.md](../../CLAUDE.md).

## Antes de implementar uma funcionalidade

1. Ela está no [MVP](../product/mvp.md)? Se não está escrito lá, não implementar.
2. Ler **só** os documentos relevantes em `docs/product/` e as decisões correspondentes em `docs/decisions/`.
3. Identificar em que ponto do ciclo ela se encaixa ([lifecycle.md](../product/lifecycle.md)).
4. Conferir se há questão em aberto que afete o comportamento ([open-questions.md](../product/open-questions.md)). Se houver, **parar e apresentar alternativas**; não assumir.
5. Identificar dependências técnicas e o impacto na arquitetura ([../architecture/overview.md](../architecture/overview.md)).
6. Propor a abordagem quando houver impacto arquitetural ou de produto.
7. Implementar o mínimo necessário para o escopo definido.
8. Validar comportamento, estados vazio, carregando e erro, e os fluxos principais.
9. Atualizar a documentação se uma decisão for consolidada.

## Regras de implementação

- **Camadas:** UI → hooks → serviços → Supabase. A interface não acessa o Supabase direto; cada regra de negócio existe em um só lugar.
- **Regras de produto viram código sem exceção:** só as transições permitidas; Memória nunca volta; Memória exige referência temporal; voltar de estado não apaga registros; criar só Desejo ou Memória.
- **Segurança:** isolamento por Laço, autoria e privacidade das impressões também no backend ([../architecture/security.md](../architecture/security.md)). A interface esconder não basta.
- **Online-only:** sem conexão, informar claramente; nunca indicar que algo foi salvo sem confirmação de persistência.
- **Simplicidade:** estruturas explícitas e tipadas, sem blocos genéricos. Sem funcionalidade futura, abstração antecipada ou dependência sem necessidade.
- **Cancelar** é definitivo e pede confirmação explícita; **finalizar** é irreversível e também.
- **Automação** nunca reverte decisão manual do casal; o mecanismo é o `armado_em` ([ADR 019](../decisions/019-automation-implementation.md); [technical-decisions.md](../architecture/technical-decisions.md#anti-loop-da-automação)).
- **UX:** seguir a direção de [../ux/README.md](../ux/README.md) sem inventar design. Se ela divergir das decisões de produto ou dos ADRs (ver [../ux/open-questions-ux.md](../ux/open-questions-ux.md)), **sinalizar a divergência** antes de implementar; até lá vale o produto.

## Princípio

> O código deve servir ao conceito do produto, e não fazer o conceito se adaptar ao código.
