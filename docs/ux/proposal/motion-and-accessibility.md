# Proposta de motion, estados e acessibilidade

> **PROPOSTA, não aprovada.** Complementa [visual-direction.md](./visual-direction.md).

## 1. Motion

> **Movimento deve comunicar mudança, relação ou continuidade.** Sem animação decorativa, constante ou em todo botão.

| Momento | Propósito | Duração | O que acontece |
|---|---|---|---|
| Começar planejamento | o mesmo desejo evolui | 400 ms | o fio faz uma pequena laçada (280 ms) enquanto o conteúdo se reorganiza (200 ms, sobrepostos); depois o texto "Vamos começar a dar forma a isso." |
| Conclusão da criação do Laço | marco, uma única vez | até 800 ms | o fio se encontra e forma o laço; aparece o código do casal |
| Segunda pessoa entra | marco | 400 ms | laçada curta e a confirmação |
| Finalizar experiência | irreversível, ganha peso | 500 ms | o fio fecha um laço sobre o título; "Essa experiência virou uma memória." |
| Novo desejo na lista | continuidade | 200 ms | entra com leve deslocamento de 8 pt e opacidade |
| Abrir/fechar folha | relação com a origem | 250 ms | sobe da borda inferior (padrão do sistema) |
| Pressionar | feedback | 100 ms | opacidade 0,7; sem escala |
| Carregamento longo | espera | só após 400 ms | filete que se traça no topo |

Easing: saída suave (cubic-bezier 0,22 / 1 / 0,36 / 1) para entradas e laçadas; padrão do sistema nas transições de navegação. **Não animar:** botões em geral, listas inteiras ao abrir, parallax, nada em loop.

Tokens de movimento: durações `instant` 100, `short` 200, `medium` 400, `long` 800 (ms) e as duas curvas, em `theme.ts`.

**Tecnologia:** `react-native-reanimated` (já instalado). Desenhar o traço do fio exige SVG (`react-native-svg`, depende de aprovação). Sem SVG, a alternativa é um filete reto animado (largura) e laços estáticos em imagem, com perda de qualidade.

### Movimento reduzido
Quando o sistema pede menos movimento: o fio **não se desenha** (aparece pronto com cross-fade de 150 ms), sem deslocamentos nem laçadas; a mensagem de confirmação continua. O Reanimated oferece uma preferência de movimento reduzido; **validar a API na versão instalada (4.5.1)** antes de implementar.

## 2. Estados

| Estado | Regra | Exemplo de texto |
|---|---|---|
| Carregando | texto com esqueleto discreto; fotos com `placeholder`; filete só após 400 ms | — |
| Vazio | convite, nunca "sem dados"; uma ilustração pequena | "Ainda não há desejos. Que tal começar por um?" |
| Erro | diz o que houve e como seguir, sem pedir desculpas vagas; cor `erro` + ícone | "Não conseguimos salvar agora. Tente de novo." |
| Sem conexão | faixa no topo em `aviso` (âmbar), não é erro do casal; ações que precisam de rede ficam indisponíveis; **nunca** dizer que foi salvo se não foi ([ADR 009](../../decisions/009-mvp-scope-and-offline.md)) | "Sem conexão. Nada foi salvo." |
| Bloqueio por tentativas | aviso claro, temporário ([ADR 016](../../decisions/016-keyword-abuse-protection.md)) | "Muitas tentativas. Aguarde alguns minutos." |
| Desabilitado | 40 % de opacidade e `accessibilityState` | — |

Textos finais são da UX; os exemplos mostram o tom.

## 3. Acessibilidade

- **Contraste:** tabela em [visual-direction.md](./visual-direction.md#contraste-mínimos-texto-45--1-gráficos-e-controles-3--1); a cor nunca é a única informação (erro = `erro` + ícone + texto; aviso = `aviso` + ícone + texto).
- **Alvos de toque:** mínimo de 44 × 44 pt, com espaçamento entre alvos adjacentes.
- **Leitor de tela:** todo ícone e botão com `accessibilityLabel` em português; fio e laço **decorativos**, ocultos ao leitor; fotos anunciadas como "Foto de {título}, {mês e ano}" (descrição escrita pelo casal fica fora do MVP); ordem de leitura = ordem visual; títulos com papel de cabeçalho.
- **Texto:** respeita o tamanho de fonte do sistema (corpo até 200 %; títulos limitados a 130 %); testar com fonte grande.
- **Telas pequenas (320 a 360 pt):** coluna única, margem lateral 24 pt, formulários sobem com o teclado, nenhum texto cortado, rolagem vertical sempre possível.
- **Formulários:** rótulo visível acima do campo (não só *placeholder*), erro ao lado do campo, mostrar/ocultar senha, preenchimento automático de e-mail e senha habilitado, teclado correto por campo.
- **Foco e gestos:** toda ação por gesto tem equivalente por toque; confirmações de finalizar e excluir são botões, não gestos.
- **Tema:** MVP só claro (recomendação, a aprovar); os tokens do escuro seguem os mesmos requisitos de contraste, em tabela própria.
- **Movimento reduzido:** o Reanimated 4 oferece `useReducedMotion`, que lê a preferência **uma vez ao iniciar** (mudar a configuração depois não re-renderiza); decidir se isso basta.
