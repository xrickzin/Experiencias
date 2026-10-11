# 016 — Palavra-chave e proteção contra tentativas abusivas

**Status:** Aceita. Substitui a parte "sem limite de tentativas" do [011](./011-couple-linking.md).

## Contexto
A palavra-chave dá acesso a um espaço privado e, antes de o parceiro vincular, quem a adivinhar entra no Laço. A decisão anterior aceitava não limitar tentativas; foi revista.

## Decisão
- A palavra-chave escolhida pelo casal é só o mecanismo de **vínculo inicial**. **Não é** senha, autenticação nem recuperação de conta. Não é trocada no MVP. **Não** é substituída por código aleatório neste momento.
- **Criar Laço:** a primeira pessoa informa o próprio nome, o nome da outra e a palavra-chave. **Vincular ao Laço:** a segunda pessoa informa só a palavra-chave.
- **Tentativa normal sem correspondência:** mensagem genérica (ex.: "Não encontramos um Laço com essa palavra."). Não revela se a palavra existe, se está em uso por outro Laço, nem nada sobre outros Laços.
- **Excesso de tentativas:** novas tentativas são **bloqueadas temporariamente**, com aviso claro (ex.: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."). O bloqueio é temporário, **dispensa intervenção manual ou suporte** e as tentativas voltam a ser permitidas depois do período.
- A proteção é aplicada **no servidor**, não só no cliente.
- Número de tentativas, janela e duração do bloqueio são **decisões técnicas** (definidas no [018](./018-keyword-protection-implementation.md)). Sem fluxo de segurança complexo que prejudique o casal.

- **Criação com palavra já em uso (confirmada, intencional):** a criação é rejeitada e o aplicativo informa que a palavra já está em uso e pede outra (ex.: "Essa palavra-chave já está sendo usada. Escolha outra."; texto final é da UX).

## Criação × vinculação
Duas respostas diferentes, de propósito. Não é uma contradição a resolver de novo.

| Fluxo | Palavra | Resposta |
|---|---|---|
| **Criar Laço** | já em uso por outro Laço | informa que está em uso e pede outra |
| **Vincular ao Laço** | inexistente ou incorreta | resposta genérica; nada sobre outros Laços |

## Consequências
- A criação confirma que uma palavra existe; a vinculação não. A proteção contra tentativas abusivas (decidida para a vinculação) deve ser desenhada na implementação levando em conta também a criação, para que ela não sirva de atalho: requisito técnico em [security.md](../architecture/security.md#palavra-chave-do-vínculo). Não é uma nova decisão de produto.
- Os exemplos de mensagem não são texto final (UX).
- Parâmetros, mecanismo e armazenamento: [018](./018-keyword-protection-implementation.md).

## Alternativas consideradas
- Sem limite de tentativas (decisão anterior): descartada; permitiria adivinhação por tentativa e erro.
- Código aleatório gerado pelo aplicativo: adiada ([future.md](../product/future.md)).
