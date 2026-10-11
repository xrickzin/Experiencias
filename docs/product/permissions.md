# Permissões

Fonte de verdade de **quem pode fazer o quê** e de **quem pode ver o quê**.
**Decisão:** [003](../decisions/003-experience-permissions.md), [005](../decisions/005-memory-and-impressions.md), [012](../decisions/012-favorite-moment-and-cover-photo.md).

> **A experiência pertence aos dois. Os registros pertencem à experiência. Impressões e momentos favoritos pertencem individualmente a cada pessoa.**

O princípio de partida é a **confiança no casal**: nenhum dos dois é tratado como possível adversário. As únicas proteções entre os dois são as da impressão pessoal e do momento favorito.

## Quem pode fazer o quê

| Item | Ver | Criar / editar | Excluir |
|---|---|---|---|
| Dados gerais da experiência | ambos | ambos | ambos (cancelar) |
| Planejamento | ambos | ambos | ambos |
| Transições de estado | — | ambos | — |
| Registros (foto, observação) | ambos | ambos | ambos |
| Foto de destaque da memória | ambos | ambos | — |
| Referência temporal da memória | ambos | o primeiro a definir fixa | — |
| **Impressão pessoal** | regra abaixo | **só o próprio** | só o próprio |
| **Momento favorito** | regra abaixo | **só o próprio** | só o próprio |
| Nome exibido no Laço | ambos | **só o próprio** | — |

- Todo registro **preserva o autor**, mesmo que o outro o edite ou exclua.
- Cancelar (excluir a experiência, inclusive Memória) pode ser feito por qualquer um dos dois, com confirmação explícita ([lifecycle.md](./lifecycle.md#cancelamento)).
- Cada pessoa edita só o próprio nome, sem pedir autorização ao outro. Quem cria o Laço informa o nome da outra pessoa, mas depois do vínculo ela passa a controlar o seu.

## Privacidade da impressão e do momento favorito

**Regra única, vale para os dois itens e é do leitor:** uma pessoa só vê a impressão e o momento favorito da outra **se já tiver a própria impressão registrada**.

- "Registrada" = texto **não vazio** (vazio ou ausente = não registrada).
- Cada pessoa vê sempre os seus.
- Escolher **"Escrever depois"** não bloqueia a memória: ela é criada normalmente e a pessoa pode voltar depois.
- A regra é **individual**: não bloqueia a memória inteira. Fotos, observações, data, local e demais registros compartilhados continuam visíveis e editáveis conforme as permissões acima.
- Exemplo: A registra a impressão e ainda não vê a de B; quando B registra a sua, ambos passam a ver os conteúdos individuais um do outro.
- A pessoa pode **criar, editar, apagar e reescrever** a própria impressão. Apagar não apaga nem oculta a impressão nem o favorito do outro.
- A visibilidade é decidida **no momento da leitura**: se a pessoa apagar a própria impressão, volta a não ver os do outro. O que já viu não é desfeito (confiança no casal).
- Consequência aceita: quem nunca escrever nunca verá a impressão nem o favorito do outro.

> **A regra não pode depender só da interface.** Deve ser protegida também no backend (RLS) quando implementada: ver [../architecture/security.md](../architecture/security.md).

## Em aberto

Nenhuma questão de permissão em aberto. Ver [open-questions.md](./open-questions.md).
