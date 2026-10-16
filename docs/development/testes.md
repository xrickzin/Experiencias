# Testes

Como verificar o Laço sem depender de aparelho, e o que cada camada cobre. Nenhum destes testes substitui abrir o app num aparelho de verdade.

## 1. Testes do aplicativo (Jest)

Rodar a partir de `app/`:

```sh
npm test
```

- **Ferramentas:** `jest-expo` (preset do Expo), `@testing-library/react-native` e o `renderRouter` do Expo Router, que monta **as rotas reais de `src/app`** em memória. Configuração em `app/package.json` (`jest`) e `"types": ["jest"]` em `app/tsconfig.json` (o TypeScript 6 não inclui mais tipos globais sozinho).
- **Onde ficam:** `app/src/__tests__/`, com nomes `*-test.ts(x)`. Nunca dentro de `src/app/` (lá todo arquivo vira rota).
- **O que é simulado:** a sessão (`apoio/sessao-falsa.ts` substitui `@/hooks/use-sessao`; o teste muda o estado e as telas reagem), os serviços de `@/services/laco` (cada teste define as respostas) e as fontes. O Supabase não é chamado.
- **Cobertura atual:**
  - `navegacao-test.tsx`: para onde a pessoa vai em cada estado de sessão, inclusive a regressão em que a tela de redefinir senha virava o destino padrão (o teste falha com a ordem antiga das rotas; conferido).
  - `fluxos-test.tsx`: criar Laço do começo ao Início (com o código mostrado uma vez), código em uso, senhas diferentes; entrar como pessoa nova e com e-mail já cadastrado, código errado e senha errada; recuperação de senha (pedido, link expirado, link válido até a nova senha, código recusado).
  - `regras-test.ts`: leitura do link de recuperação e validações de formulário.
  - `sair-test.tsx`: Início, Ajustes, pop-up de saída até a entrada; cancelar mantém em Ajustes.
  - `desejos-test.tsx`: lista, criar (com local e observações), editar e excluir pelo pop-up, falhas e conflito com a outra pessoa.
  - `servico-experiencias-test.ts`: o serviço de desejos contra um cliente do Supabase simulado.
  - `hook-experiencias-test.tsx`: estado dos desejos (carga única, só o confirmado entra na lista, isolamento por conta).
  - `componentes-test.tsx`: campo de texto (`*`, estilo), campos do desejo e o pop-up de confirmação.
  - `saida-servico-test.ts`: plano B da saída da conta.
  - `referencia-test.ts`: referência temporal (máscaras, leitura, textos) e organização do Início.
  - `planejamento-test.tsx`: transições de estado, "Quando" na tela, blocos do Início e listas completas.
  - `fotos-servico-test.ts`: serviço de fotos (ordem arquivo/registro, limpeza, exclusão).
  - `fotos-tela-test.tsx`: fotos na experiência (abas, câmera, galeria, permissões, exclusão).
  - `agrupar-fotos-test.ts`: fotos por dia e período no horário de Brasília e data de captura do EXIF.
- **Limites:** não exercitam teclado, área segura, aparência, armazenamento seguro, links de verdade nem o servidor.
- **Total hoje:** 14 arquivos, 192 testes.
- **Módulos nativos nos testes:** `app/__mocks__/expo-image.tsx` troca a imagem nativa por uma `View`; `expo-image-picker` é simulado em cada teste que o usa.
- **Detalhes do SDK 57:** o `renderRouter` devolve a promessa do `render` com `getPathname` nela (`apoio/abrir.ts` cuida disso), liga temporizadores falsos (avançados em `esperar()`) e não traz tipos para `toHavePathname`; os testes usam `expect(tela.getPathname())`.

## 2. Banco em Postgres local (PGlite)

`supabase/tests/vinculo.mjs`: aplica a migração num Postgres real em memória, com um ambiente que imita o Supabase, e testa vínculo, RLS e bloqueio de tentativas. Instruções no cabeçalho do arquivo.

## 3. Supabase local (Docker)

Uma cópia completa do Supabase na máquina (banco, Auth, API e uma caixa de e-mail falsa, o Mailpit), isolada do projeto real. Permite testar cadastro, vínculo e a recuperação de senha de ponta a ponta, lendo o e-mail no Mailpit.

**Pré-requisito:** Docker Desktop instalado e aberto (no Windows, com WSL 2). Sem ele, o comando abaixo para com "docker: command not found".

A partir da raiz do repositório (onde está `supabase/`), com a versão fixada:

```sh
npx supabase@2.119.0 start     # sobe tudo e aplica supabase/migrations/
npx supabase@2.119.0 status    # endereços e chaves locais
npx supabase@2.119.0 stop      # desliga
```

- A configuração local está em `supabase/config.toml` (confirmação de e-mail desligada, senha mínima de 8, destinos de redirecionamento `laco://**` e `exp://**`).
- As chaves mostradas por `status` são **locais e públicas por desenho**; não são as do projeto real e não devem ir para o `app/.env.local` usado com o projeto real.
- Para o app no celular falar com o Supabase local, a URL precisa ser o IP da máquina na rede (por exemplo `http://192.168.0.10:54321`), não `localhost`.
- O Mailpit fica em `http://127.0.0.1:54324`.

**Testes de integração** (com o Supabase local ligado), a partir da raiz:

```sh
node supabase/tests/integracao.mjs
```

Usa o `supabase-js` do app contra a API local: cadastro (sessão sem confirmação, senha curta recusada), criar Laço, código em uso, `verificar_email`, vínculo, terceira pessoa, RLS (leitura do próprio Laço, sem HMAC nem configuração, edição só do próprio nome), recuperação de senha de ponta a ponta (pedido, e-mail no Mailpit, redirecionamento para `laco://redefinir-senha`, troca do código, link em outro aparelho, nova senha, senha antiga recusada, Laço preservado, código de uso único), leitura do IP nas funções e bloqueio após 5 erros. Cria contas com e-mails `@exemplo.test` e limpa o contador de tentativas; recusa rodar se a URL não for local.

`supabase/tests/destaque.mjs` cobre a foto de destaque (só foto da mesma experiência, isolamento entre Laços, ponteiro limpo ao excluir a foto). `supabase/tests/fotos.mjs` cobre a Fase 4 (registros, bucket privado, URL assinada, isolamento e exclusão na ordem do ADR 020). `supabase/tests/planejamento.mjs` cobre a Fase 3 (referência temporal, instante de início no fuso do Laço, `armado_em` e transições). `supabase/tests/experiencias.mjs` cobre a Fase 2 (desejos, RLS entre Laços, colunas protegidas, limites, ordem da lista e experiências em outros estados); `supabase/tests/sessao-app.mjs` confere o armazenamento da sessão do jeito do app.

**Primeira execução (2026-10-15):** a migração foi aplicada sem erro no Postgres 17 do Supabase local e os 39 testes passaram. Achado: o redirecionamento do e-mail de recuperação **não** traz `sb_flow_id`, então um segundo pedido no mesmo aparelho substitui o verificador e o link do primeiro e-mail deixa de valer (cai em "link inválido"); a tela de confirmação passou a avisar para usar só o e-mail mais recente.
