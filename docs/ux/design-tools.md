# Avaliação das ferramentas de design

Investigação das opções citadas em [design-direction.md](./design-direction.md). **Nada foi instalado.** A hierarquia de decisão continua valendo: ferramentas não sobrescrevem decisões do Laço.

## Como a verificação foi feita (e seus limites)

- `frontend-design`: li localmente os arquivos do plugin no marketplace oficial já configurado (`SKILL.md`, `plugin.json`).
- As outras três: consultei as páginas públicas dos projetos e buscas na web. **Não inspecionei o código-fonte** nem executei nada. Os resumos vieram de leitura automática das páginas.
- Há **divergências entre fontes** (número de estrelas do UI/UX Pro Max; comando e escopo da skill do Emil). Quando não deu para verificar, está marcado.

## Comparação

| | `frontend-design` | UI/UX Pro Max | Impeccable | Motion (Emil Kowalski) |
|---|---|---|---|---|
| **Origem** | **Oficial**, Anthropic, no marketplace `claude-plugins-official` | **Terceiros**: `nextlevelbuilder/ui-ux-pro-max-skill`, licença MIT | **Terceiros**: Paul Bakaus, Apache 2.0, construído sobre o `frontend-design` | **Terceiros**: Emil Kowalski, MIT, repositório `emilkowalski/skills` |
| **O que é** | Uma skill só de texto (sem scripts): direção estética, tipografia, restrição, processo "plano → revisão contra o brief → construção", lista de clichês a evitar | Skill + CLI com catálogo pesquisável (paletas, fontes, estilos, regras por tipo de produto) e geração de design system | Skill com ~24 comandos (audit, critique, polish, animate…), referências de tipografia/cor/motion/UX writing e CLI de detecção estática | Coleção de skills de princípios de animação (easing, durações, springs, revisão de animações, glossário de movimento) |
| **Instalação** | Plugin do marketplace; **não instalado** | Plugin do marketplace ou `npm i -g ui-ux-pro-max-cli`; **não instalado** | Plugin do marketplace ou `npx impeccable install`; **não instalado** | `npx skills add …`; comando **divergente** entre a página do autor (`skill`) e o GitHub (`skills`): **não verificado**; não instalado |
| **O que roda** | Nada além de texto | Scripts Python locais; o README diz que usam só a biblioteca padrão e não acessam a rede (**não verificado**) | Binário próprio e **hooks que rodam a cada edição de arquivo** | Prompts de texto |
| **Adequação a React Native + Expo** | Princípios servem; o texto é orientado a web (hero, CSS) | Declara React Native entre os frameworks; Expo não é citado | **Voltado a web**; sem suporte a mobile citado | O GitHub diz cobrir web e React Native/Expo; a página do autor diz web/CSS: **contraditório** |
| **Valor para esta etapa** | Alto e barato: evita o visual genérico e dá o processo de proposta | Baixo: já temos uma direção forte; catálogos tendem a paletas genéricas | Baixo agora; útil depois, para auditar telas prontas | Útil só ao projetar a implementação do motion |
| **Riscos** | Mínimos | Escopo do catálogo, CLI global, procedência só por páginas públicas | Maior superfície de confiança (hooks + binário); foco web | Instalador de terceiros (`skills`); conteúdo a revisar |
| **Sobreposição** | Base das demais | Com `frontend-design` (direção) | Com `frontend-design` (é uma extensão dele) | Com o Impeccable (`animate`) |

Também instalado no ambiente: o plugin `ponytail`, que cobre a regra de simplicidade e não se sobrepõe a design.

## Recomendação: conjunto mínimo

1. **Para produzir a proposta: nenhuma instalação foi necessária.** Apliquei o processo do `frontend-design` lendo o arquivo local: plano de tokens, revisão contra o brief e contra os clichês (creme + serifa + terracota, cartões SaaS, rótulos em caixa-alta).
2. **Recomendação atual: não instalar outra ferramenta agora**, pois o material local do `frontend-design` já foi usado. Se mais adiante quiser uma ferramenta instalada, a candidata é só o `frontend-design` (oficial, sem scripts, risco mínimo).
3. **UI/UX Pro Max e Impeccable: não instalar por ora.** Sobrepõem o `frontend-design`, são orientados a web e o segundo instala hooks e binário. Reavaliar o Impeccable **depois** que existirem telas, em um ramo de teste, apenas para auditoria.
4. **Motion:** quando chegar a implementação das animações, **ler** o repositório do Emil e extrair os princípios que servirem (já resumidos em [proposal/motion-and-accessibility.md](./proposal/motion-and-accessibility.md)); instalar só se agregar algo concreto para React Native.

## Depende da sua autorização

- Instalar o `frontend-design` (opcional; recomendação atual: não instalar agora).
- Instalar qualquer terceiro (não recomendado agora). Antes, eu revisaria o conteúdo do repositório e as permissões que ele pede.

## Fontes consultadas

- Marketplace oficial local: `plugins/frontend-design` (`SKILL.md`, `plugin.json`).
- [github.com/nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [github.com/pbakaus/impeccable](https://github.com/pbakaus/impeccable)
- [emilkowal.ski/skill](https://emilkowal.ski/skill) e [github.com/emilkowalski/skill](https://github.com/emilkowalski/skill)
- Documentação do Expo SDK 57: [Expo UI](https://docs.expo.dev/versions/v57.0.0/sdk/ui/), [GlassEffect](https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/), [SVG](https://docs.expo.dev/versions/v57.0.0/sdk/svg/), [Font](https://docs.expo.dev/versions/v57.0.0/sdk/font/).
