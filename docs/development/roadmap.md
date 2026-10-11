# Roadmap

> **Proposta de ordem**, derivada do [MVP](../product/mvp.md) e das dependências entre partes. Não é compromisso nem decisão de produto. Cada fase só começa com as premissas de [technical-decisions.md](../architecture/technical-decisions.md#a-validar-na-implementação) relevantes conferidas.

| Fase | Entrega | Depende de | A conferir antes |
|---|---|---|---|
| 0 | Fundação técnica: limpar o template, tokens, fontes, nome técnico ([021](../decisions/021-naming-and-identifiers.md)), projeto Supabase e migrações, lint. **Em andamento, não concluída:** etapas E0 a E6, E8 (sem configuração web), E10 (fontes), E11 (identidade: `Laço`, `laco`, `com.xrickzin.laco`) e E13 (ESLint) executadas, com lint limpo nos 7 arquivos de `src/` ([phase-0-log.md](./phase-0-log.md)); E12 parcial (`expo-device` e `expo-web-browser` removidos); E7 e E9 não executadas e aguardam autorização; sem validação em aparelho. Plano: [phase-0-plan.md](./phase-0-plan.md) | autorização do usuário, etapa por etapa | ver o plano |
| — | **Casca visual integrada** (entre a Fase 0 e a Fase 1): navegação com `+` central, Início, Desejos, Nossa História e criação de desejo local. Detalhes e pendências: [visual-shell.md](./visual-shell.md); sem validação em aparelho | Fase 0 técnica | validar em Expo Go |
| 1 | **Em andamento (código e migração prontos; sem projeto Supabase configurado nem validação em aparelho, ver [phase-1-log.md](./phase-1-log.md)).** Laço: identidade (Auth, e-mail + senha no onboarding), Criar / Vincular, nomes, sessão, proteção e verificação da palavra-chave, uso com um membro, configurações mínimas (nome, sair da conta), isolamento por Laço, "esqueci a senha" | Fase 0 | segredo/IP no servidor, sessão segura, formato do "esqueci a senha"; **reavaliar a cadeia `decode-uri-component` antes de links e parâmetros de URL** ([dependency-audit.md](./dependency-audit.md)) |
| 2 | Desejos: criar, listar, editar; cancelar (remove arquivos antes do banco) | Fase 1 | API de remoção do Storage |
| 3 | Planejamento e Início: transições, referência temporal (com instante de início e `armado_em`), local e observações | Fase 2 | — |
| 4 | Fotos: câmera, galeria e Storage privado, em Planejamento e Vivendo | Fase 3 | — |
| 5 | Memória: finalizar, registrar memória, impressão, momento favorito, foto de destaque, privacidade | Fase 4 | — |
| 6 | Nossa História: agrupamento por mês de início e foto de destaque | Fase 5 | — |
| 7 | Automação do início: rotina no PostgreSQL, fuso do Laço | Fase 3 | rotina agendada disponível no plano |

As telas de cada fase dependem da proposta visual aprovada ([../ux/design-direction.md](../ux/design-direction.md#10-resultado-esperado-antes-da-implementação-visual-ampla)); dados e serviços podem começar antes.

Cada fase deve ser pequena e utilizável. O MVP só termina quando todas as fases estiverem completas. Nada fora de [mvp.md](../product/mvp.md) entra no roadmap.
