import { DEFAULT_THEME, mergeMantineTheme } from '@mantine/core';
import { describe, expect, it } from 'vitest';

import {
  approvedColorTokens,
  graphite,
  graphiteScheme,
  maple,
  mapleTwilightLinks,
  porcelain,
  porcelainScheme,
  walnut,
  type SchemeColors,
} from '../colors';
import {
  cssVariablesResolver,
  theme,
  twilightLinksCssVariablesResolver,
} from '../index';

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
  ...surfaceCases(graphiteScheme, 'graphite (dark)'),
  ...surfaceCases(porcelainScheme, 'porcelain (light)'),
  {
    name: 'graphite filled Walnut CTA label on CTA background',
    foreground: graphiteScheme.cta.foreground,
    background: graphiteScheme.cta.background,
    minimum: 4.5,
  },
  {
    name: 'porcelain filled Walnut CTA label on CTA background',
    foreground: porcelainScheme.cta.foreground,
    background: porcelainScheme.cta.background,
    minimum: 4.5,
  },
  {
    name: 'graphite filled Walnut CTA label on hover background',
    foreground: graphiteScheme.cta.foreground,
    background: graphiteScheme.cta.hover,
    minimum: 4.5,
  },
  {
    name: 'porcelain filled Walnut CTA label on hover background',
    foreground: porcelainScheme.cta.foreground,
    background: porcelainScheme.cta.hover,
    minimum: 4.5,
  },
  {
    name: 'graphite Walnut CTA border on dark panel',
    foreground: graphiteScheme.cta.border,
    background: graphiteScheme.panel,
    minimum: 3,
  },
  {
    name: 'graphite onBrand text on dark brand primary',
    foreground: graphiteScheme.onBrand,
    background: graphiteScheme.brand,
    minimum: 4.5,
  },
  {
    name: 'porcelain onBrand text on light brand primary',
    foreground: porcelainScheme.onBrand,
    background: porcelainScheme.brand,
    minimum: 4.5,
  },
  {
    name: 'graphite primary text on selection background',
    foreground: graphiteScheme.textPrimary,
    background: graphiteScheme.selection,
    minimum: 4.5,
  },
  {
    name: 'porcelain primary text on selection background',
    foreground: porcelainScheme.textPrimary,
    background: porcelainScheme.selection,
    minimum: 4.5,
  },
  {
    name: 'graphite link on selection background',
    foreground: graphiteScheme.link,
    background: graphiteScheme.selection,
    minimum: 4.5,
  },
  {
    name: 'porcelain link on selection background',
    foreground: porcelainScheme.link,
    background: porcelainScheme.selection,
    minimum: 4.5,
  },
  // Clear Signals statuses on their own backgrounds and surfaces
  ...(['success', 'warning', 'danger', 'info'] as const).flatMap(
    (status): ContrastCase[] => [
      {
        name: `graphite ${status} text on its background`,
        foreground: graphiteScheme.statuses[status],
        background: graphiteScheme.statuses[`${status}Bg`],
        minimum: 4.5,
      },
      {
        name: `porcelain ${status} text on its background`,
        foreground: porcelainScheme.statuses[status],
        background: porcelainScheme.statuses[`${status}Bg`],
        minimum: 4.5,
      },
      {
        name: `graphite ${status} text on panel`,
        foreground: graphiteScheme.statuses[status],
        background: graphiteScheme.panel,
        minimum: 4.5,
      },
      {
        name: `porcelain ${status} text on panel`,
        foreground: porcelainScheme.statuses[status],
        background: porcelainScheme.panel,
        minimum: 4.5,
      },
    ],
  ),
];

