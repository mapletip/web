import { DEFAULT_THEME, mergeMantineTheme } from '@mantine/core';
import { describe, expect, it } from 'vitest';

import {
  maple,
  parchment,
  parchmentScheme,
  twilight,
  twilightScheme,
  type SchemeColors,
} from '../colors';
import { cssVariablesResolver, theme } from '../index';

/** WCAG 2.2 relative luminance for an opaque sRGB hex colour. */
function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [red = 0, green = 0, blue = 0] = channels;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const [lighter, darker] = first > second ? [first, second] : [second, first];
  return (lighter + 0.05) / (darker + 0.05);
}

interface ContrastCase {
  readonly name: string;
  readonly foreground: string;
  readonly background: string;
  readonly minimum: number;
}

function surfaceCases(
  scheme: SchemeColors,
  name: string,
): readonly ContrastCase[] {
  const surfaces = [
    ['canvas', scheme.canvas],
    ['panel', scheme.panel],
    ['raised', scheme.raised],
  ] as const;

  return surfaces.flatMap(([surfaceName, surface]) => [
    {
      name: `${name} primary text on ${surfaceName}`,
      foreground: scheme.textPrimary,
      background: surface,
      minimum: 4.5,
    },
    {
      name: `${name} secondary text on ${surfaceName}`,
      foreground: scheme.textSecondary,
      background: surface,
      minimum: 4.5,
    },
    {
      name: `${name} link on ${surfaceName}`,
      foreground: scheme.link,
      background: surface,
      minimum: 4.5,
    },
    {
      name: `${name} control boundary on ${surfaceName}`,
      foreground: scheme.borderControl,
      background: surface,
      minimum: 3,
    },
    {
      name: `${name} focus ring on ${surfaceName}`,
      foreground: scheme.focus,
      background: surface,
      minimum: 3,
    },
  ]);
}

const cases: readonly ContrastCase[] = [
  ...surfaceCases(twilightScheme, 'twilight'),
  ...surfaceCases(parchmentScheme, 'parchment'),
  {
    name: 'twilight filled primary label on primary shade',
    foreground: twilightScheme.filledActionText,
    background: maple[4],
    minimum: 4.5,
  },
  {
    name: 'parchment filled primary label on primary shade',
    foreground: parchmentScheme.filledActionText,
    background: maple[7],
    minimum: 4.5,
  },
  {
    name: 'twilight filled primary label on hover shade',
    foreground: twilightScheme.filledActionText,
    background: maple[5],
    minimum: 4.5,
  },
  {
    name: 'parchment filled primary label on hover shade',
    foreground: parchmentScheme.filledActionText,
    background: maple[8],
    minimum: 4.5,
  },
  {
    name: 'twilight placeholder on panel',
    foreground: twilight[3],
    background: twilightScheme.panel,
    minimum: 4.5,
  },
  {
    name: 'parchment placeholder on panel',
    foreground: parchment[5],
    background: parchmentScheme.panel,
    minimum: 4.5,
  },
  {
    name: 'twilight error text on canvas',
    foreground: twilightScheme.accents.danger,
    background: twilightScheme.canvas,
    minimum: 4.5,
  },
  {
    name: 'parchment error text on canvas',
    foreground: parchmentScheme.accents.danger,
    background: parchmentScheme.canvas,
    minimum: 4.5,
  },
  ...(['forest', 'sky', 'grape', 'gold', 'danger'] as const).flatMap(
    (role): ContrastCase[] =>
      (
        [
          ['panel', 'panel'],
          ['canvas', 'canvas'],
          ['raised', 'raised'],
        ] as const
      ).flatMap(([surfaceName, surfaceKey]): ContrastCase[] => [
        {
          name: `twilight ${role} accent on ${surfaceName}`,
          foreground: twilightScheme.accents[role],
          background: twilightScheme[surfaceKey],
          minimum: 4.5,
        },
        {
          name: `parchment ${role} accent on ${surfaceName}`,
          foreground: parchmentScheme.accents[role],
          background: parchmentScheme[surfaceKey],
          minimum: 4.5,
        },
      ]),
  ),
];

