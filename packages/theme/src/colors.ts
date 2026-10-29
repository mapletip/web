import type { MantineColorsTuple } from '@mantine/core';

/**
 * Maple Twilight's single source of colour values.
 *
 * Palettes are exposed to Mantine through `createTheme`; semantic roles refer to
 * the palette entries so no scheme-specific hex is repeated in CSS or stories.
 */

/** Warm mushroom-orange brand ramp. Primary shade: light 7, dark 4. */
export const maple = [
  '#FFF7EC',
  '#FDE8CE',
  '#FAD4A9',
  '#F5BB7B',
  '#F0A456',
  '#E78A37',
  '#C66B21',
  '#A34D16',
  '#7E3911',
  '#57270F',
] as const satisfies MantineColorsTuple;

/**
 * Twilight (dark scheme) neutrals. Mantine derives dark-scheme surfaces and text
 * from these indices: 0 text, 2 dimmed, 4 control border, 5 raised,
 * 6 panel, 7 canvas.
 */
export const twilight = [
  '#F4F1EA',
  '#DDE3E8',
  '#BCC5CD',
  '#9AA6B1',
  '#7A8793',
  '#202830',
  '#171D22',
  '#0F1317',
  '#0B0E12',
  '#07090C',
] as const satisfies MantineColorsTuple;

/**
 * Parchment (light scheme) neutrals. Mantine derives light-scheme states from
 * these indices: 0 raised/hover, 3 subtle border, 4 control border, 6 dimmed,
 * 9 text.
 */
export const parchment = [
  '#F2E9DD',
  '#EBE0D1',
  '#E4D8C8',
  '#D5C9B9',
  '#79746D',
  '#6B665F',
  '#4F5A63',
  '#3C464E',
  '#2C343A',
  '#22272B',
] as const satisfies MantineColorsTuple;

/** Foreground-on-neutral-surface accents for explicit domain/status context. */
export interface AccentColors {
  readonly forest: string;
  readonly sky: string;
  readonly grape: string;
  readonly gold: string;
  readonly danger: string;
}

/** Semantic roles for one colour scheme. */
export interface SchemeColors {
  readonly canvas: string;
  readonly panel: string;
  readonly raised: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  /** Decorative separators only; never a required control boundary. */
  readonly borderSubtle: string;
  /** Essential control boundary; meets 3:1 against every surface. */
  readonly borderControl: string;
  readonly link: string;
  readonly focus: string;
  /** Label for filled primary actions. */
  readonly filledActionText: string;
  readonly accents: AccentColors;
}

/** Maple Twilight surfaces, text and interaction colours. */
export const twilightScheme: SchemeColors = {
  canvas: twilight[7],
  panel: twilight[6],
  raised: twilight[5],
  textPrimary: twilight[0],
  textSecondary: twilight[2],
  borderSubtle: '#39444F',
  borderControl: twilight[4],
  link: '#F5BB7B',
  focus: '#89C9F5',
  filledActionText: '#20140B',
  accents: {
    forest: '#9BD8B0',
    sky: '#94CFFF',
    grape: '#CDB7FA',
    gold: '#FFD182',
    danger: '#FFB4AD',
  },
};

/** Parchment surfaces, text and interaction colours. */
export const parchmentScheme: SchemeColors = {
  canvas: '#FAF6EF',
  panel: '#FFFDFC',
  raised: parchment[0],
  textPrimary: parchment[9],
  textSecondary: parchment[6],
  borderSubtle: parchment[3],
  borderControl: parchment[4],
  link: '#8A3E0C',
  focus: '#215D9C',
  filledActionText: '#FFFFFF',
  accents: {
    forest: '#216B43',
    sky: '#205F92',
    grape: '#694197',
    gold: '#7B4B0C',
    danger: '#A52E2B',
  },
};
