# 017 — Detalhes de conta e sessão

**Status:** Aceita. Decisão técnica delegada pelo produto; validar contra a documentação vigente do Supabase e do Expo SDK instalado antes de implementar.

## Contexto
O [015](./015-identity-and-session.md) fixa Supabase Auth com e-mail + senha dentro do onboarding. Faltavam os detalhes de conta, que não podem criar barreira nem mecanismo próprio de recuperação.

## Decisão
- **Confirmação de e-mail: desligada** no MVP. A pessoa entra em Início logo após Criar/Vincular. Risco aceito: um e-mail digitado errado só se descobre quando a recuperação falhar; a UX pode pedir o e-mail com cuidado (ex.: dupla digitação), sem criar passo extra obrigatório.
- **E-mail já cadastrado em Criar/Vincular:** tratar como entrada. Se a senha confere, a pessoa é autenticada e segue: se já tem Laço, vai direto a ele (nunca cria um segundo); se não tem, continua o fluxo. Se não confere, mensagem genérica de e-mail ou senha incorretos.
- **Esqueci a senha:** entra no MVP, pelo **fluxo nativo do Supabase Auth** (e-mail de redefinição). Sem isso, perder a senha significaria perder a história do casal. O formato (link ou código) é escolhido na implementação; link depende do `scheme` do aplicativo ([021](./021-naming-and-identifiers.md)).
- **Política de senha:** mínimo de **8 caracteres**, sem regras de composição.
- **Sessão persistente:** guardada no armazenamento seguro do aparelho, preferindo módulos do Expo; a solução exata (inclusive limites de tamanho de valor) é validada na implementação.
- **Um Laço por identidade:** garantido no banco com unicidade da identidade em `membros` ([data-model.md](../architecture/data-model.md)), não só no aplicativo.

## Consequências
- A tela de "esqueci a senha" é a única adição visível ao escopo de entrada; é pequena e reversível (basta remover do MVP, com o risco descrito acima).
- Onde quem já tem conta entra a partir da primeira tela é tratado na direção de UX ([open-questions-ux.md](../ux/open-questions-ux.md), UX-C1 e UX-C2).

## Alternativas consideradas
- Confirmação de e-mail ligada: descartada, vira barreira no onboarding.
- Sem "esqueci a senha": descartada, risco de perda de acesso definitiva.