describe('Maple Twilight theme', () => {
  it('exposes the approved palettes and primary shades', () => {
    expect(maple).toHaveLength(10);
    expect(twilight).toHaveLength(10);
    expect(parchment).toHaveLength(10);
    expect(maple[4]).toBe('#F0A456');
    expect(maple[7]).toBe('#A34D16');
    expect(theme.primaryColor).toBe('maple');
    expect(theme.primaryShade).toEqual({ dark: 4, light: 7 });
  });

  it('maps scheme roles onto Mantine neutral variables', () => {
    const resolvedTheme = mergeMantineTheme(DEFAULT_THEME, theme);

    expect(resolvedTheme.colors.dark?.[0]).toBe(twilightScheme.textPrimary);
    expect(resolvedTheme.colors.dark?.[2]).toBe(twilightScheme.textSecondary);
    expect(resolvedTheme.colors.dark?.[4]).toBe(twilightScheme.borderControl);
    expect(resolvedTheme.colors.dark?.[5]).toBe(twilightScheme.raised);
    expect(resolvedTheme.colors.dark?.[6]).toBe(twilightScheme.panel);
    expect(resolvedTheme.colors.dark?.[7]).toBe(twilightScheme.canvas);
    expect(resolvedTheme.colors.gray?.[0]).toBe(parchmentScheme.raised);
    expect(resolvedTheme.colors.gray?.[3]).toBe(parchmentScheme.borderSubtle);
    expect(resolvedTheme.colors.gray?.[4]).toBe(parchmentScheme.borderControl);
    expect(resolvedTheme.colors.gray?.[6]).toBe(parchmentScheme.textSecondary);
    expect(resolvedTheme.colors.gray?.[9]).toBe(parchmentScheme.textPrimary);
    expect(resolvedTheme.white).toBe(parchmentScheme.panel);
    expect(resolvedTheme.black).toBe(parchmentScheme.textPrimary);
  });

  it('resolves only the scheme roles Mantine cannot express', () => {
    const variables = cssVariablesResolver(
      mergeMantineTheme(DEFAULT_THEME, theme),
    );

    expect(variables.light?.['--mantine-color-body']).toBe(
      parchmentScheme.canvas,
    );
    expect(variables.light?.['--mantine-color-anchor']).toBe(
      parchmentScheme.link,
    );
    expect(variables.light?.['--mantine-color-error']).toBe(
      parchmentScheme.accents.danger,
    );
    expect(variables.light?.['--mapletip-color-focus']).toBe(
      parchmentScheme.focus,
    );
    expect(variables.light?.['--mapletip-color-border-subtle']).toBe(
      parchmentScheme.borderSubtle,
    );
    expect(variables.dark?.['--mantine-color-body']).toBeUndefined();
    expect(variables.dark?.['--mantine-color-anchor']).toBe(
      twilightScheme.link,
    );
    expect(variables.dark?.['--mantine-color-error']).toBe(
      twilightScheme.accents.danger,
    );
    expect(variables.dark?.['--mapletip-color-focus']).toBe(
      twilightScheme.focus,
    );
    expect(variables.dark?.['--mapletip-color-border-subtle']).toBe(
      twilightScheme.borderSubtle,
    );
  });

  it('uses scheme-aware labels for filled primary actions', () => {
    const resolvedTheme = mergeMantineTheme(DEFAULT_THEME, theme);
    const resolved = resolvedTheme.variantColorResolver({
      color: 'maple',
      theme: resolvedTheme,
      variant: 'filled',
    });

    expect(resolved.background).toBe('var(--mantine-color-maple-filled)');
    expect(resolved.color).toBe('light-dark(#FFFFFF, #20140B)');
  });

  it.each(cases)(
    '$name meets $minimum:1',
    ({ foreground, background, minimum }) => {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
    },
  );

  // Recorded exclusion: these separators are decorative, so they are not a
  // required control boundary and intentionally stay below 3:1.
  it.each([
    {
      name: 'twilight border-subtle on panel',
      foreground: twilightScheme.borderSubtle,
      background: twilightScheme.panel,
    },
    {
      name: 'parchment border-subtle on panel',
      foreground: parchmentScheme.borderSubtle,
      background: parchmentScheme.panel,
    },
  ])(
    '$name is a decorative, non-essential boundary',
    ({ foreground, background }) => {
      expect(contrast(foreground, background)).toBeLessThan(3);
    },
  );
});
