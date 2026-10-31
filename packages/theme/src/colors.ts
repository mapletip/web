import type { MantineColorsTuple } from '@mantine/core';

/**
 * MapleTip approved colour foundation v7.
 * Single typed source of colour values in @mapletip/theme.
 *
 * Palettes are exposed to Mantine through `createTheme`; semantic roles refer to
 * the approved token definitions so no scheme-specific hex is repeated in CSS or stories.
 */

/** Classic Maple brand ramp. Primary shade: light 5, dark 4. */
export const maple = [
  '#FFF6E8', // 0: brandWash light
  '#FFF2E2', // 1: selection light
  '#F6BE90', // 2: link dark
  '#F0BA82', // 3: brandText dark
  '#EBA85F', // 4: brand dark (primary dark)
  '#DD9554', // 5: brand light (primary light)
  '#B97642', // 6: selectionEdge light
  '#A34C16', // 7: link light
  '#995928', // 8: brandText light
  '#57270F', // 9: deep shade
] as const satisfies MantineColorsTuple;

/** Walnut Glow primary action ramp. */
export const walnut = [
  '#F9EFE4', // 0: ctaFg dark
  '#E8DDD2', // 1
  '#D3C4B7', // 2
  '#BBA798', // 3
  '#9F8776', // 4
  '#856C5A', // 5
  '#6B5446', // 6
  '#514039', // 7: cta dark
  '#3D332C', // 8: cta light
  '#241D18', // 9: deep shade
] as const satisfies MantineColorsTuple;

/**
 * Graphite / charcoal (dark scheme) neutrals. Mantine derives dark-scheme surfaces and text
 * from these indices: 0 text (ink), 2 dimmed (muted), 4 control border (borderStrong),
 * 5 raised, 6 panel, 7 canvas.
 */
export const graphite = [
  '#F5F5F5', // 0: ink
  '#D8D8DC', // 1: secondary text
  '#C2C2C7', // 2: muted / dimmed
  '#A8A8AE', // 3: placeholder
  '#929299', // 4: borderStrong
  '#242428', // 5: raised / hover
  '#1A1A1D', // 6: panel
  '#111114', // 7: canvas
  '#0D0D0F', // 8: deep surface
  '#08080A', // 9: deepest surface
] as const satisfies MantineColorsTuple;

/**
 * Clear Porcelain (light scheme) neutrals. Mantine derives light-scheme states from
 * these indices: 0 raised, 2 border, 3 subtle border, 4 control border (borderStrong),
 * 6 dimmed (muted), 9 text (ink).
 */
