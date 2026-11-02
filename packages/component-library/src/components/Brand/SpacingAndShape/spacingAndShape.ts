import { DEFAULT_THEME } from '@mantine/core';
import { theme } from '@mapletip/theme';

/**
 * Spacing tokens are published as scalable `calc()` expressions. The docs show
 * the plain rem value behind each token (the scale is 1 at the default density),
 * so the table reads as design-system values rather than as a formula.
 */
function baseRem(value: string): string {
  const match = /(?<rem>[\d.]+)rem/u.exec(value);
  const rem = match?.groups?.['rem'];
  return rem === undefined ? value : `${rem}rem`;
}

export const spacingScale = Object.entries(DEFAULT_THEME.spacing).map(
  ([token, value]) => [token, baseRem(value)] as const,
);

export const mapleRadius = theme.radius as Required<
  NonNullable<typeof theme.radius>
>;

export const radiusScale = Object.entries(mapleRadius).filter(
  (entry): entry is [string, string] => typeof entry[1] === 'string',
);

export function toPixels(value: string | number): string {
  const text = String(value);
  const number = Number.parseFloat(text);

  return `${text.endsWith('rem') ? number * 16 : number}px`;
}
