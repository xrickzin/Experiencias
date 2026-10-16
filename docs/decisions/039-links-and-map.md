# 039 — Links da experiência e "Abrir no mapa"

**Status:** Aceita (escolha do usuário, 2026-10-16). Etapa 2 do [ADR 038](./038-proportional-planning.md). Leva para o MVP uma parte da "Localização geográfica" de [future.md](../product/future.md).

## Contexto
O casal guarda endereços ao planejar: o site do restaurante, o ingresso, a pousada. Para viagens, ajuda ligar o lugar ao Google Maps. Foram consideradas quatro formas:
1. pesquisar o texto do Local no Google Maps;
2. guardar o link de um lugar no Maps;
3. sugerir lugares enquanto se digita (Places API);
4. mostrar um mapa dentro do app.

As opções 3 e 4 pedem chave de API com faturamento, enviam o que é digitado ao Google, e a 4 não roda no Expo Go.

## Decisão
- **Links:** cada experiência tem uma lista de links, com nome (1 a 60 caracteres) e endereço `http(s)://` (até 2.000 caracteres).
  - Estão em todos os estados, na parte de Detalhes, e salvam na hora, à parte do "Salvar" do formulário.
  - Os dois criam, editam e excluem. A exclusão pede confirmação.
  - Tocar abre o endereço. Um link do Google Maps aparece como "Google Maps" e abre o lugar no app.
  - Ao colar o "Compartilhar" do Google Maps, fica só o link e o nome do lugar preenche o Nome, se vazio. Sem `http`, o endereço é entendido como `https://`.
- **Abrir no mapa (opção 1):** com o Local preenchido, o campo mostra "Abrir no mapa", que pesquisa o texto no Google Maps. Não há chave de API e nada fica guardado.
- **Opção 2:** é coberta pelos links do Google Maps.
- **Fora:** as opções 3 e 4 (Places, coordenadas, mapa no app). Seguem em [future.md](../product/future.md). Coordenadas guardadas pela opção 3 seriam a base da 4.

## Consequências
- A migração `20261016140000_links.sql` cria a tabela `links`.
  - Laço e autor vêm do servidor.
  - Leitura e escrita ficam só no próprio Laço.
  - O banco recusa endereços que não sejam web (`javascript:`, `file:`…).
  - Os links saem com a experiência.
- A suíte do banco é `supabase/tests/links.mjs`.
