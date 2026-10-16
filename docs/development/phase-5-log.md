# Fase 5: Memória (log)

A experiência termina e a memória continua: finalizar, registrar memórias de antes do aplicativo, impressão pessoal e momento favorito de cada pessoa com a regra de privacidade, e observações simples. Decisões: [ADR 005](../decisions/005-memory-and-impressions.md), [008](../decisions/008-direct-memory-creation.md), [010](../decisions/010-explicit-typed-records.md), [012](../decisions/012-favorite-moment-and-cover-photo.md), [020](../decisions/020-photos-and-deletion.md), [028](../decisions/028-cover-photo-before-memory.md), [029](../decisions/029-moments-tab-and-create-choice.md). Produto: [memory.md](../product/memory.md), [permissions.md](../product/permissions.md#privacidade-da-impressão-e-do-momento-favorito), [lifecycle.md](../product/lifecycle.md#finalização). Telas: [screens.md](../ux/proposal/screens.md#detalhe-de-uma-memória-os-dois-estados-de-privacidade).

> **Estado: concluída** (2026-10-15). Testada no Supabase local e nos testes automáticos; as migrações da fase (memória, legenda e momento da observação) foram aplicadas no projeto real e o usuário validou no celular.

## O que foi implementado

**Banco** (`supabase/migrations/20261015170000_fase5_memoria.sql`)
- **Observações:** `registros` aceita o tipo `observacao` (só `texto`, 1 a 2.000 caracteres; foto continua só com arquivo). Os dois editam o texto, e o autor continua o original.
- **Memória exige data:** uma regra impede `memoria` com `sem_data`, inclusive ao editar depois.
- **Finalizar:** a função `finalizar_experiencia` só aceita Vivendo e trava a linha. Sem data, exige a referência informada; se a outra pessoa finalizou ou definiu a data antes, vale a dela (o primeiro a definir fixa). Finalizar duas vezes dá o mesmo resultado.
- **Registrar uma memória:** o cliente pode criar em `desejo` ou `memoria`, nunca em Planejamento ou Vivendo.
- **Impressões e momento favorito:** tabela `impressoes`, uma linha por pessoa e memória (`texto` nulo = não registrada; `momento_favorito_id` aponta para uma foto da própria memória e é limpo se ela for excluída). Escrita só pelas funções `salvar_minha_impressao` (texto vazio apaga) e `escolher_meu_momento_favorito`, que só mexem na linha de quem chama.
- **Privacidade no banco (RLS):** a leitura traz sempre a própria linha e a da outra pessoa **só se** quem lê já tem impressão não vazia. A regra vale na hora da leitura, e linhas ocultas não aparecem, de modo que nada revela se a outra pessoa escreveu.

**App**
- **`+`:** abre a escolha entre "Criar um desejo" e "Registrar uma memória" (ADR 029).
- **Registrar uma memória:** `/criar?tipo=memoria`, com título e "Quando" obrigatórios (sem a opção "Sem data"). Ao guardar, abre a memória.
- **Finalizar** (Vivendo, aba Detalhes): pop-up "Finalizar experiência? Ela vira uma memória e não volta para Vivendo." com "Finalizar" ou "Ainda não". Sem data, vem antes "Quando vocês viveram isso?". Depois aparece "Essa experiência virou uma memória." com a escrita da impressão já aberta e "Escrever depois".
- **Memória:** abas **Memória**, **Momentos** e **Detalhes**.
  - A aba Memória mostra destaque, título, quando e local. Em "Nossos momentos" ficam o meu favorito e o da outra pessoa, ou o aviso neutro. Em "O que ficou para nós" fica a minha impressão (escrever, editar ou apagar com confirmação que explica o efeito) e a da outra pessoa, quando a regra permite.
  - O aviso neutro "A impressão e o momento favorito de {nome} serão revelados quando você registrar a sua impressão." tem sempre o mesmo texto. Só depois de registrar a própria aparece "{nome} ainda não registrou a impressão.".
  - Sem a segunda pessoa vinculada, não há bloco dela.
- **Momentos** (antes "Fotos"): "Escrever observação" ao lado de "Tirar foto" e "Escolher da galeria". As observações aparecem entre as fotos, no dia e período em que foram escritas, com o nome de quem escreveu; tocar abre para editar ou excluir (com pop-up). Na memória, a foto aberta oferece "Escolher como meu momento favorito", e a miniatura ganha a etiqueta "FAVORITO".
- **Nossa História:** lista as memórias, da mais recente para a mais antiga, e convida a registrar uma quando está vazia.

## Legenda nas fotos e observação do momento (pedido do usuário, 2026-10-15)
Decisão: [ADR 030](../decisions/030-photo-caption-and-observation-moment.md).
- **Legenda:** na foto aberta, "Adicionar legenda" / "Editar legenda" (até 300 caracteres; guardar em branco tira). Os dois podem. O leitor de tela lê a legenda na miniatura.
- **Observação do momento:** o botão virou "Escrever observação do momento". A tela explica que a observação fica no dia e no período escolhidos, junto das fotos, e mostra "Vai aparecer em: Hoje · Tarde". Padrão: agora; dá para escolher Hoje, Ontem ou Outro dia (digitado, nunca no futuro) e o período, inclusive ao editar.
- **Banco** (`supabase/migrations/20261015180000_legenda_e_momento_da_observacao.sql`): `registros.legenda` (só em fotos, 1 a 300 caracteres); a observação usa `capturada_em` (o mesmo campo das fotos), agora editável pelos dois.
- **Testes:**
  - `supabase/tests/legendas.mjs` (11 verificações): legenda pelos dois, em branco e longa recusadas, outro Laço sem acesso, tirar; observação com momento escolhido e alterado, futuro distante recusado, sem legenda, outro Laço sem acesso.
  - No app:
    - regras de dia e período (`agrupar-fotos-test.ts`);
    - serviços de legenda e observação com momento;
    - telas: adicionar legenda, editar com falha, observação no momento atual, ontem de manhã, outro dia no futuro recusado, edição começando no momento da observação.
  - Total: **237 testes** no app.

## Decisões tomadas nesta fase
- **"O primeiro a definir fixa a referência"** foi tratado como regra de concorrência na finalização: duas pessoas finalizando ao mesmo tempo não sobrescrevem a data uma da outra. Depois de virar memória, a data **continua editável** pelos dois em Detalhes, como os outros dados gerais, mas nunca pode ficar "sem data". Se a intenção era travar a data da memória para sempre, é uma mudança pequena no banco.
- **Escrita de impressões só por funções do servidor**, não pela tabela: assim ninguém cria ou altera a linha da outra pessoa, nem por engano.
- **Momento favorito escolhido na foto aberta** (aba Momentos), no mesmo lugar do destaque. A aba Memória mostra o favorito e explica onde escolher.
- **Nossa História em lista simples.** O agrupamento por mês/ano e a foto de destaque nas memórias são a Fase 6.
- **Voz das impressões:** Fraunces em itálico sintético (a família itálica não foi incluída nas fontes). Conferir no aparelho.

## Validação (2026-10-15)

| Verificação | Resultado |
|---|---|
| `npm test` (app) | 16 arquivos, **237 testes** (com legenda e momento da observação) |
| `supabase/tests/memoria.mjs` e `legendas.mjs` (Supabase local) | 40 e 11 verificações passaram |
| `integracao`, `experiencias`, `planejamento`, `fotos`, `destaque`, `sessao-app` | passaram |
| `supabase db reset` (local) | todas as migrações aplicam do zero, em ordem |
| `tsc`, `expo lint` | sem erros nem avisos |
| `expo export` (Android e iOS) | ambos geraram o pacote sem erro |

- **Integração** (`memoria.mjs`):
  - **Observações:** autoria; edição pela outra pessoa preservando o autor; vazia, com arquivo e em Desejo recusadas; foto não ganha texto; outro Laço não edita.
  - **Finalizar:** Desejo recusado; sem data pede a referência; referência incoerente recusada; quem define primeiro fixa; Memória não volta e não fica sem data; dados continuam editáveis; fotos continuam entrando; outro Laço não finaliza.
  - **Memória direta:** sem data recusada; com mês aceita; criar em Vivendo recusado.
  - **Impressões:** só em Memória. Antes de registrar, nada da outra pessoa aparece (nem que existe). Escolher o favorito não revela nada, e impressão em branco não conta. Depois de registrar, vê impressão e favorito da outra pessoa, com o caminho da foto. Apagar a própria volta a ocultar e não afeta a da outra. Ninguém escreve pela tabela nem em nome da outra pessoa.
  - **Favorito e isolamento:** favorito só com foto da própria memória (nunca observação); outro Laço não lê nem escreve; excluir a foto limpa o favorito; sem sessão, nada; excluir a memória leva as impressões.
- **App:**
  - `memoria-servicos-test.ts` (finalizar, registrar memória, observações, impressões);
  - `memoria-test.tsx`:
    - o `+` com as duas opções e a memória exigindo data;
    - finalizar com data, sem data, "Ainda não" e falha;
    - os dois estados de privacidade, sem a outra pessoa vinculada, escrever e apagar a impressão;
    - observações (criar, a da outra pessoa com o nome, editar e excluir);
    - favorito só na memória;
    - Nossa História vazia e com ordem.

**Validado pelo usuário no celular** (2026-10-15), com o projeto Supabase real, inclusive a legenda e o momento da observação.

## O que exige a sua ação
1. **Aplicar no projeto real**, nesta ordem:
   - `07 · Fase 5 · Memória`: `supabase/migrations/20261015170000_fase5_memoria.sql`;
   - `08 · Legenda e momento da observação`: `supabase/migrations/20261015180000_legenda_e_momento_da_observacao.sql`.
2. **Testar no aparelho, de preferência com os dois celulares:**
   - escrever, editar e excluir observações;
   - finalizar uma experiência com data e outra sem data;
   - registrar uma memória antiga pelo `+`;
   - em uma memória, conferir que cada um só vê a impressão e o favorito do outro depois de escrever a sua, e que apagar a própria volta a esconder.
3. **Confirmar a interpretação** de "o primeiro a definir fixa" (acima).
