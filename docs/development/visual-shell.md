# Casca visual integrada

Registro do que foi implementado na primeira entrega visual (depois da Fase 0 técnica) e do que continua pendente. Direção: [ux/proposal/](../ux/proposal/visual-direction.md), [ux/home-and-navigation.md](../ux/home-and-navigation.md). **Sem validação em Expo Go nem em aparelho.**

## Navegação
- **Decisão técnica:** abas JS do Expo Router (`expo-router/js-tabs`), em vez do `NativeTabs` do template, que não hospeda um botão de ação central. Sem dependência nova. Resolve a premissa "barra de navegação com `+` central" de [technical-decisions.md](../architecture/technical-decisions.md#a-validar-na-implementação).
- **Destinos:** `src/app/(tabs)/` com `index` (Início), `desejos`, `nossa-historia` e `novo` (sem conteúdo: só reserva o lugar do `+`, que abre `/criar`); `src/app/criar.tsx` é uma tela modal na pilha raiz, fora das abas. Sem aba para Planejamento nem Vivendo.
- **Aba ativa:** rótulo em grafite mais um fio vermelho curto acima dele; não depende só da cor do texto. O `+` é um círculo grafite (o vermelho não preenche botões). **Correção do recorte no Android:** a altura padrão da barra (49 pt) era menor que o círculo de 52 pt e a barra recortava o excesso; agora a barra tem 64 pt de conteúdo mais a área segura inferior (`useSafeAreaInsets`) e o círculo tem 48 pt. Falta confirmar no Expo Go.
- O tema de navegação passa a usar os tokens do Laço (corrige o fundo cinza do `DefaultTheme`).

## Telas
> Depois desta entrega, a navegação passou a depender da sessão (entrada, abas, Ajustes): ver [phase-1-log.md](./phase-1-log.md).

- **Início:** apresentação, bloco "O que vocês querem viver?" com a ação "Criar uma experiência" e dois atalhos (Desejos e Nossa História). Sem nomes do casal, contagens nem dados, porque não há conta ainda.
- **Desejos:** estado vazio com chamada para o primeiro desejo; com desejos criados na sessão, lista editorial só de títulos.
- **Nossa História:** estado vazio, sem memórias fictícias.
- **Criar:** campo de título com validação (vazio, só espaços), cancelar, erro com ícone, texto e borda mais grossa, e envio que cria um **desejo** só com o título e leva a Desejos.

## Estado local temporário
`src/hooks/use-experiencias.tsx` guarda os desejos em memória, apenas enquanto o app está aberto. Não há persistência, Supabase nem simulação disso; a tela de Desejos avisa o usuário. Será trocado pela persistência quando o fluxo de experiências existir.

## Componentes novos (`src/components/`)
`screen`, `screen-header` (com o fio), `button` (primário e secundário), `text-field`, `empty-state`. `Radius` (campo e botão) entrou em `theme.ts`. Removido: `app-tabs.tsx` (abas do template, conflitava com a nova navegação); `src/app/index.tsx` foi movido para `(tabs)/`.

## Desvios e pendências
- O `+` abre direto a criação de um **desejo**, sem a escolha "Um desejo / Uma memória" prevista em [home-and-navigation.md](../ux/home-and-navigation.md). Memória precisa de campos que esta entrega não cobre.
- Sem ícones: as abas usam texto e o fio. Ícones próprios e a `react-native-svg` seguem condicionais.
- Início sem os nomes do casal e sem Vivendo/Próximas/Planejamentos, que dependem de dados e conta.
- Não validado: aparência, teclado, áreas seguras, tamanhos de tela e o comportamento do modal no Android e no iOS. Os tipos de rotas gerados pelo Expo Router não foram gerados na checagem de tipos.
- `ThemedView`, `BottomTabInset` e os assets `assets/images/tabIcons/` ficaram sem uso e foram mantidos.
- Movimento (fio, laço, transições) e movimento reduzido: não implementados.

## Barra de navegação do Android
- **Problema:** no Xiaomi, os botões do sistema (voltar, início, recentes) ficavam sobre uma faixa branca. No SDK 57 o edge-to-edge é sempre ativo e a barra do sistema é transparente; a faixa vem da proteção de contraste do Android (`enforceNavigationBarContrast`, ligada por padrão), que põe um véu claro atrás dos botões. Causa por inferência a partir da documentação e do código do pacote, sem ver o aparelho.
- **Solução:** `expo-navigation-bar` (instalado com `npx expo install`, ~57.0.3; único pacote novo) como plugin em `app.json` com `enforceContrast: false` e `style: "dark"` (botões escuros sobre fundo claro; no plugin `dark` gera `windowLightNavigationBar=true`). Com o véu desligado, a região por trás dos botões mostra a própria barra de abas, que já é marfim e tem o padding da área segura inferior.
- **Limite:** o `enforceContrast` só existe como opção do plugin (recurso nativo gerado na compilação); não há API em tempo de execução. **No Expo Go não muda**: exige um build de desenvolvimento ou de produção (`expo run:android` ou `eas build`). A introspecção da configuração mostra os três recursos gerados (`enforceNavigationBarContrast=false`, `windowLightNavigationBar=true` e `navigationBarColor` transparente), mas não foi compilado nem visto em aparelho.
- O edge-to-edge foi mantido e os controles continuam visíveis.
