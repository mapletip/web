import type { MantineColorsTuple } from '@mantine/core';

/**
 * MapleTip colour foundation: dark-only Maple Twilight.
 * Single typed source of colour values in @mapletip/theme.
 *
 * Palettes are exposed to Mantine through `createTheme`; semantic roles refer to
 * these token definitions so no hex is repeated in CSS or stories.
 */

/**
 * Neutral scale registered as Mantine's `gray`, used by `color=\"gray\"` controls
 * (for example the subtle "Clear filters" button). Index 4 is the readable
 * control/label tone on the dark canvas.
 */
export const neutral = [
  '#F5F5F6',
  '#F0F0F2',
  '#E8E8EA',
  '#E8E8EA',
  '#ABB0B8',
  '#8E939C',
  '#62636A',
  '#4C4D53',
  '#37373C',
  '#27272A',
] as const satisfies MantineColorsTuple;

/** Clear Signals status colors for semantic feedback. */
export interface StatusColors {
  readonly success: string;
  readonly successBg: string;
  readonly warning: string;
  readonly warningBg: string;
  readonly danger: string;
  readonly dangerBg: string;
  readonly info: string;
  readonly infoBg: string;
}

/** Disabled state colors. */
export interface DisabledColors {
  readonly bg: string;
  readonly fg: string;
}

/** Primary CTA Walnut Glow colors. */
export interface CtaColors {
  readonly background: string;
  readonly foreground: string;
  readonly hover: string;
  readonly border: string;
}

/** Semantic roles for the dark colour scheme. */
export interface SchemeColors {
  readonly canvas: string;
  readonly panel: string;
  readonly raised: string;
  readonly rail: string;
  /** Decorative separators. */
  readonly borderSubtle: string;
  /** Essential control boundary. */
  readonly borderStrong: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly hover: string;
  readonly brand: string;
  readonly brandText: string;
  readonly brandWash: string;
  readonly selection: string;
  readonly selectionEdge: string;
  readonly soft: string;
  readonly focus: string;
  readonly focusGap: string;
  readonly link: string;
  readonly onBrand: string;
  readonly cta: CtaColors;
  readonly statuses: StatusColors;
  readonly disabled: DisabledColors;
}

/**
 * Canonical Maple Twilight dark scheme (Refined).
 * Atmospheric twilight dusk neutrals (#111417 canvas, #1A1D20 panel, #22262B raised)
 * paired with luminous warm amber links/branding (#F0A456) and warm off-white primary text (#F4F1EA).
 */
export const mapleTwilightScheme: SchemeColors = {
  canvas: '#111417',
  panel: '#1A1D20',
  raised: '#22262B',
  rail: '#111417',
  borderSubtle: '#2C3137',
  borderStrong: '#788088',
  textPrimary: '#F4F1EA',
  textSecondary: '#C0C4C8',
  hover: '#22262B',
  brand: '#F0A456',
  brandText: '#F5BB7B',
  brandWash: '#261F1A',
  selection: '#3A2E24',
  selectionEdge: '#F0A456',
  soft: '#3A2E24',
  focus: '#F0A456',
  focusGap: '#1A1D20',
  link: '#F0A456',
  onBrand: '#111417',
  cta: {
    background: '#3A2312',
    foreground: '#F0A456',
    hover: '#4E2F18',
    border: '#8F7665',
  },
  statuses: {
    success: '#ACE0C2',
    successBg: '#20372B',
    warning: '#F4D397',
    warningBg: '#443524',
    danger: '#F8ADB8',
    dangerBg: '#46282F',
    info: '#B0D5F3',
    infoBg: '#26394A',
  },
  disabled: {
    bg: '#313133',
    fg: '#B4B4B8',
  },
};

/**
 * Refined Maple Twilight dark neutrals tuple for Mantine.
 * Indices: 0 textPrimary, 2 textSecondary (muted), 4 borderStrong,
 * 5 raised / hover, 6 panel, 7 canvas.
 */
export const mapleTwilightDark = [
  '#F4F1EA', // 0: ink / textPrimary
  '#D8DCE0', // 1: secondary text
  '#C0C4C8', // 2: muted / dimmed
  '#A0A6AD', // 3: placeholder
  '#788088', // 4: borderStrong
  '#22262B', // 5: raised / hover
  '#1A1D20', // 6: panel
  '#111417', // 7: canvas
  '#0B0D0F', // 8: deep surface
  '#050607', // 9: deepest surface
] as const satisfies MantineColorsTuple;

/** Refined Maple Twilight brand ramp. */
export const mapleTwilightBrand = [
  '#261F1A', // 0: brandWash
  '#3A2E24', // 1: selection
  '#F0A456', // 2: link
  '#F5BB7B', // 3: brandText
  '#F0A456', // 4: brand (primary dark)
  '#F0A456', // 5
  '#F0A456', // 6: selectionEdge
  '#F0A456', // 7
  '#F5BB7B', // 8
  '#57270F', // 9
] as const satisfies MantineColorsTuple;

/** Refined Maple Twilight Walnut Glow CTA ramp. */
export const mapleTwilightWalnut = [
  '#F0A456', // 0: ctaFg
  '#E8DDD2', // 1
  '#D3C4B7', // 2
  '#BBA798', // 3
  '#5A371C', // 4: ctaBorder
  '#4E2F18', // 5: ctaHover
  '#3A2312', // 6: cta
  '#3A2312', // 7: cta
  '#3A2312', // 8
  '#241D18', // 9
] as const satisfies MantineColorsTuple;
