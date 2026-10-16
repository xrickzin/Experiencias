# Fase 6: Nossa História (log)

O álbum do casal: as memórias agrupadas por mês, com a foto de destaque. Produto: [memory.md](../product/memory.md#nossa-história). UX: [our-story.md](../ux/our-story.md), [screens.md](../ux/proposal/screens.md#nossa-história). Decisão: [ADR 031](../decisions/031-month-only-memories-in-our-story.md).

> **Estado: concluída** (2026-10-15). Validada no celular pelo usuário. Não há migração: os dados já chegavam ao app desde as Fases 4 e 5.

## O que foi implementado
- **Agrupamento** (`app/src/services/nossa-historia.ts`, `agruparPorMes`): as memórias se agrupam pelo mês de início da referência temporal. Os meses vão do mais recente ao mais antigo e, dentro de cada um, a ordem é crescente (data e horário). Um período aparece uma vez só, no mês em que começa: 28/10 → 02/11 fica em outubro e 30/12/2026 → 03/01/2027 fica em dezembro de 2026.
- **Só mês/ano** (ADR 031): fica no fim do mês, sob "Em algum dia de {mês}", em ordem alfabética, sem sugerir um dia.
- **Tela** (`app/src/app/(tabs)/nossa-historia.tsx`):
  - o cabeçalho "Tudo o que já vivemos juntos.";
  - um título por mês (lido como cabeçalho pelo leitor de tela);
  - um fio fino na cor de destaque ligando os meses;
  - no fim, "E ainda tem muito por viver." com o fio continuando.
  - Os estados de carregando, erro e vazio ficaram como estavam.
- **Foto de destaque:** a `LinhaDaExperiencia` ganhou a propriedade opcional `fotoDestaqueUrl`. Memória com destaque mostra a foto acima do título, com o espaço reservado enquanto carrega para a lista não pular. Sem destaque, fica a composição tipográfica (título e data). As URLs de todas as memórias saem numa só chamada de `assinarCaminhos`.

## Validação (2026-10-15)

| Verificação | Resultado |
|---|---|
| `npm test` (app) | 17 arquivos, **242 testes** |
| `tsc`, `expo lint` | sem erros nem avisos |

- `nossa-historia-test.ts`: ordem dos meses e dentro do mês (inclusive horários no mesmo dia), período virando o mês e o ano, só mês/ano à parte, lista vazia.
- `memoria-test.tsx`: títulos dos meses, uma foto de destaque (pedida uma vez só), o separador "Em algum dia de outubro" e o rodapé.
- **Não executado:** testes de integração com o Supabase local (nada mudou no banco), `expo export` e o teste no aparelho.

## Validado pelo usuário no celular (2026-10-15)
Roteiro sugerido na entrega:
1. **Testar no celular:**
   - memórias em meses diferentes;
   - uma com período virando o mês;
   - uma só com mês/ano;
   - com e sem foto de destaque;
   - trocar o destaque e voltar à aba.
2. **Conferir o visual:**
   - o fio lateral;
   - o tamanho da foto (proporção 3:2);
   - o rodapé.
