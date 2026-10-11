# Navegação e Início

Regras de produto: [../product/navigation.md](../product/navigation.md), [ADR 007](../decisions/007-navigation.md), [014](../decisions/014-home-and-location.md), [022](../decisions/022-entry-flow-and-solo-use.md). Pendências: [open-questions-ux.md](./open-questions-ux.md).

## Navegação principal

Três áreas: **Início**, **Desejos**, **Nossa História**, mais uma **ação central de criação** `+`. Ordem conceitual: Início · Desejos · `+` · Nossa História.

Não criar abas separadas para Planejamento, Vivendo ou Memória: são estados/contextos de uma experiência.

> Os estados pertencem à experiência. As áreas pertencem à navegação.

**Implementação:** a barra de navegação é decisão técnica. Se o `NativeTabs` do template não permitir a composição desejada, escolher a solução técnica **mais simples** que preserve a experiência. **Não transformar uma limitação da API em mudança de produto** sem antes apresentar a alternativa ([technical-decisions.md](../architecture/technical-decisions.md#a-validar-na-implementação)).

### Configurações da conta

Não é uma área principal. É uma tela/área secundária acessível pela interface de conta/perfil, simples, com pelo menos **editar o próprio nome** e **sair da conta**. Fora do MVP: sair do Laço, desvincular parceiro, múltiplos Laços, troca de parceiro. O ponto de entrada visual é decisão de design (UX-V9).

## O botão `+`

Abre:

> **O que vamos guardar hoje?**

- **Um desejo** — Algo que queremos viver.
- **Uma memória** — Algo que já vivemos.

Não oferecer criação direta de Planejamento nem de Vivendo; esses estados são alcançados a partir de uma experiência.

## Início

Não parece um dashboard. Responde:

> O que está acontecendo conosco agora e o que vem depois?

No topo, o casal: **[Nome da pessoa 1] & [Nome da pessoa 2]** (ex.: "Riquelme & Bianca"). Sem saudação individual como "Boa noite, Riquelme".

**Laço com uma pessoa só.** Quem criou o Laço usa o aplicativo normalmente (cria Desejos, Planejamentos e Memórias, navega). A interface deixa claro que a segunda pessoa **ainda não foi vinculada** e o cabeçalho **não finge dois membros ativos**. Depois que ela entra, a experiência passa a representar o casal. *O Laço começa com uma pessoa, mas é concebido para duas.*

### Hierarquia

Ordem conceitual, **sem ranking complexo nem pontuação de relevância**:

1. experiências em **Vivendo** (pode haver mais de uma; não limitar a uma só);
2. próxima experiência com referência temporal futura;
3. experiências em Planejamento sem referência temporal suficiente;
4. acesso rápido aos Desejos.

A quantidade exibida é definida de forma simples pelo design, priorizando legibilidade; havendo muitos itens, existe acesso para ver os demais no contexto apropriado (UX-V10).

**Vivendo agora.**

> **Vivendo agora** · **Fim de semana em Campos do Jordão** · 12–14 de outubro · 📍 Campos do Jordão · **Continuar experiência →**

**Próxima experiência.**

> **Nosso próximo momento** · **Jantar naquele restaurante que salvamos** · 18 de outubro · 20:00 · 📍 São Paulo · **Ver planejamento →**

**Planejamentos.** Sem virar lista extensa ou dashboard.

> **Estamos preparando** · Teatro · Acampamento · Restaurante japonês · **Ver planejamentos**

**Desejos.** Apenas acesso; a contagem representa só experiências ainda em Desejo.

> **Coisas que queremos viver** · 12 desejos · **Ver nossos desejos →**

### Início de um Laço recém-criado

A celebração da criação acontece **uma vez**, na conclusão do onboarding ([onboarding.md](./onboarding.md#4-conclusão-da-criação)). Ao entrar em Início, a interface assume o estado normal; **não repetir** "O Laço de vocês está pronto" como segunda tela de celebração.

Sem experiências, o Início não parece vazio nem quebrado: um **estado vazio contextual** (ex.: convite para criar o primeiro desejo), sem estatísticas, métricas ou conteúdo artificial.
