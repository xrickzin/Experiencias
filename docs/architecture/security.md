# Segurança

Requisitos de segurança derivados das regras de produto. Sem policies, tokens ou código definitivos: isso vem na implementação.
Permissões: [../product/permissions.md](../product/permissions.md).

## Requisitos

1. **Isolamento por Laço.** Nenhum dado compartilhado de um Laço pode ser lido ou alterado por quem não pertence a ele. Aplicado no backend (RLS), não só no aplicativo.
2. **Autoria.** O autor de um registro é definido pelo servidor, não por quem envia.
3. **Impressão e momento favorito.** Só o próprio Membro escreve os seus. O outro Membro só os lê se já tiver registrado uma impressão própria **não vazia**; a regra é avaliada **na leitura** (apagar a própria impressão revoga o acesso). **Protegida no backend**, nunca apenas pela interface.
4. **Confiança entre os dois.** Fora o item 3 e o nome de cada um, os dois Membros têm as mesmas permissões, inclusive excluir ([ADR 003](../decisions/003-experience-permissions.md)). Não adicionar restrições além das definidas.
5. **Mídia privada.** As fotos só são acessíveis a Membros do Laço, sem URLs públicas permanentes.
6. **Transições.** Memória é final; a validação das transições permitidas não deve existir só na interface.
7. **Online-only.** Se algo não foi persistido, a interface não pode indicar que foi salvo.

## Identidade

- Cada pessoa tem uma **identidade estável no Supabase Auth, com e-mail + senha**; a senha é tratada pelo Auth, o aplicativo não cria mecanismo próprio; as políticas de acesso (RLS) e a autoria partem dela ([ADR 015](../decisions/015-identity-and-session.md)).
- A palavra-chave **não** é autenticação: depois do vínculo, a sessão sustenta o acesso.
- Uma identidade pertence a **no máximo um Laço** no MVP; a regra é garantida no backend.
- Não existe mecanismo próprio de recuperação de conta.

## Palavra-chave do vínculo

A palavra-chave dá acesso a um espaço privado e é um segredo compartilhado, usado só no vínculo inicial ([ADR 011](../decisions/011-couple-linking.md), [016](../decisions/016-keyword-abuse-protection.md)).

**Requisitos**

1. **Rate limit no servidor**, nunca só no cliente. Excesso de tentativas gera **bloqueio temporário** que expira sozinho, sem intervenção manual.
2. **Vinculação sem enumeração:** palavra inexistente e incorreta têm a mesma resposta genérica; nada revela se a palavra existe, se está em uso ou dados de outros Laços.
   **Criação, de propósito, diferente:** palavra já em uso é rejeitada e o aplicativo informa isso ([ADR 016](../decisions/016-keyword-abuse-protection.md)). Decisão intencional, não é contradição.
3. **Cobertura (requisito técnico):** como a criação confirma que uma palavra existe, o mecanismo de limite deve considerar também a criação; sem isso ela serviria de atalho ao limite da vinculação. Parâmetros e mecanismo são decisão de implementação, não de produto.
4. Conexão única entre duas pessoas: o Laço deixa de aceitar vínculos depois de formado.
5. O bloqueio não pode prejudicar o casal: sem fluxo complexo nem suporte manual.

**Antes da conta:** a verificação "em uso" acontece na etapa do código por função sem sessão, limitada por IP, e a criação é atômica ([ADR 023](../decisions/023-keyword-check-before-account.md)); a consulta de existência do e-mail é o **primeiro passo** da entrada ([ADR 024](../decisions/024-email-first-entry.md)): função sem sessão, limitada por IP no mecanismo do 018 (contador próprio); revela que um e-mail tem conta, risco baixo e aceito.

**Decidido** ([ADR 018](../decisions/018-keyword-protection-implementation.md)): 5 falhas em 10 minutos geram bloqueio de 15 minutos (valores iniciais, em configuração do servidor), por IP e por identidade, com o mesmo contador para Criar e Vincular. A palavra é normalizada e guardada só como HMAC com segredo do servidor, com índice único; o cliente não lê essa tabela, só chama as funções de Criar/Vincular.

**Mídia:** bucket privado, caminho `{laco}/{experiencia}/{arquivo}`, acesso por URL assinada de curta duração a Membros do Laço ([ADR 020](../decisions/020-photos-and-deletion.md)).

## Fora de escopo agora

Compartilhamento externo, recursos sociais e múltiplos papéis de acesso. Se o aplicativo vier a ser publicado em lojas, verificar exigências de exclusão de conta. Código aleatório no lugar da palavra-chave: [future.md](../product/future.md).
