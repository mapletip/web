import {
  createTheme,
  defaultVariantColorsResolver,
  type CSSVariablesResolver,
  type MantineColorsTuple,
  type MantineThemeOverride,
  type VariantColorsResolver,
} from '@mantine/core';
import { theme as baseTheme } from '@mapletip/theme';

import { PALETTES } from './palettes.data';
import type { PaletteDefinition, PaletteTokenSet } from './types';

/**
 * Returns the palette matching `id`, or safely falls back to `approved-v7`.
 */
export function getPalette(id?: string): PaletteDefinition {
  const fallback = PALETTES[0] as PaletteDefinition;
  if (!id) return fallback;
  const found = PALETTES.find((p) => p.id === id);
  return found ?? fallback;
}

/**
 * Maps a PaletteTokenSet to MapleTip semantic and Mantine system CSS variables.
 */
function resolveSchemeVariables(
  tokens: PaletteTokenSet,
): Record<string, string> {
  return {
    '--mantine-color-anchor': tokens.link,
    '--mantine-color-error': tokens.statuses.danger,
    '--pagination-active-color': tokens.onBrand,
    '--mapletip-color-canvas': tokens.canvas,
    '--mapletip-color-panel': tokens.panel,
    '--mapletip-color-raised': tokens.raised,
    '--mapletip-color-rail': tokens.rail,
    '--mapletip-color-border-subtle': tokens.borderSubtle,
    '--mapletip-color-border-strong': tokens.borderStrong,
    '--mapletip-color-ink': tokens.textPrimary,
    '--mapletip-color-muted': tokens.textSecondary,
    '--mapletip-color-hover': tokens.hover,
    '--mapletip-color-brand': tokens.brand,
    '--mapletip-color-brand-text': tokens.brandText,
    '--mapletip-color-brand-wash': tokens.brandWash,
    '--mapletip-color-on-brand': tokens.onBrand,
    '--mapletip-color-selection': tokens.selection,
    '--mapletip-color-selection-edge': tokens.selectionEdge,
    '--mapletip-color-soft': tokens.soft,
    '--mapletip-color-focus': tokens.focus,
    '--mapletip-color-focus-gap': tokens.focusGap,
    '--mapletip-color-link': tokens.link,
    '--mapletip-color-link-hover': tokens.linkHover ?? tokens.link,
    '--mapletip-link-weight': tokens.linkWeight ?? 'inherit',
    '--mapletip-link-decoration-thickness':
      tokens.linkDecorationThickness ?? 'auto',
    '--mapletip-link-hover-decoration':
      tokens.linkHoverDecoration ?? 'underline',
    '--mapletip-table-title-weight': tokens.tableTitleWeight ?? 'inherit',
    '--mapletip-color-cta': tokens.cta.background,
    '--mapletip-color-cta-fg': tokens.cta.foreground,
    '--mapletip-color-cta-hover': tokens.cta.hover,
    '--mapletip-color-cta-border': tokens.cta.border,
    '--mapletip-color-status-success': tokens.statuses.success,
    '--mapletip-color-status-success-bg': tokens.statuses.successBg,
    '--mapletip-color-status-warning': tokens.statuses.warning,
    '--mapletip-color-status-warning-bg': tokens.statuses.warningBg,
    '--mapletip-color-status-danger': tokens.statuses.danger,
    '--mapletip-color-status-danger-bg': tokens.statuses.dangerBg,
    '--mapletip-color-status-info': tokens.statuses.info,
    '--mapletip-color-status-info-bg': tokens.statuses.infoBg,
    '--mapletip-color-disabled-bg': tokens.disabled.bg,
    '--mapletip-color-disabled-fg': tokens.disabled.fg,
    '--mapletip-color-accent-forest': tokens.statuses.success,
    '--mapletip-color-accent-sky': tokens.statuses.info,
    '--mapletip-color-accent-gold': tokens.statuses.warning,
    '--mapletip-color-accent-danger': tokens.statuses.danger,
  };
}

/**
 * Creates a synthetic 10-shade MantineColorsTuple mapping light and dark hexes.
 */
function createSyntheticRamp(
  lightHex: string,
  darkHex: string,
): MantineColorsTuple {
  return [
    lightHex, // 0
    lightHex, // 1
    lightHex, // 2
    lightHex, // 3
    darkHex, // 4 (dark primary)
    lightHex, // 5 (light primary)
    lightHex, // 6
    darkHex, // 7
    darkHex, // 8
    darkHex, // 9
  ];
}

