import { DEFAULT_THEME } from '@mantine/core';
import { theme } from '@mapletip/theme';

export const spacingScale = Object.entries(DEFAULT_THEME.spacing);
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
