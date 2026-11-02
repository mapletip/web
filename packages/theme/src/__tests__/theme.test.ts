import { DEFAULT_THEME, mergeMantineTheme } from '@mantine/core';
import { describe, expect, it } from 'vitest';

import {
  mapleTwilightBrand,
  mapleTwilightDark,
  mapleTwilightScheme,
  mapleTwilightWalnut,
  neutral,
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
      name: `${name} focus ring on ${surfaceName}`,
      foreground: scheme.focus,
      background: surface,
      minimum: 3,
    },
  ]);
}

const cases: readonly ContrastCase[] = [
  ...surfaceCases(mapleTwilightScheme, 'maple twilight'),
  {
    name: 'maple twilight filled Walnut CTA label on CTA background',
    foreground: mapleTwilightScheme.cta.foreground,
    background: mapleTwilightScheme.cta.background,
    minimum: 4.5,
  },
  {
    name: 'maple twilight filled Walnut CTA label on hover background',
    foreground: mapleTwilightScheme.cta.foreground,
    background: mapleTwilightScheme.cta.hover,
    minimum: 4.5,
  },
  {
    name: 'maple twilight Walnut CTA border on panel',
    foreground: mapleTwilightScheme.cta.border,
    background: mapleTwilightScheme.panel,
    minimum: 3,
  },
  {
    name: 'maple twilight onBrand text on brand primary',
    foreground: mapleTwilightScheme.onBrand,
    background: mapleTwilightScheme.brand,
    minimum: 4.5,
  },
  {
    name: 'maple twilight primary text on selection background',
    foreground: mapleTwilightScheme.textPrimary,
    background: mapleTwilightScheme.selection,
    minimum: 4.5,
  },
  {
    name: 'maple twilight link on selection background',
    foreground: mapleTwilightScheme.link,
    background: mapleTwilightScheme.selection,
    minimum: 4.5,
  },
  // Clear Signals statuses on their own backgrounds and surfaces
  ...(['success', 'warning', 'danger', 'info'] as const).flatMap(
    (status): ContrastCase[] => [
      {
        name: `maple twilight ${status} text on its background`,
        foreground: mapleTwilightScheme.statuses[status],
        background: mapleTwilightScheme.statuses[`${status}Bg`],
        minimum: 4.5,
      },
      {
        name: `maple twilight ${status} text on panel`,
        foreground: mapleTwilightScheme.statuses[status],
        background: mapleTwilightScheme.panel,
        minimum: 4.5,
      },
    ],
  ),
];

