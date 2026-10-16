# Modelo de dados (conceitual)

Responsabilidades e relações **conceituais**. Não é schema: sem tabelas, colunas, tipos ou políticas definitivas. O schema será derivado daqui quando as questões abertas relevantes estiverem decididas.

## Entidades

| Entidade | Responsabilidade |
|---|---|
| **Laço** | O espaço compartilhado do casal. Contém tudo o que é compartilhado. Guarda o necessário para o vínculo por palavra-chave (só o derivado da palavra, [ADR 018](../decisions/018-keyword-protection-implementation.md)) e o **fuso** (nome IANA, definido na criação, sem edição no MVP) usado pela automação. |
| **Membro** | Cada uma das duas pessoas do Laço, com o **próprio nome** (editável só por ela), ligada a uma **identidade de autenticação estável** (Supabase Auth, e-mail + senha). Um Laço tem **um** (logo após ser criado) ou **dois** (depois do vínculo); nunca mais que dois. O nome da outra pessoa, informado por quem criou, é provisório até o vínculo. |
| **Experiência** | A entidade central. Título, estado, referência temporal (com o **instante de início** calculado pelo servidor, quando existir) e `armado_em` ([ADR 019](../decisions/019-automation-implementation.md)), local (texto livre), observações. Pertence ao Laço. Pode apontar para uma **foto de destaque**. |
| **Registro** | Informação acumulada na experiência. MVP: foto ou observação. Tem **autor** (Membro). Pertence à experiência e sobrevive às mudanças de estado. |
| **Mídia** | O arquivo de uma foto, no Storage. Associada a um registro. |
| **Impressão pessoal** | Texto de **um Membro** sobre **uma experiência**. |
| **Momento favorito** | A escolha de **um Membro** em **uma experiência**, apontando para uma **foto** da própria experiência. |

## Relações

- Laço 1—2 Membros (um até a segunda pessoa vincular).
- Laço 1—N Experiências.
- Experiência 1—N Registros; Registro (foto) 1—1 Mídia.
- Experiência 0—1 foto de destaque (uma foto dela).
- Membro 1—N Registros (autoria).
- Experiência × Membro: no máximo **uma** impressão e **um** momento favorito por par.

## Invariantes

1. Toda informação compartilhada está associada a um Laço.
2. O estado da experiência é um de: Desejo, Planejamento, Vivendo, Memória. Só as transições de [lifecycle.md](../product/lifecycle.md#transições-permitidas) são válidas. **Memória nunca muda de estado.**
3. Uma experiência em Memória **tem referência temporal**. Para as demais, é opcional.
4. A referência temporal guarda a **precisão** escolhida (sem data, mês/ano, data, data + horário, período). Nenhuma automação a altera.
5. Voltar de estado não remove registros. Registros existem em Planejamento, Vivendo e Memória (não definido em Desejo).
6. Cada registro mantém o autor, mesmo após edição pelo outro.
7. Impressão e momento favorito só são editados pelo próprio Membro. O favorito aponta para uma foto da mesma experiência.
8. O Membro só lê a impressão e o favorito do outro se tiver impressão própria **não vazia**; avaliado na leitura ([security.md](./security.md)).
9. Excluir uma experiência exclui o que depende dela (registros, mídias, impressões, momentos favoritos).
10. Definir a referência temporal na finalização: o primeiro Membro que a definir a fixa. Duas definições simultâneas não podem sobrescrever uma à outra silenciosamente.
11. Para o agrupamento em Nossa História, uma memória com período usa o **mês de início** e aparece uma só vez.
12. `armado_em` é atualizado a cada edição da referência temporal e a cada transição de estado; a automação só dispara com início > `armado_em` e <= agora ([technical-decisions.md](./technical-decisions.md#anti-loop-da-automação)).
13. Cada identidade de autenticação corresponde a **no máximo um Membro**, e portanto a no máximo um Laço no MVP. Recuperar o acesso (reinstalação, novo aparelho) **reencontra o mesmo Membro**, não cria outro ([ADR 015](../decisions/015-identity-and-session.md)).
14. Se a foto apontada por favorito ou destaque for excluída, o ponteiro é limpo; sem substituta automática ([ADR 020](../decisions/020-photos-and-deletion.md)).

## Mapeamento lógico (nomes, não DDL)

Domínio em português, `snake_case` ([ADR 021](../decisions/021-naming-and-identifiers.md)). O DDL nasce nas migrações versionadas.

| Entidade | Tabela | Observações |
|---|---|---|
| Laço | `lacos` | fuso IANA; derivado da palavra-chave com índice único |
| Membro | `membros` | identidade de autenticação **única**; referência ao Laço |
| Experiência | `experiencias` | estado: `desejo`, `planejamento`, `vivendo`, `memoria` |
| Registro | `registros` | tipo (foto ou observação), autor |
| Mídia | `midias` | caminho no Storage |
| Impressão pessoal | `impressoes` | uma por Membro e experiência |
| Momento favorito | `momentos_favoritos` | uma por Membro e experiência; aponta para uma foto |
| Apoio ao limite de tentativas | `tentativas_vinculo` | tentativas recentes, limpa periodicamente |

**Storage:** bucket privado, caminho `{laco}/{experiencia}/{arquivo}` ([ADR 020](../decisions/020-photos-and-deletion.md)).

## Estado da implementação (Fase 1)

Existem `lacos`, `membros`, `tentativas_vinculo`, `bloqueios_vinculo` e `configuracao_servidor`, mais as funções de vínculo e a RLS, na migração `supabase/migrations/20261010120000_fase1_laco_membros_vinculo.sql` ([phase-1-log.md](../development/phase-1-log.md)). `lacos` ganhou `nome_companheiro_provisorio` (nome informado por quem criou, limpo no vínculo). Na Fase 2 entrou `experiencias` (título, estado, local, observações), ver [phase-2-log.md](../development/phase-2-log.md); na Fase 3, a referência temporal (`referencia_precisao`, `referencia_inicio`, `referencia_fim`, `referencia_horario`), `inicio_em`, `armado_em` e a função `mudar_estado` ([phase-3-log.md](../development/phase-3-log.md)); na Fase 4, `registros` (tipo `foto`, com o caminho no bucket privado `experiencias`; a mídia é o próprio arquivo do Storage, sem tabela `midias` separada) ([phase-4-log.md](../development/phase-4-log.md)), e `experiencias.foto_destaque_id`, que aponta para uma foto da própria experiência ([ADR 028](../decisions/028-cover-photo-before-memory.md)). As demais entidades ainda não existem.

## Em aberto

Nenhuma. Premissas a conferir na implementação: [technical-decisions.md](./technical-decisions.md#a-validar-na-implementação).
