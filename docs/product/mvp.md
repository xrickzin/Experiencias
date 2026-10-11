# MVP

Escopo atual. **Decisão:** [009](../decisions/009-mvp-scope-and-offline.md).

> Só entra no MVP o que está listado em "Dentro". O que não está escrito não deve ser implementado. Possibilidades conceituais em outros documentos **não são requisitos**.

## Dentro do MVP

**Entrada**
- Criar Laço e Vincular ao Laço (a entrada começa pelo e-mail, [ADR 024](../decisions/024-email-first-entry.md)) por palavra-chave, com **e-mail + senha (Supabase Auth)** pedidos dentro do próprio fluxo, sem tela de login/cadastro como primeiro contato ([navigation.md](./navigation.md#entrada-criar-ou-vincular-o-laço)).
- Sessão persistente: reabrir vai direto ao Laço; recuperação de acesso em novo aparelho com e-mail + senha, pelo próprio Auth, e "esqueci a senha" pelo fluxo nativo do Auth ([ADR 017](../decisions/017-account-and-session-details.md)).
- Um Laço por identidade.
- Bloqueio temporário contra tentativas abusivas da palavra-chave, aplicado no servidor.
- Cada pessoa edita o próprio nome, em configurações simples (também **sair da conta**).
- O Laço pode ser usado por quem criou **antes** de a segunda pessoa vincular.
- Código do casal mostrado ao criador, com copiar/compartilhar; sem recuperação posterior.

**Experiências**
- Desejos: criar, visualizar, editar. Só o título é obrigatório; **local**, **referência temporal pretendida** e **observações** são opcionais ([ADR 025](../decisions/025-wish-optional-fields.md)).
- Registrar uma memória (experiência anterior ao aplicativo).
- Planejamento na mesma experiência, com informações opcionais: referência temporal, **local em texto livre**, observações simples.
- Transições de estado permitidas ([lifecycle.md](./lifecycle.md#transições-permitidas)), incluindo voltar a Desejo.
- Automação de início quando houver data clara, no servidor ([dates-and-automation.md](./dates-and-automation.md)).
- Finalizar e cancelar com confirmação explícita; cancelamento é exclusão definitiva.

**Registros**
- **Fotos** (câmera ou galeria) e **observações simples**, a partir de **Planejamento** ([memory.md](./memory.md#registros)).

**Memória e Nossa História**
- Finalização e criação da Memória.
- Impressão pessoal e momento favorito (uma foto) individuais, com a regra única de privacidade, protegida também no backend.
- Foto de destaque escolhida manualmente.
- Nossa História com agrupamento por mês/ano (mês de início, em períodos) e foto de destaque.

**Início, Desejos e Nossa História** como as três áreas de navegação.

## Fora do MVP

Tema escuro · Categorias · gastos/finanças · checklist avançado · reservas · mapas, coordenadas, geocoding, Places, distância · navegação · vídeos · notificações · retrospectivas · IA para escrever memórias · compartilhamento externo · offline-first · sincronização complexa · recursos sociais · sair ou desfazer o Laço, múltiplos Laços, trocar de parceiro, transferir experiências, trocar a palavra-chave · momento favorito que não seja foto · suporte web.

Detalhes preservados em [future.md](./future.md).

## Online-only

O MVP funciona apenas com conexão.

- Sem conexão: informar claramente o problema.
- Nunca afirmar que algo foi salvo se não foi persistido.
- Não implementar arquitetura offline-first.

**Possibilidade futura:** tolerância à falta de conexão, principalmente para preservar ações durante uma experiência.

## Mobile

Laço é um aplicativo mobile. **iOS e Android** são priorizados; o suporte web **não faz parte do escopo inicial** (o template do Expo o permite, mas não criar funcionalidades específicas para web).

## Tema

O MVP tem **apenas o tema claro** e **não acompanha o tema escuro do sistema**. Um tema escuro é futuro; a estrutura de tokens pode prepará-lo ([ADR 026](../decisions/026-visual-direction-and-platforms.md)).

## Em aberto que afetam o MVP

[open-questions.md](./open-questions.md).
