# 037 — Modo escuro

**Status:** Aceita (pedido do usuário, 2026-10-16). Revê o "só tema claro no MVP" do [026](./026-visual-direction-and-platforms.md) e da pendência R4 de [open-questions-ux.md](../ux/open-questions-ux.md).

## Decisão
- **Em Ajustes → Aparência**, cada pessoa escolhe **Automático** (padrão: segue o tema do celular), **Claro** ou **Escuro**. A escolha vale só para o aparelho (guardada nele) e é aplicada já na abertura, sem piscar no outro tema.
- Paleta escura **"noite quente"**, a proposta em [visual-direction.md](../ux/proposal/visual-direction.md#modo-escuro-noite-quente), completada com os papéis novos: `destructiveSoft` #3A2420, `accentStrong` #F0898E, `scrim`, `photoBackdrop` e `onPhoto`. Contrastes calculados: texto 15,2:1, texto secundário 6,1 a 7,9:1, fio 5,3:1, erro e destrutivo 7,1:1, botão pastel de excluir 5,8:1.
- As cores fixas no código (escurecimento atrás das janelas e fundo da foto em tela cheia) viraram tokens.
- Barra de status e barra de navegação do Android acompanham o tema; as janelas (`Modal`) desenham por baixo da barra de navegação, para ela escurecer junto.

## Consequências
- Telas novas usam só `useTheme()`: cor fixa no código quebra um dos dois temas.
- Conferido no aparelho do usuário (Android, modo escuro): Início, Nossa História, memória e confirmação. Ícone e abertura continuam claros até a E9.
