# Fase 2: Desejos (log)

Desejos reais, gravados no Supabase. Decisões: [ADR 003](../decisions/003-experience-permissions.md), [006](../decisions/006-cancellation.md), [025](../decisions/025-wish-optional-fields.md). Escopo do MVP: [mvp.md](../product/mvp.md).

> **Estado: concluída.** A migração `20261015120000_fase2_experiencias.sql` foi **aplicada no projeto Supabase real pelo usuário**, e criar, listar, editar e excluir desejos foram **validados por ele no aplicativo**. Os ajustes posteriores (criar já com local e observações, `*` só no obrigatório, campo de observações e pop-up de confirmação) foram feitos depois e aprovados por ele; a verificação visual deles no aparelho não foi repetida por mim. Aplicada em: 2026-10-15 (informado pelo usuário).

## O que foi implementado

**Banco** (`supabase/migrations/20261015120000_fase2_experiencias.sql`)
- Tabela `experiencias`: `id`, `laco_id` (preenchido pelo servidor com o Laço de quem grava), `titulo` (1 a 120), `estado` (`desejo`, `planejamento`, `vivendo`, `memoria`; nasce `desejo`), `local` (até 120), `observacoes` (até 2000), `criado_em`, `atualizado_em`.
- RLS: os dois membros do Laço leem, criam, editam e excluem (mesmas permissões, ADR 003). O cliente só escreve `titulo`, `local` e `observacoes`: não escolhe o Laço nem o estado, e não altera datas.
- **Fora de propósito:** referência temporal e `armado_em` (Fase 3), registros e fotos, transições de estado (serão validadas no servidor quando existirem).

**Aplicativo**
- `src/services/experiencias.ts`: listar, criar, atualizar e excluir desejos. Falha de rede, título inválido e "já excluído" têm mensagens próprias; nada é mostrado como salvo sem confirmação do servidor.
- `src/hooks/use-experiencias.tsx`: deixou de guardar em memória; lê e grava no servidor, junta cargas simultâneas e separa os dados por Laço.
- **Desejos:** lista do servidor (título e local), estados de carregando, erro com "Tentar de novo" e vazio; reabre os dados ao voltar para a aba, para ver o que a outra pessoa mudou. Sem tempo real.
- **`+` / Criar:** igual (só o título), agora gravando no servidor, com botão que impede envio duplicado e mensagem se falhar.
- **Desejo** (`src/app/desejo/[id].tsx`): editar título, local e observações; excluir com confirmação na tela ("definitiva e vale para os dois"); se a outra pessoa já excluiu, volta para a lista.
- **Início:** o atalho de Desejos mostra a contagem.
- `Button` ganhou a variante `destructive` (rótulo em ferrugem, só dentro da confirmação de exclusão).

## Validação

Última rodada completa: 2026-10-15.

| Verificação | Resultado |
|---|---|
| `npm test` (app) | **9 arquivos, 83 testes passando** (ver abaixo) |
| `supabase/tests/experiencias.mjs` (Supabase local) | passou: ver abaixo |
| `integracao.mjs`, `sessao-app.mjs` (Supabase local) | passaram |
| `supabase db reset` (local) | as duas migrações aplicam do zero, em ordem, sem erro |
| `npx tsc --noEmit`, `npx expo lint` | saída 0, sem avisos |
| `npx expo export` (Android e iOS) | saída 0 |

**Testes do app desta fase** (`app/src/__tests__/`)
- `desejos-test.tsx` (telas e navegação): lista com título e local, vazio, erro com "Tentar de novo"; criar com título, local e observações; título vazio; falha ao salvar sem dizer que salvou; abrir e editar; excluir pelo pop-up (abrir, cancelar, confirmar, falhar); a outra pessoa já excluiu.
- `servico-experiencias-test.ts` (serviço, 12): o que é enviado (título aparado, vazio vira nulo, sem Laço nem estado), só estado `desejo` ao editar e excluir, ordem da lista, falha de rede, exceção, erro do servidor sem detalhes, violação de limite.
- `hook-experiencias-test.tsx` (estado, 8): carga e erro, chamadas simultâneas viram uma, criar/editar/excluir só com confirmação do servidor, desejo excluído pela outra pessoa sai da lista, não mostra dados de outra conta, sem Laço não consulta.
- `componentes-test.tsx` (componentes, 14): `*` e "obrigatório" no leitor de tela, nenhuma palavra "opcional", estilo do campo somado ao padrão (a regressão da caixa de observações), limites de tamanho, pop-up (fechado, aberto, confirmar, cancelar, botão voltar, ocupado, erro).
- `sair-test.tsx`: sair da conta pelo pop-up.

**Testes de integração** (`supabase/tests/experiencias.mjs`, Supabase local): criar só com título e já com local e observações; título em branco e acima do limite recusados; estado e Laço não escolhidos pelo cliente; sem Laço e sem sessão não criam nem leem; o outro membro lê, edita e exclui; outro Laço não vê, não edita e não exclui; `atualizado_em` acompanha a edição; a lista só traz desejos, do mais novo para o mais antigo; uma experiência em outro estado (criada pelo banco) não é tocada pelas rotas de desejo.

**Não validado por mim:** o aparelho (o visual dos ajustes recentes e a rolagem com o teclado aberto); o comportamento da lista quando o servidor demora.

## Ajustes depois da validação no aparelho (2026-10-15)
- **Criar com os campos:** a tela do `+` agora traz título, local e observações; salvar já grava tudo.
- **Obrigatório com `*`, o resto fica subentendido:** nos formulários de desejo o título leva `*` (e "obrigatório" para leitores de tela); sumiram "(opcional)" e as frases que repetiam "só o título é obrigatório". Nos passos de entrada (nome, e-mail, senha, código), onde tudo é necessário, não há asterisco.
- **Caixa de observações:** o `TextField` perdia o estilo padrão quando recebia `style`; passou a somar o estilo ao padrão e ganhou altura própria para texto longo.
- **Confirmações em pop-up:** `src/components/confirmacao.tsx` é o padrão para ações que pedem confirmação (hoje: excluir desejo e sair da conta). Escurece o fundo, diz que a ação é definitiva, tem botões grandes (confirmar em cima, cancelar embaixo), fecha com o botão voltar do Android e mostra erro sem fechar. **Toda nova confirmação deve usá-lo.**

## Pendências e decisões
- **Referência temporal do desejo:** Fase 3, como combinado.
- **Remoção de arquivos ao excluir** ([ADR 020](../decisions/020-photos-and-deletion.md)): só passa a existir com as fotos (Fase 4); hoje excluir apaga apenas a linha.
- **Tempo real:** não há; a outra pessoa só vê a mudança ao reabrir a aba. Reavaliar se atrapalhar.
- **`+` com "Um desejo / Uma memória":** mantido como está até a Fase 5.