describe('MapleTip approved theme foundation', () => {
  it('exposes the approved v7 tokens matching specification', () => {
    expect(approvedColorTokens.locked.background).toBe('Clear Porcelain');
    expect(approvedColorTokens.locked.cta).toBe('Walnut Glow');
    expect(approvedColorTokens.locked.soft).toBe('#FDF0E4');
    expect(approvedColorTokens.locked.selection).toBe('Maple Glow');
    expect(approvedColorTokens.locked.identity).toBe('Classic Maple');
    expect(approvedColorTokens.locked.linksAndFocus).toBe('Maple Orange');
    expect(approvedColorTokens.locked.boundaries).toBe('Porcelain');
    expect(approvedColorTokens.locked.statuses).toBe('Clear Signals');

    expect(approvedColorTokens.light.canvas).toBe('#FAFAFB');
    expect(approvedColorTokens.light.panel).toBe('#FFFFFF');
    expect(approvedColorTokens.light.cta).toBe('#3D332C');
    expect(approvedColorTokens.light.ctaFg).toBe('#FFFFFF');
    expect(approvedColorTokens.light.ctaHover).toBe('#2D2621');
    expect(approvedColorTokens.light.ctaBorder).toBe('#3D332C');
    expect(approvedColorTokens.light.brand).toBe('#DD9554');
    expect(approvedColorTokens.light.brandText).toBe('#995928');
    expect(approvedColorTokens.light.link).toBe('#A34C16');
    expect(approvedColorTokens.light.focus).toBe('#B45B22');
    expect(approvedColorTokens.light.focusGap).toBe('#FFFFFF');
    expect(approvedColorTokens.light.selection).toBe('#FFF2E2');
    expect(approvedColorTokens.light.selectionEdge).toBe('#B97642');
    expect(approvedColorTokens.light.soft).toBe('#FDF0E4');

    expect(approvedColorTokens.dark.canvas).toBe('#111114');
    expect(approvedColorTokens.dark.panel).toBe('#1A1A1D');
    expect(approvedColorTokens.dark.cta).toBe('#514039');
    expect(approvedColorTokens.dark.ctaFg).toBe('#F9EFE4');
    expect(approvedColorTokens.dark.ctaHover).toBe('#604C42');
    expect(approvedColorTokens.dark.ctaBorder).toBe('#8F7665');
    expect(approvedColorTokens.dark.brand).toBe('#EBA85F');
    expect(approvedColorTokens.dark.brandText).toBe('#F0BA82');
    expect(approvedColorTokens.dark.link).toBe('#F6BE90');
    expect(approvedColorTokens.dark.focus).toBe('#F4AD70');
    expect(approvedColorTokens.dark.focusGap).toBe('#1A1A1D');
    expect(approvedColorTokens.dark.selection).toBe('#4D382B');
    expect(approvedColorTokens.dark.selectionEdge).toBe('#D49B69');
    expect(approvedColorTokens.dark.soft).toBe('#3B2D26');
  });

  it('exposes the approved palettes, primary shades, and typography', () => {
    expect(maple).toHaveLength(10);
    expect(walnut).toHaveLength(10);
    expect(graphite).toHaveLength(10);
    expect(porcelain).toHaveLength(10);

    expect(theme.primaryColor).toBe('maple');
    expect(theme.primaryShade).toEqual({ dark: 4, light: 5 });
    expect(theme.defaultRadius).toBe('sm');
    expect(theme.fontSizes?.sm).toBe('0.875rem');
    expect(theme.fontSizes?.md).toBe('1rem');
    expect(theme.radius?.sm).toBe('0.5rem');
    expect(theme.radius?.md).toBe('0.75rem');
  });

  it('maps scheme roles onto Mantine neutral variables', () => {
    const resolvedTheme = mergeMantineTheme(DEFAULT_THEME, theme);

    expect(resolvedTheme.colors.dark?.[0]).toBe(graphiteScheme.textPrimary);
    expect(resolvedTheme.colors.dark?.[2]).toBe(graphiteScheme.textSecondary);
    expect(resolvedTheme.colors.dark?.[4]).toBe(graphiteScheme.borderStrong);
    expect(resolvedTheme.colors.dark?.[5]).toBe(graphiteScheme.raised);
    expect(resolvedTheme.colors.dark?.[6]).toBe(graphiteScheme.panel);
    expect(resolvedTheme.colors.dark?.[7]).toBe(graphiteScheme.canvas);

    expect(resolvedTheme.colors.gray?.[0]).toBe(porcelainScheme.raised);
    expect(resolvedTheme.colors.gray?.[2]).toBe(porcelainScheme.borderSubtle);
    expect(resolvedTheme.colors.gray?.[3]).toBe(porcelainScheme.borderSubtle);
    expect(resolvedTheme.colors.gray?.[4]).toBe(porcelainScheme.borderStrong);
    expect(resolvedTheme.colors.gray?.[6]).toBe(porcelainScheme.textSecondary);
    expect(resolvedTheme.colors.gray?.[9]).toBe(porcelainScheme.textPrimary);

    expect(resolvedTheme.white).toBe(porcelainScheme.panel);
    expect(resolvedTheme.black).toBe(porcelainScheme.textPrimary);
  });

  it('resolves semantic variables in cssVariablesResolver', () => {
    const variables = cssVariablesResolver(
      mergeMantineTheme(DEFAULT_THEME, theme),
    );

    expect(variables.light?.['--mantine-color-body']).toBe(
      porcelainScheme.canvas,
    );
    expect(variables.light?.['--mantine-color-anchor']).toBe(
      porcelainScheme.link,
    );
    expect(variables.light?.['--mapletip-color-focus']).toBe(
      porcelainScheme.focus,
    );
    expect(variables.light?.['--mapletip-color-focus-gap']).toBe(
      porcelainScheme.focusGap,
    );
    expect(variables.light?.['--mapletip-color-cta']).toBe(
      porcelainScheme.cta.background,
    );
    expect(variables.light?.['--mapletip-color-cta-fg']).toBe(
      porcelainScheme.cta.foreground,
    );
    expect(variables.light?.['--mapletip-color-selection']).toBe(
      porcelainScheme.selection,
    );
    expect(variables.light?.['--mapletip-color-selection-edge']).toBe(
      porcelainScheme.selectionEdge,
    );
    expect(variables.light?.['--mapletip-color-soft']).toBe(
      porcelainScheme.soft,
    );

    expect(variables.dark?.['--mantine-color-body']).toBe(
      graphiteScheme.canvas,
    );
    expect(variables.dark?.['--mantine-color-anchor']).toBe(
      graphiteScheme.link,
    );
    expect(variables.dark?.['--mapletip-color-focus']).toBe(
      graphiteScheme.focus,
    );
    expect(variables.dark?.['--mapletip-color-focus-gap']).toBe(
      graphiteScheme.focusGap,
    );
    expect(variables.dark?.['--mapletip-color-cta']).toBe(
      graphiteScheme.cta.background,
    );
    expect(variables.dark?.['--mapletip-color-cta-fg']).toBe(
      graphiteScheme.cta.foreground,
    );
    expect(variables.dark?.['--mapletip-color-selection']).toBe(
      graphiteScheme.selection,
    );
    expect(variables.dark?.['--mapletip-color-selection-edge']).toBe(
      graphiteScheme.selectionEdge,
    );
    expect(variables.dark?.['--mapletip-color-soft']).toBe(graphiteScheme.soft);
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

  it('keeps scheme-aware labels for filled brand badges', () => {
    const resolvedTheme = mergeMantineTheme(DEFAULT_THEME, theme);
    const resolved = resolvedTheme.variantColorResolver({
      color: 'maple',
      theme: resolvedTheme,
      variant: 'filled',
    });

    expect(resolved.background).toBe('var(--mantine-color-maple-filled)');
    expect(resolved.color).toBe('light-dark(#2B2017, #211B15)');
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

    const light = resolvedTheme.variantColorResolver({
      color: 'maple',
      theme: resolvedTheme,
      variant: 'light',
    });
    expect(light.background).toBe('var(--mapletip-color-brand-wash)');
    expect(light.hover).toBe('var(--mapletip-color-selection)');
    expect(light.color).toBe('var(--mapletip-color-link)');
  });

  it.each(cases)(
    '$name meets $minimum:1',
    ({ foreground, background, minimum }) => {
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
    },
  );

  // Recorded exclusion: decorative borders intentionally stay below 3:1
  it.each([
    {
      name: 'graphite border-subtle on panel',
      foreground: graphiteScheme.borderSubtle,
      background: graphiteScheme.panel,
    },
    {
      name: 'porcelain border-subtle on panel',
      foreground: porcelainScheme.borderSubtle,
      background: porcelainScheme.panel,
    },
  ])(
    '$name is a decorative, non-essential boundary',
    ({ foreground, background }) => {
      expect(contrast(foreground, background)).toBeLessThan(3);
    },
  );

  it('resolves Maple Twilight link accents in twilightLinksCssVariablesResolver', () => {
    const vars = twilightLinksCssVariablesResolver(DEFAULT_THEME);
    expect(vars.light['--mapletip-color-link']).toBe(mapleTwilightLinks.light);
    expect(vars.light['--mantine-color-anchor']).toBe(mapleTwilightLinks.light);
    expect(vars.dark['--mapletip-color-link']).toBe(mapleTwilightLinks.dark);
    expect(vars.dark['--mantine-color-anchor']).toBe(mapleTwilightLinks.dark);
  });

  it('meets WCAG AAA contrast for Maple Twilight link tokens across surfaces', () => {
    // Light mode #8A3E0C meets >7:1 AAA
    expect(contrast(mapleTwilightLinks.light, '#FFFFFF')).toBeGreaterThan(7.0);
    expect(
      contrast(mapleTwilightLinks.light, porcelainScheme.canvas),
    ).toBeGreaterThan(7.0);
    expect(
      contrast(mapleTwilightLinks.light, porcelainScheme.raised),
    ).toBeGreaterThan(6.8);

    // Dark mode #F5BB7B meets >10:1 AAA
    expect(
      contrast(mapleTwilightLinks.dark, graphiteScheme.canvas),
    ).toBeGreaterThan(10.0);
    expect(
      contrast(mapleTwilightLinks.dark, graphiteScheme.panel),
    ).toBeGreaterThan(10.0);
  });
});