describe('MapleTip approved theme foundation', () => {
  it('exposes the Maple Twilight tokens', () => {
    expect(mapleTwilightScheme.canvas).toBe('#111417');
    expect(mapleTwilightScheme.panel).toBe('#1A1D20');
    expect(mapleTwilightScheme.raised).toBe('#22262B');
    expect(mapleTwilightScheme.textPrimary).toBe('#F4F1EA');
    expect(mapleTwilightScheme.textSecondary).toBe('#C0C4C8');
    expect(mapleTwilightScheme.link).toBe('#F0A456');
    expect(mapleTwilightScheme.focus).toBe('#F0A456');
    expect(mapleTwilightScheme.focusGap).toBe('#1A1D20');
    expect(mapleTwilightScheme.selection).toBe('#3A2E24');
    expect(mapleTwilightScheme.cta.background).toBe('#3A2312');
    expect(mapleTwilightScheme.cta.foreground).toBe('#F0A456');
    expect(mapleTwilightScheme.cta.hover).toBe('#4E2F18');
  });

  it('exposes the palettes, primary shade, and typography', () => {
    expect(neutral).toHaveLength(10);
    expect(mapleTwilightBrand).toHaveLength(10);
    expect(mapleTwilightDark).toHaveLength(10);
    expect(mapleTwilightWalnut).toHaveLength(10);

    expect(theme.primaryColor).toBe('maple');
    expect(theme.primaryShade).toBe(4);
    expect(theme.defaultRadius).toBe('sm');
    expect(theme.fontSizes?.sm).toBe('0.875rem');
    expect(theme.fontSizes?.md).toBe('1rem');
    expect(theme.radius?.sm).toBe('0.5rem');
    expect(theme.radius?.md).toBe('0.75rem');
  });

  it('maps scheme roles onto Mantine neutral variables', () => {
    const resolvedTheme = mergeMantineTheme(DEFAULT_THEME, theme);

    expect(resolvedTheme.colors.dark?.[0]).toBe(
      mapleTwilightScheme.textPrimary,
    );
    expect(resolvedTheme.colors.dark?.[2]).toBe(
      mapleTwilightScheme.textSecondary,
    );
    expect(resolvedTheme.colors.dark?.[4]).toBe(
      mapleTwilightScheme.borderStrong,
    );
    expect(resolvedTheme.colors.dark?.[5]).toBe(mapleTwilightScheme.raised);
    expect(resolvedTheme.colors.dark?.[6]).toBe(mapleTwilightScheme.panel);
    expect(resolvedTheme.colors.dark?.[7]).toBe(mapleTwilightScheme.canvas);

    expect(resolvedTheme.colors.gray).toEqual(neutral);

    expect(resolvedTheme.white).toBe('#FFFFFF');
    expect(resolvedTheme.black).toBe('#000000');
  });

  it('resolves semantic variables in cssVariablesResolver', () => {
    const variables = cssVariablesResolver(
      mergeMantineTheme(DEFAULT_THEME, theme),
    );

    expect(variables.light).toEqual({});
    expect(variables.dark?.['--mantine-color-body']).toBe(
      mapleTwilightScheme.canvas,
    );
    expect(variables.dark?.['--mantine-color-anchor']).toBe(
      mapleTwilightScheme.link,
    );
    expect(variables.dark?.['--mapletip-color-focus']).toBe(
      mapleTwilightScheme.focus,
    );
    expect(variables.dark?.['--mapletip-color-focus-gap']).toBe(
      mapleTwilightScheme.focusGap,
    );
    expect(variables.dark?.['--mapletip-color-cta']).toBe(
      mapleTwilightScheme.cta.background,
    );
    expect(variables.dark?.['--mapletip-color-cta-fg']).toBe(
      mapleTwilightScheme.cta.foreground,
    );
    expect(variables.dark?.['--mapletip-color-selection']).toBe(
      mapleTwilightScheme.selection,
    );
    expect(variables.dark?.['--mapletip-color-selection-edge']).toBe(
      mapleTwilightScheme.selectionEdge,
    );
    expect(variables.dark?.['--mapletip-color-soft']).toBe(
      mapleTwilightScheme.soft,
    );
  });

  it('resolves Walnut CTA as default button action', () => {
    const resolvedTheme = mergeMantineTheme(DEFAULT_THEME, theme);
    const resolved = resolvedTheme.variantColorResolver({
      color: 'walnut',
      theme: resolvedTheme,
      variant: 'filled',
    });

    expect(resolved.background).toBe('var(--mapletip-color-cta)');
    expect(resolved.color).toBe('var(--mapletip-color-cta-fg)');
    expect(resolved.hover).toBe('var(--mapletip-color-cta-hover)');
    expect(resolved.border).toBe('1px solid var(--mapletip-color-cta-border)');
  });

  it('keeps the onBrand label on filled brand badges', () => {
    const resolvedTheme = mergeMantineTheme(DEFAULT_THEME, theme);
    const resolved = resolvedTheme.variantColorResolver({
      color: 'maple',
      theme: resolvedTheme,
      variant: 'filled',
    });

    expect(resolved.background).toBe('var(--mantine-color-maple-filled)');
    expect(resolved.color).toBe(mapleTwilightScheme.onBrand);
  });

  it('resolves subtle and light variants for maple with brand wash and link tokens', () => {
    const resolvedTheme = mergeMantineTheme(DEFAULT_THEME, theme);

    const subtle = resolvedTheme.variantColorResolver({
      color: 'maple',
      theme: resolvedTheme,
      variant: 'subtle',
    });
    expect(subtle.background).toBe('transparent');
    expect(subtle.hover).toBe('var(--mapletip-color-brand-wash)');
    expect(subtle.color).toBe('var(--mapletip-color-link)');

    const lightVariant = resolvedTheme.variantColorResolver({
      color: 'maple',
      theme: resolvedTheme,
      variant: 'light',
    });
    expect(lightVariant.background).toBe('var(--mapletip-color-brand-wash)');
    expect(lightVariant.hover).toBe('var(--mapletip-color-selection)');
    expect(lightVariant.color).toBe('var(--mapletip-color-link)');
  });

  it.each(cases)(
    '$name meets $minimum:1',
    ({ foreground, background, minimum }) => {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
    },
  );

  // Recorded exclusion: decorative borders intentionally stay below 3:1
  it('border-subtle is a decorative, non-essential boundary', () => {
    expect(
      contrast(mapleTwilightScheme.borderSubtle, mapleTwilightScheme.panel),
    ).toBeLessThan(3);
  });
});
