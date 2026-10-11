# Questões em aberto

Lista única do que ainda **não está decidido**. Até serem decididas, **não implementar** o comportamento envolvido e, se ele for necessário, parar e apresentar alternativas.
Quando uma questão for decidida: registrar em `docs/decisions/`, atualizar o documento de produto correspondente e remover daqui.

**Produto:** nenhuma questão de produto em aberto.
**Técnicas:** nenhuma em aberto; foram decididas nos ADRs [017](../decisions/017-account-and-session-details.md) a [021](../decisions/021-naming-and-identifiers.md). As premissas a conferir na implementação estão em [technical-decisions.md](../architecture/technical-decisions.md#a-validar-na-implementação).

## UX

Pendências de fluxo e de identidade visual: [../ux/open-questions-ux.md](../ux/open-questions-ux.md). As divergências entre UX e produto foram resolvidas ([ADR 022](../decisions/022-entry-flow-and-solo-use.md)); limites do Início e Planejamento com data passada, em [ADR 027](../decisions/027-home-limits-and-past-planning.md).

## Já decidido (não reabrir)

Estados e transições · Memória é final · exclusão (inclusive de memória) por qualquer um dos dois · referência temporal definida pelo primeiro que finalizar · Planejamento aparece em Início · MVP online-only e mobile (sem web).

**Entrada e identidade:** Supabase Auth com e-mail + senha dentro do fluxo Criar/Vincular; sessão persistente; recuperação com e-mail + senha e "esqueci a senha" nativo; um Laço por identidade; palavra-chave só vincula (não é senha nem autenticação, não é trocada, sem código aleatório); criação com palavra em uso informa que está em uso, vinculação responde de forma genérica; bloqueio temporário no servidor ([ADR 011](../decisions/011-couple-linking.md), [015](../decisions/015-identity-and-session.md), [016](../decisions/016-keyword-abuse-protection.md), [017](../decisions/017-account-and-session-details.md), [018](../decisions/018-keyword-protection-implementation.md)).
**Impressão e momento favorito:** regra única do leitor; impressão registrada = texto não vazio; a pessoa pode apagar e reescrever a própria; momento favorito é uma foto; foto excluída limpa o ponteiro ([permissions.md](./permissions.md), [ADR 012](../decisions/012-favorite-moment-and-cover-photo.md), [020](../decisions/020-photos-and-deletion.md)).
**Foto de destaque:** escolhida manualmente, sem escolha automática. **Nossa História:** agrupa pelo mês de início.
**Registros** em Planejamento, Vivendo e Memória ([ADR 013](../decisions/013-records-in-planning.md)).
**Início, local e entrada:** ordem de Início, local em texto livre, nomes ([ADR 014](../decisions/014-home-and-location.md)).
**Automação:** no servidor; data sem horário = 00:00 do dia no fuso do Laço; data de início já passada não dispara; sem repetição após decisão manual ([ADR 004](../decisions/004-dates-and-automation.md), [019](../decisions/019-automation-implementation.md)).
**Entrada pelo e-mail e Desejo:** a entrada começa pelo e-mail (cadastrado: senha; novo: código do casal) e um Desejo aceita local, referência temporal pretendida e observações opcionais ([ADR 024](../decisions/024-email-first-entry.md), [025](../decisions/025-wish-optional-fields.md)).
**Entrada e uso do Laço:** código do casal só no primeiro vínculo; quem cria usa o aplicativo antes da segunda pessoa; configurações com nome e sair da conta; finalizar e excluir com confirmação ([ADR 022](../decisions/022-entry-flow-and-solo-use.md), [023](../decisions/023-keyword-check-before-account.md)).
**Nome técnico e código:** `laco`, domínio em português e técnica em inglês ([ADR 021](../decisions/021-naming-and-identifiers.md)).

Índice completo: [decisions/](../decisions/README.md).