/**
 * Resolves the Mantine theme override and CSS variables resolver for a given palette.
 * For `approved-v7`, this returns the production `@mapletip/theme` objects untouched.
 */
export function resolvePaletteTheme(paletteId?: string): {
  palette: PaletteDefinition;
  theme: MantineThemeOverride;
  cssVariablesResolver: CSSVariablesResolver;
} {
  const palette = getPalette(paletteId);

  // Variant resolver for studio palettes so buttons and filled controls
  // read the active palette's dynamic variables
  const experimentalVariantResolver: VariantColorsResolver = (input) => {
    if (input.color === 'walnut') {
      if (input.variant === 'filled') {
        return {
          background: 'var(--mapletip-color-cta)',
          hover: 'var(--mapletip-color-cta-hover)',
          color: 'var(--mapletip-color-cta-fg)',
          border: '1px solid var(--mapletip-color-cta-border)',
        };
      }
      if (input.variant === 'outline') {
        return {
          background: 'transparent',
          hover: 'var(--mapletip-color-hover)',
          color:
            'light-dark(var(--mapletip-color-cta), var(--mapletip-color-cta-fg))',
          border: '1px solid var(--mapletip-color-cta-border)',
        };
      }
      if (input.variant === 'light') {
        return {
          background: 'var(--mapletip-color-selection)',
          hover: 'var(--mapletip-color-soft)',
          color:
            'light-dark(var(--mapletip-color-cta), var(--mapletip-color-cta-fg))',
          border: '1px solid transparent',
        };
      }
      if (input.variant === 'subtle') {
        return {
          background: 'transparent',
          hover: 'var(--mapletip-color-hover)',
          color:
            'light-dark(var(--mapletip-color-cta), var(--mapletip-color-cta-fg))',
          border: '1px solid transparent',
        };
      }
    }

    const effectiveColor = input.color ?? input.theme.primaryColor;
    if (effectiveColor === 'maple') {
      if (input.variant === 'outline') {
        return {
          background: 'transparent',
          hover: 'var(--mapletip-color-brand-wash)',
          color: 'var(--mapletip-color-link)',
          border: '1px solid var(--mapletip-color-link)',
        };
      }
      if (input.variant === 'subtle') {
        return {
          background: 'transparent',
          hover: 'var(--mapletip-color-brand-wash)',
          color: 'var(--mapletip-color-link)',
          border: '1px solid transparent',
        };
      }
      if (input.variant === 'light') {
        return {
          background: 'var(--mapletip-color-brand-wash)',
          hover: 'var(--mapletip-color-selection)',
          color: 'var(--mapletip-color-link)',
          border: '1px solid transparent',
        };
      }
    }

    const resolved = defaultVariantColorsResolver(input);
    const isPrimaryFilled =
      input.variant === 'filled' &&
      (input.color ?? input.theme.primaryColor) === input.theme.primaryColor;

    if (isPrimaryFilled) {
      return {
        ...resolved,
        color: 'var(--mapletip-color-on-brand)',
      };
    }

    return resolved;
  };

  const experimentalTheme: MantineThemeOverride = createTheme({
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      maple: createSyntheticRamp(palette.light.brand, palette.dark.brand),
      walnut: createSyntheticRamp(
        palette.light.cta.background,
        palette.dark.cta.background,
      ),
    },
    white: palette.light.panel,
    black: palette.light.textPrimary,
    variantColorResolver: experimentalVariantResolver,
    components: {
      ...baseTheme.components,
      Anchor: {
        defaultProps: {
          underline: 'always',
        },
        styles: {
          root: {
            fontWeight: 'var(--mapletip-link-weight, inherit)',
            textDecorationThickness:
              'var(--mapletip-link-decoration-thickness, auto)',
            '&:hover': {
              color:
                'var(--mapletip-color-link-hover, var(--mantine-color-anchor))',
              textDecoration:
                'var(--mapletip-link-hover-decoration, underline)',
            },
          },
        },
      },
      Checkbox: {
        defaultProps: {
          iconColor: 'var(--mapletip-color-on-brand)',
          radius: 'xs',
        },
      },
    },
  });

  const experimentalResolver: CSSVariablesResolver = () => ({
    variables: {},
    light: {
      ...resolveSchemeVariables(palette.light),
      '--mantine-color-body': palette.light.canvas,
    },
    dark: {
      ...resolveSchemeVariables(palette.dark),
      '--mantine-color-body': palette.dark.canvas,
    },
  });

  return {
    palette,
    theme: experimentalTheme,
    cssVariablesResolver: experimentalResolver,
  };
}
