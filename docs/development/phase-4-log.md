# Fase 4: Fotos (log)

Fotos como registros das experiências em Planejamento e Vivendo, guardadas num Storage privado. Decisões: [ADR 003](../decisions/003-experience-permissions.md), [010](../decisions/010-explicit-typed-records.md), [013](../decisions/013-records-in-planning.md), [020](../decisions/020-photos-and-deletion.md). Produto: [memory.md](../product/memory.md#registros). Segurança: [security.md](../architecture/security.md).

> **Estado: concluída** (2026-10-15). Testada no Supabase local e nos testes automáticos; as migrações da fase e a da foto de destaque foram aplicadas no projeto real e o usuário validou no celular as fotos, as abas, o agrupamento e o cartão de Vivendo. Implementada com autonomia delegada pelo usuário.

## O que foi implementado

**Banco e Storage** (`supabase/migrations/20261015140000_fase4_fotos.sql`)
- Tabela `registros` (tipo `foto`): experiência, Laço e autor definidos pelo servidor (`meu_laco_id()`, `meu_membro_id()`), caminho `{laço}/{experiência}/{arquivo}` validado (só caracteres seguros, sem `../`, da mesma experiência), um arquivo por registro.
- RLS: os dois membros leem e excluem; criar só em Planejamento, Vivendo ou Memória (em Desejo não há registros). O cliente informa só a experiência e o caminho.
- Bucket **privado** `experiencias`: só imagens (JPEG, PNG, WebP, HEIC/HEIF), até 15 MB por arquivo, sem sobrescrever. Políticas no `storage.objects`: ler, enviar (só em experiência do próprio Laço e em estado que aceita registros) e excluir, sempre restritas à pasta do Laço. Acesso por **URL assinada de 1 hora**; não há URL pública.
- Voltar uma experiência para Desejo **não apaga** as fotos (lifecycle.md), mas não aceita novas até voltar a Planejamento.

**Aplicativo**
- `services/fotos.ts`: listar (com URLs assinadas), enviar (arquivo primeiro, depois o registro; se o registro falhar, apaga o arquivo enviado), excluir foto (arquivo, depois registro) e remover as fotos de uma experiência.
- **Excluir uma experiência** apaga primeiro os arquivos dela (ADR 020); se o Storage falhar, nada é excluído e a pessoa vê "Nada foi excluído; tente de novo".
- **Fotos na experiência** (`fotos-da-experiencia.tsx`), em Planejamento e Vivendo: grade de miniaturas, "Tirar foto" (pede a permissão da câmera e explica se for negada) e "Escolher da galeria" (até 10 de uma vez, enviadas uma a uma, com "Guardando foto 2 de 5…"; se uma falhar, diz quantas entraram). Tocar abre a foto em tela cheia, com "Excluir foto" pelo pop-up de confirmação.
- `expo-image-picker` (~57.0.20, incluído no Expo Go) para câmera e galeria; `expo-image` (já instalado) para mostrar. Qualidade 0,7. O EXIF é lido **no aparelho** só para a data de captura; nenhum dado dele (como localização) é enviado ao banco.
- `app.json`: plugin do `expo-image-picker` com os textos de permissão (câmera e fotos) e sem microfone. Só vale em build; no Expo Go valem as permissões do próprio Expo Go.

## Abas e fotos por momento (pedido do usuário, 2026-10-15)
- **Abas "Fotos" e "Detalhes"** na experiência em Planejamento e em Vivendo (`components/abas.tsx`). O que importa no momento vem primeiro:
  - **Vivendo** abre em **Fotos** (botões "Tirar foto" e "Escolher da galeria" no topo); título, quando, local, observações, "Voltar para planejamento" e "Excluir" ficam em **Detalhes**.
  - **Planejamento** abre em **Detalhes** (com "Começar a viver" no topo); as fotos ficam na aba ao lado.
  - Ao tocar em "Começar a viver", a tela passa para a aba Fotos. Desejo não tem abas (não há fotos).
  - Aba ativa com texto em negrito e o fio vermelho embaixo, não só cor.
- **Fotos agrupadas por dia e por período, no horário de Brasília** (`services/agrupar-fotos.ts`): "Hoje", "Ontem" ou a data; dentro do dia, **Madrugada (0h–4h59), Manhã (5h–11h59), Tarde (12h–17h59), Noite (18h–23h59)**; das mais recentes para as antigas. Brasília sem horário de verão desde 2019: UTC−3 fixo.
- **Quando a foto foi tirada**, não quando foi enviada: o aparelho lê a data da própria foto (EXIF `DateTimeOriginal`, com o fuso gravado nela quando existe, senão Brasília) e manda **só esse instante** na nova coluna `registros.capturada_em` (migração `20261015150000_fase4_fotos_capturada_em.sql`). Foto da câmera sem essa informação vale "agora"; da galeria sem data, vale o momento do envio. Datas absurdas (relógio zerado, futuro) são ignoradas no aparelho e recusadas no banco.

## Foto de destaque e cartão de Vivendo (pedido do usuário, 2026-10-15)
- Na foto aberta: **"Usar como foto de destaque"** / **"Tirar do destaque"**. A miniatura escolhida ganha borda e a etiqueta "DESTAQUE". É a foto de destaque do [ADR 012](../decisions/012-favorite-moment-and-cover-photo.md), compartilhada, e não o momento favorito (individual e privado, Fase 5); ver [ADR 028](../decisions/028-cover-photo-before-memory.md).
- No Início, a primeira experiência de "Vivendo agora" é um **cartão com a foto** (`components/cartao-vivendo.tsx`, URL assinada em `hooks/use-url-assinada.ts`). Sem destaque, ou se a URL não vier, aparece o substituto com o fio e "Escolham uma foto de destaque para este momento.".
- Banco: `experiencias.foto_destaque_id` (migração `20261015160000_foto_destaque.sql`). Um gatilho aceita só foto da mesma experiência, e excluir a foto limpa o ponteiro.
- Testes: `supabase/tests/destaque.mjs` (7 verificações: escolher, trazer o caminho junto, trocar, foto de outra experiência recusada, outro Laço não altera, tirar, excluir a foto limpa) e, no app, serviço, escolha e retirada na tela de fotos, falha sem fechar a foto e o cartão do Início (com foto, sem foto, URL indisponível, toque abre a experiência). Total: **192 testes**.

## Decisões tomadas nesta fase (autonomia delegada)
- **Envio em base64 convertido para bytes** (`atob`, nativo do Hermes), sem biblioteca extra de arquivos. Teto: fotos muito grandes ocupam memória durante o envio; a qualidade 0,7 mantém o tamanho razoável. Se pesar, trocar por envio a partir do arquivo (`expo-file-system`).
- **Sem redimensionamento** antes do envio: evita mais uma dependência; o limite de 15 MB do bucket e a qualidade 0,7 bastam no MVP.
- **Metadados da foto:** o app não envia o EXIF ao banco. O arquivo é recomprimido (qualidade 0,7), o que normalmente descarta os metadados embutidos, inclusive a localização, mas **isso não foi verificado** em arquivos reais de Android e iOS. Se for importante garantir, conferir um arquivo enviado ou recodificar a imagem antes de enviar.
- **Observação como registro** (o outro tipo de registro do MVP) **não entrou**: o roadmap põe só fotos nesta fase. O banco já tem `tipo`, preparado para receber `observacao` depois.
- **Miniaturas usam a própria imagem** (sem versão reduzida no servidor); a URL assinada vale 1 hora e é renovada ao reabrir a tela.

## Validação (2026-10-15)

| Verificação | Resultado |
|---|---|
| `npm test` (app) | 14 arquivos, **181 testes** (com as abas e o agrupamento) |
| `supabase/tests/fotos.mjs` (Supabase local) | 30 verificações passaram (inclui a data de captura e a recusa de data futura) |
| `integracao.mjs`, `experiencias.mjs`, `planejamento.mjs`, `sessao-app.mjs` | passaram |
| `supabase db reset` (local) | todas as migrações (inclusive a do destaque) aplicam do zero, em ordem |
| `tsc`, `expo lint`, `expo export` (Android e iOS) | saída 0, sem avisos |
| `expo-doctor` | os mesmos 2 avisos já conhecidos (ícone do iOS do template e patches do SDK), nada novo |

- **Testes do app novos:** `fotos-servico-test.ts` (nome de arquivo seguro, base64 → bytes, ordem arquivo/registro, limpeza quando o registro falha, foto grande, exclusão na ordem certa e falha que preserva o registro, remoção em lote, URLs assinadas) e `fotos-tela-test.tsx` (sem fotos em Desejo, seção em Planejamento e Vivendo, miniaturas, câmera negada, câmera, cancelar, galeria com várias e falha no meio, excluir foto pelo pop-up, excluir experiência com falha nas fotos e com sucesso).
- **Integração** (`fotos.mjs`): recusa em Desejo, envio e registro com autor/Laço/tipo do servidor, arquivo não imagem recusado, sem sobrescrever, caminho de outra experiência e com `../` recusados, autor não escolhido pelo cliente, a outra pessoa vê e baixa pela URL assinada (bytes iguais), sem acesso público, outro Laço não vê/não assina/não envia/não apaga, sem sessão nada, voltar a Desejo mantém e bloqueia novas, envio em Vivendo, exclusão da foto e da experiência na ordem do ADR 020.
- **Abas e agrupamento:** `agrupar-fotos-test.ts` (limites de cada período, virada de dia em Brasília, Hoje/Ontem/data, ordem, sem data de captura, leitura do EXIF com e sem fuso, datas absurdas) e, em `fotos-tela-test.tsx`, Vivendo abrindo em Fotos com dias e períodos, Planejamento abrindo em Detalhes e a galeria mandando só o instante da captura.
- `app/__mocks__/expo-image.tsx`: o componente nativo de imagem vira uma `View` nos testes.

**Validado pelo usuário no celular** (2026-10-15), com o projeto Supabase real. Não exercitado de propósito: envio de foto muito grande pela rede do celular e o iOS (o teste foi num aparelho só).

## O que exige a sua ação
1. **Aplicar as migrações no projeto real** (depois da Fase 3), nesta ordem:
   - `04 · Fase 4 · Fotos e Storage`: `supabase/migrations/20261015140000_fase4_fotos.sql` (cria o bucket `experiencias` e as políticas; conferir em *Storage* que o bucket é **privado**);
   - `05 · Fase 4 · Data de captura das fotos`: `supabase/migrations/20261015150000_fase4_fotos_capturada_em.sql`;
   - `06 · Foto de destaque`: `supabase/migrations/20261015160000_foto_destaque.sql`.
2. **Testar no aparelho:** ver Vivendo abrir em Fotos e Planejamento em Detalhes; fotos de dias e horários diferentes da galeria caindo no dia e período certos; levar uma experiência a Planejamento, tirar uma foto, escolher várias da galeria, abrir e excluir uma, voltar a Desejo (as fotos ficam, a seção some), excluir a experiência com fotos; com dois aparelhos, ver a foto da outra pessoa.
3. **Avaliar as decisões acima**, principalmente o tamanho das fotos (sem redimensionar) e a ausência da observação como registro.
