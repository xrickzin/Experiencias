/**
 * Tokens visuais do Laço. Fonte única de cor, espaçamento e fontes.
 * Os valores de cor são a primeira versão implementada da paleta, sujeitos à validação visual.
 * Direção e papéis: docs/ux/proposal/ (ADR 026).
 */

import { Platform } from 'react-native';

const claro = {
  // Base neutra quente ("papel de álbum").
  text: '#2B2724', // texto, botão primário e anel de foco
  background: '#FAF6EE', // fundo das telas
  backgroundElement: '#F2ECE0', // superfícies, campos, folhas
  backgroundSelected: '#E8E0D1', // item selecionado ou pressionado
  textSecondary: '#6A6258', // texto secundário
  border: '#D9CFBD', // filetes decorativos
  outline: '#8A806F', // borda de campos e controles

  // Identidade: o fio e o laço. Nunca é cor de erro, de ação destrutiva nem de botão.
  accent: '#B3242B',
  accentStrong: '#8E1A21', // fio pressionado, texto vermelho pequeno
  accentSoft: '#D38283', // fio decorativo; nunca carrega informação

  // Semântica. Nunca comunicar estas cores apenas pela cor: sempre ícone e mensagem de texto.
  warning: '#8A5410', // aviso: atenção que não é falha
  error: '#A3361C', // erro: falhas de validação ou de operação
  destructive: '#A3361C', // ação irreversível: texto do botão pastel e fundo do botão de confirmação
  destructiveSoft: '#F6E0DA', // fundo pastel do botão que inicia uma ação irreversível (ADR 036)
  focus: '#2B2724', // anel de foco visível

  // Sobreposições: escurecer atrás de janelas e mostrar fotos em tela cheia.
  scrim: 'rgba(43, 39, 36, 0.55)', // atrás de confirmações e folhas
  photoBackdrop: '#2B2724', // fundo da foto em tela cheia (escuro nos dois temas)
  onPhoto: '#FAF6EE', // ícones sobre a foto em tela cheia
};

/**
 * "Noite quente" (visual-direction.md, ADR 037): os mesmos papéis do claro, em neutros quentes
 * escuros. Contraste calculado: texto 15,2:1, secundário 6,1 a 7,9:1, fio 5,3:1, erro 7,1:1.
 */
const escuro: Record<keyof typeof claro, string> = {
  text: '#F3EDE2',
  background: '#1B1815',
  backgroundElement: '#26221E',
  backgroundSelected: '#322D28',
  textSecondary: '#B5ACA0',
  border: '#3D3731',
  outline: '#7F766B',

  accent: '#E5636A',
  accentStrong: '#F0898E',
  accentSoft: '#944548',

  warning: '#E3A24F',
  error: '#EE8A68',
  destructive: '#EE8A68',
  destructiveSoft: '#3A2420', // texto destrutivo sobre ele: 5,8:1
  focus: '#F3EDE2',

  scrim: 'rgba(0, 0, 0, 0.6)',
  photoBackdrop: '#12100E',
  onPhoto: '#F3EDE2',
};

export const Colors = { light: claro, dark: escuro };

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

/**
 * Famílias das fontes do Laço (ADR 026). No SDK 57 cada peso é uma família própria
 * (o mapeamento de pesos dentro de uma família só existe a partir do SDK 58), então
 * estes nomes são usados no lugar de `fontWeight`. Os arquivos são carregados em
 * `src/app/_layout.tsx`, a partir de `assets/fonts/`.
 */
export const FontFamily = {
  display: 'Fraunces-SemiBold', // títulos e momentos editoriais ou afetivos
  body: 'Figtree-Medium', // texto corrido, formulários, navegação
  bodyStrong: 'Figtree-SemiBold', // ênfase na interface
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Raios com função: fotos, campos e botões. Superfícies e listas editoriais ficam retas. */
export const Radius = {
  photo: 4,
  field: 10,
  button: 14,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
