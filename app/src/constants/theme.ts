/**
 * Tokens visuais do Laço. Fonte única de cor, espaçamento e fontes.
 * Os valores de cor são a primeira versão implementada da paleta, sujeitos à validação visual.
 * Direção e papéis: docs/ux/proposal/ (ADR 026).
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
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
    destructive: '#A3361C', // rótulo de ação irreversível, só dentro de confirmação
    focus: '#2B2724', // anel de foco visível
  },
  // Legado do template, sem alteração e sem uso no MVP (tema só claro, sem seguir o tema do sistema).
  // Será redefinido quando houver tema escuro; nada o lê hoje.
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

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
