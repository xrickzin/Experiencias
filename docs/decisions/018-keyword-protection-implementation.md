# 018 — Palavra-chave: limite de tentativas e armazenamento

**Status:** Aceita. Decisão técnica delegada pelo produto; valores iniciais, ajustáveis.

## Contexto
O [016](./016-keyword-abuse-protection.md) exige bloqueio temporário no servidor, sem fluxo complexo. Como a conta é criada no próprio onboarding (sem confirmação de e-mail, [017](./017-account-and-session-details.md)), limitar só por identidade seria contornável criando contas novas.

## Decisão
- **Onde:** funções no banco chamadas pelo aplicativo (Criar Laço e Vincular ao Laço), que são o único caminho de acesso às palavras-chave. Nenhuma tabela de palavras-chave é legível diretamente pelo cliente.
- **Limite inicial:** **5 tentativas sem sucesso em 10 minutos → bloqueio de 15 minutos**, que expira sozinho. Valores guardados em configuração do servidor, não no aplicativo.
- **Chave do limite:** origem da requisição (IP) **e** identidade autenticada; basta um dos dois atingir o limite. As proteções de cadastro do próprio Supabase Auth complementam.
- **Cobertura:** vale para Vincular **e** Criar (que confirma palavra em uso), com o mesmo contador.
- **Armazenamento:** a palavra é **normalizada** (sem espaços nas pontas, minúsculas, sem acentos, espaços internos colapsados) e guarda-se só um **derivado determinístico (HMAC com segredo do servidor)**, nunca o texto. Índice único sobre o derivado; é ele que decide "já em uso". Consequência: "Amor", "amor" e "ámor" contam como a mesma palavra.
- **Registro de tentativas:** tabela de apoio com tentativas recentes, limpa periodicamente.

## Complemento
Verificação antes de existir conta e criação atômica: [023](./023-keyword-check-before-account.md).

## Consequências
- Uma pessoa legítima só é bloqueada se errar muito em pouco tempo; o aviso é claro e dispensa suporte.
- Um ataque distribuído por muitos IPs não é totalmente contido; aceito para um aplicativo de casal. Reavaliar se o uso mudar.
- A palavra permanece guardada depois do vínculo (continua contando como "em uso").
- Disponibilidade de segredos no servidor e leitura do IP nas funções: validar na implementação.

## Alternativas consideradas
- Descartar a palavra após o vínculo: descartada, muda o significado de "em uso" decidido pelo produto.
- Hash lento com sal por palavra: descartada, impede a busca e a unicidade por igualdade.