export const porcelain = [
  '#F5F5F6', // 0: raised
  '#F0F0F2', // 1: subtle wash
  '#E8E8EA', // 2: border
  '#E8E8EA', // 3: border subtle
  '#ABB0B8', // 4: borderStrong
  '#8E939C', // 5: placeholder
  '#62636A', // 6: muted / dimmed
  '#4C4D53', // 7: secondary text
  '#37373C', // 8: strong text
  '#27272A', // 9: ink
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

/** Semantic roles for one colour scheme. */
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

/** Approved v7 Clear Porcelain light scheme. */
export const porcelainScheme: SchemeColors = {
  canvas: '#FAFAFB',
  panel: '#FFFFFF',
  raised: '#F5F5F6',
  rail: '#FFFFFF',
  borderSubtle: '#E8E8EA',
  borderStrong: '#ABB0B8',
  textPrimary: '#27272A',
  textSecondary: '#62636A',
  hover: '#F7F7F8',
  brand: '#DD9554',
  brandText: '#995928',
  brandWash: '#FFF6E8',
  selection: '#FFF2E2',
  selectionEdge: '#B97642',
  soft: '#FDF0E4',
  focus: '#B45B22',
  focusGap: '#FFFFFF',
  link: '#A34C16',
  onBrand: '#2B2017',
  cta: {
    background: '#3D332C',
    foreground: '#FFFFFF',
    hover: '#2D2621',
    border: '#3D332C',
  },
  statuses: {
    success: '#176647',
    successBg: '#E6F6EC',
    warning: '#795514',
    warningBg: '#FFF3D5',
    danger: '#9A293B',
    dangerBg: '#FBE8EC',
    info: '#2A5878',
    infoBg: '#E8F1FB',
  },
  disabled: {
    bg: '#E9E9E7',
    fg: '#64676A',
  },
};

/** Approved v7 Graphite dark scheme (historical reference). */
export const graphiteScheme: SchemeColors = {
  canvas: '#111114',
  panel: '#1A1A1D',
  raised: '#242428',
  rail: '#151518',
  borderSubtle: '#39393E',
  borderStrong: '#929299',
  textPrimary: '#F5F5F5',
  textSecondary: '#C2C2C7',
  hover: '#242428',
  brand: '#EBA85F',
  brandText: '#F0BA82',
  brandWash: '#382B23',
  selection: '#4D382B',
  selectionEdge: '#D49B69',
  soft: '#3B2D26',
  focus: '#F4AD70',
  focusGap: '#1A1A1D',
  link: '#F6BE90',
  onBrand: '#211B15',
  cta: {
    background: '#514039',
    foreground: '#F9EFE4',
    hover: '#604C42',
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

/** Export approved tokens metadata for tests and contract verification. */
export const approvedColorTokens = {
  name: 'MapleTip approved color foundation v7',
  locked: {
    background: 'Clear Porcelain',
    cta: 'Walnut Glow',
    soft: '#FDF0E4',
    selection: 'Maple Glow',
    identity: 'Classic Maple',
    linksAndFocus: 'Maple Orange',
    boundaries: 'Porcelain',
    statuses: 'Clear Signals',
  },
  light: {
    canvas: porcelainScheme.canvas,
    panel: porcelainScheme.panel,
    raised: porcelainScheme.raised,
    rail: porcelainScheme.rail,
    border: porcelainScheme.borderSubtle,
    borderStrong: porcelainScheme.borderStrong,
    ink: porcelainScheme.textPrimary,
    muted: porcelainScheme.textSecondary,
    hover: porcelainScheme.hover,
    brand: porcelainScheme.brand,
    brandText: porcelainScheme.brandText,
    brandWash: porcelainScheme.brandWash,
    selection: porcelainScheme.selection,
    selectionEdge: porcelainScheme.selectionEdge,
    soft: porcelainScheme.soft,
    focus: porcelainScheme.focus,
    focusGap: porcelainScheme.focusGap,
    link: porcelainScheme.link,
    onBrand: porcelainScheme.onBrand,
    success: porcelainScheme.statuses.success,
    successBg: porcelainScheme.statuses.successBg,
    warning: porcelainScheme.statuses.warning,
    warningBg: porcelainScheme.statuses.warningBg,
    danger: porcelainScheme.statuses.danger,
    dangerBg: porcelainScheme.statuses.dangerBg,
    info: porcelainScheme.statuses.info,
    infoBg: porcelainScheme.statuses.infoBg,
    disabledBg: porcelainScheme.disabled.bg,
    disabledFg: porcelainScheme.disabled.fg,
    cta: porcelainScheme.cta.background,
    ctaFg: porcelainScheme.cta.foreground,
    ctaHover: porcelainScheme.cta.hover,
    ctaBorder: porcelainScheme.cta.border,
  },
  dark: {
    canvas: graphiteScheme.canvas,
    panel: graphiteScheme.panel,
    raised: graphiteScheme.raised,
    rail: graphiteScheme.rail,
    border: graphiteScheme.borderSubtle,
    borderStrong: graphiteScheme.borderStrong,
    ink: graphiteScheme.textPrimary,
    muted: graphiteScheme.textSecondary,
    hover: graphiteScheme.hover,
    brand: graphiteScheme.brand,
    brandText: graphiteScheme.brandText,
    brandWash: graphiteScheme.brandWash,
    selection: graphiteScheme.selection,
    selectionEdge: graphiteScheme.selectionEdge,
    soft: graphiteScheme.soft,
    focus: graphiteScheme.focus,
    focusGap: graphiteScheme.focusGap,
    link: graphiteScheme.link,
    onBrand: graphiteScheme.onBrand,
    success: graphiteScheme.statuses.success,
    successBg: graphiteScheme.statuses.successBg,
    warning: graphiteScheme.statuses.warning,
    warningBg: graphiteScheme.statuses.warningBg,
    danger: graphiteScheme.statuses.danger,
    dangerBg: graphiteScheme.statuses.dangerBg,
    info: graphiteScheme.statuses.info,
    infoBg: graphiteScheme.statuses.infoBg,
    disabledBg: graphiteScheme.disabled.bg,
    disabledFg: graphiteScheme.disabled.fg,
    cta: graphiteScheme.cta.background,
    ctaFg: graphiteScheme.cta.foreground,
    ctaHover: graphiteScheme.cta.hover,
    ctaBorder: graphiteScheme.cta.border,
  },
} as const;
