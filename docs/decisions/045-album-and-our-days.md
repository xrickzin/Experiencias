# 045 — O álbum e Nossos dias

**Status:** Aceita (pedido do casal, 2026-11-03). Amplia Nossa História ([memory.md](../product/memory.md#nossa-história)) e a finalização ([lifecycle.md](../product/lifecycle.md#finalização)).

## Contexto
Nossa História misturava momentos marcantes (uma viagem, o pedido de namoro) com coisas simples (um filme no fim de semana). O casal quer que Nossa História seja o álbum da história deles, sem perder os dias simples.

## Decisão
- Toda memória está **no álbum** ou em **Nossos dias**. As duas são memória: a mesma tela, os mesmos registros, as mesmas regras. Muda só onde aparecem ("não importa o tamanho da coisa", [vision.md](../product/vision.md)).
- Nossa História tem dois lados, **"O álbum · Nossos dias"**, e abre sempre no álbum. O álbum é a página por mês de sempre; Nossos dias é uma lista leve por mês.
- **Ao finalizar**, a confirmação pergunta **"Isso entra no álbum?"**: "Sim, no álbum" ou "Nos nossos dias". Ao registrar uma memória direto, a mesma escolha aparece no formulário, com o álbum já marcado.
- **Qualquer um dos dois muda depois, a qualquer momento**, na aba Detalhes da memória ("Tirar do álbum" / "Levar para o álbum"). Como a foto de destaque, não entra na trava dos detalhes ([ADR 042](./042-memory-details-locked.md)).
- "A última página da nossa história", no Início, mostra só memórias do álbum.
- Desejos e planejamento não mudam: a separação só existe na memória.

## Nossos dias: caderninho + calendário (2026-11-03)
- **Cada mês:** o calendário das semanas vividas, só de relance (não se toca nele), em todo mês com dia vivido: o fio dá um laço embaixo de cada dia vivido (o desenho do laço das abas, menor) e parte para o próximo, serpenteando pela lateral sem cruzar os números; com um dia só, é a semana dele com o laço sem fio. Laços, não pontos: a identidade do app, e o caderninho em papel, com a margem vermelha, o dia na margem e o que fizeram na voz do álbum. Dois registros no mesmo dia mostram a data só na primeira linha; período aparece como "24–26"; memórias só com mês/ano ficam no fim, sob "Em algum dia de outubro". Polaroide pequena só quando há foto de destaque.
- **Impressões no caderno:** embaixo de cada linha, as impressões que a pessoa pode ver (a minha primeiro). A regra de privacidade é a mesma e é do banco; o caderno mostra o que existe e nunca o que falta. Tocar na linha abre para escrever ou editar a própria impressão ali mesmo; apagar continua só na memória. Sem a própria impressão, a linha aberta diz "Cada um lê a do outro depois de escrever a sua." (sempre a mesma frase, sem insinuar nada).
- **Busca:** uma linha de caderno que entende título, local, observações, impressões visíveis, o nome do tema e o mês ("filme outubro"), mais os temas em uso como atalhos. Só aparece com mais de um mês ou mais de 8 dias. O resultado continua agrupado por mês.

## Por que o álbum é o padrão
As memórias que já existiam estavam todas no álbum; mantê-las lá não esconde nada de ninguém. Para a escrita no banco, o padrão também é o lado seguro: se a escolha "Nos nossos dias" não for gravada, a memória fica visível no álbum e pode ser mudada.

## Alternativas descartadas
- **Uma aba nova** para o dia a dia: apertaria a barra (com o "+" no centro) e criaria mais um lugar para procurar memórias.
- **Separar pela duração** ("uma noite" = simples): erra o caso que importa, como um jantar de pedido de namoro.
- **Decidir desde o desejo:** a diferença só importa quando vira lembrança.

## Consequências
- Coluna `experiencias.no_album` (`boolean not null default true`), com `grant update (no_album)` (a tabela concede update coluna a coluna), migração `20261103120000_memoria_no_album.sql`, aplicada no projeto real pelo usuário.
- Nossos dias segue a proposta "caderninho + calendário" ([nossos-dias.html](../ux/proposal/nossos-dias.html)), aprovada pelo casal em 2026-11-03.
- O registro direto em Nossos dias pede também `grant insert (no_album)`, que faltava: migração `20261104120000_memoria_no_album_ao_registrar.sql`, a aplicar no projeto real. Enquanto isso, o app só envia `no_album` quando a escolha é "Nos nossos dias", e o álbum, que é o padrão, continua funcionando.
- O finalizar grava a escolha numa segunda escrita, depois da RPC `finalizar_experiencia` (comentário `ponytail:` no serviço; o caminho atômico é um parâmetro na RPC).
