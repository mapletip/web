import {
  createTheme,
  defaultVariantColorsResolver,
  type CSSVariablesResolver,
  type MantineThemeOverride,
  type VariantColorsResolver,
} from '@mantine/core';

import {
  mapleTwilightBrand,
  mapleTwilightDark,
  mapleTwilightScheme,
  mapleTwilightWalnut,
  porcelain,
  porcelainScheme,
  type SchemeColors,
} from './colors';

/**
 * System sans-serif-first font stack for productive, readable information UI.
 * No external webfont dependency.
 */
const SYSTEM_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';

/**
 * Custom variant resolver that maps Walnut Glow to primary action buttons
 * without converting all primary-colored controls (Checkbox, Pagination, Tabs)
 * to Walnut, and keeps scheme-aware high-contrast labels on Maple filled badges.
 */
const variantColorResolver: VariantColorsResolver = (input) => {
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
      color: `light-dark(${porcelainScheme.onBrand}, ${mapleTwilightScheme.onBrand})`,
    };
  }

  return resolved;
};

/**
 * Shared MapleTip Mantine theme:
 * - Maple Twilight canonical dark scheme
 * - Walnut Glow primary actions
 * - Luminous amber link and brand identity
 * - Productive typography and balanced-compact density
 * - Softly rounded surfaces (~8px controls, ~12px panels)
 */
export const theme: MantineThemeOverride = createTheme({
  primaryColor: 'maple',
  primaryShade: { light: 5, dark: 4 },
  colors: {
    maple: mapleTwilightBrand,
    walnut: mapleTwilightWalnut,
    dark: mapleTwilightDark,
    gray: porcelain,
  },
  white: '#FFFFFF',
  black: '#000000',
  fontFamily: SYSTEM_FONT_FAMILY,
  // Productive typography scale: 12px metadata, 14px UI/data, 16px reading, 20px section, 24px entity
  fontSizes: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    md: '1rem', // 16px
    lg: '1.25rem', // 20px
    xl: '1.5rem', // 24px
  },
  lineHeights: {
    xs: '1rem', // 16px
    sm: '1.25rem', // 20px
    md: '1.5rem', // 24px
    lg: '1.75rem', // 28px
    xl: '2rem', // 32px
  },
  headings: {
    fontFamily: SYSTEM_FONT_FAMILY,
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '1.75rem', lineHeight: '2.25rem', fontWeight: '600' }, // Page heading: 28 / 36px
      h2: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '600' }, // Entity heading: 24 / 32px
      h3: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '600' }, // Section heading: 20 / 28px
      h4: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '600' }, // Component heading: 16 / 24px
    },
  },
  // Softly rounded radius scale: 8px controls, 12px outer panels/cards
  radius: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px (controls)
    md: '0.75rem', // 12px (cards/panels)
    lg: '1rem', // 16px
    xl: '1.5rem', // 24px
  },
  defaultRadius: 'sm',
  // Preserved from the pre-theme component library so existing responsive
  // contracts keep matching the PostCSS breakpoint variables.
  breakpoints: {
    xs: '31.25em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },
  respectReducedMotion: true,
  components: {
    // Alerts default to light variant with maple brand wash and accessible link foreground
    Alert: {
      defaultProps: {
        color: 'maple',
        variant: 'light',
        radius: 'sm',
      },
    },
    // Buttons default to Walnut Glow primary CTA with ~8px radius
    Button: {
      defaultProps: {
        color: 'walnut',
        radius: 'sm',
      },
    },
    // Inline links must not rely on colour alone (WCAG 1.4.1)
    Anchor: {
      defaultProps: {
        underline: 'always',
      },
    },
    // Badges default to filled with 8px radius
    Badge: {
      defaultProps: {
        variant: 'filled',
        radius: 'sm',
      },
    },
    // Checkboxes use onBrand tick color for contrast on orange fill
    Checkbox: {
      defaultProps: {
        iconColor: `light-dark(${porcelainScheme.onBrand}, ${mapleTwilightScheme.onBrand})`,
        radius: 'xs',
      },
    },
    // Inputs and selects default to 8px radius
    Input: {
      defaultProps: {
        radius: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Select: {
      defaultProps: {
        radius: 'sm',
      },
    },
    NativeSelect: {
      defaultProps: {
        radius: 'sm',
      },
    },
    // Outer panels and cards default to 12px radius
    Card: {
      defaultProps: {
        radius: 'md',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
      },
    },
    Drawer: {
      defaultProps: {
        radius: 'md',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
  // MapleTip warm focus ring class
  focusClassName: 'mapletip-focus',
  variantColorResolver,
});

function schemeVariables(scheme: SchemeColors): Record<string, string> {
  return {
    '--mantine-color-anchor': scheme.link,
    '--mantine-color-error': scheme.statuses.danger,
    '--pagination-active-color': scheme.onBrand,
    '--mapletip-color-canvas': scheme.canvas,
    '--mapletip-color-panel': scheme.panel,
    '--mapletip-color-raised': scheme.raised,
    '--mapletip-color-rail': scheme.rail,
    '--mapletip-color-border-subtle': scheme.borderSubtle,
    '--mapletip-color-border-strong': scheme.borderStrong,
    '--mapletip-color-ink': scheme.textPrimary,
    '--mapletip-color-muted': scheme.textSecondary,
    '--mapletip-color-hover': scheme.hover,
    '--mapletip-color-brand': scheme.brand,
    '--mapletip-color-brand-text': scheme.brandText,
    '--mapletip-color-brand-wash': scheme.brandWash,
    '--mapletip-color-on-brand': scheme.onBrand,
    '--mapletip-color-selection': scheme.selection,
    '--mapletip-color-selection-edge': scheme.selectionEdge,
    '--mapletip-color-soft': scheme.soft,
    '--mapletip-color-focus': scheme.focus,
    '--mapletip-color-focus-gap': scheme.focusGap,
    '--mapletip-color-link': scheme.link,
    '--mapletip-color-cta': scheme.cta.background,
    '--mapletip-color-cta-fg': scheme.cta.foreground,
    '--mapletip-color-cta-hover': scheme.cta.hover,
    '--mapletip-color-cta-border': scheme.cta.border,
    '--mapletip-color-status-success': scheme.statuses.success,
    '--mapletip-color-status-success-bg': scheme.statuses.successBg,
    '--mapletip-color-status-warning': scheme.statuses.warning,
    '--mapletip-color-status-warning-bg': scheme.statuses.warningBg,
    '--mapletip-color-status-danger': scheme.statuses.danger,
    '--mapletip-color-status-danger-bg': scheme.statuses.dangerBg,
    '--mapletip-color-status-info': scheme.statuses.info,
    '--mapletip-color-status-info-bg': scheme.statuses.infoBg,
    '--mapletip-color-disabled-bg': scheme.disabled.bg,
    '--mapletip-color-disabled-fg': scheme.disabled.fg,
    // Accent compatibility aliases
    '--mapletip-color-accent-forest': scheme.statuses.success,
    '--mapletip-color-accent-sky': scheme.statuses.info,
    '--mapletip-color-accent-gold': scheme.statuses.warning,
    '--mapletip-color-accent-danger': scheme.statuses.danger,
  };
}

/**
 * Resolves scheme-specific CSS variables derived from canonical tokens.
 */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    ...schemeVariables(porcelainScheme),
    '--mantine-color-body': porcelainScheme.canvas,
  },
  dark: {
    ...schemeVariables(mapleTwilightScheme),
    '--mantine-color-body': mapleTwilightScheme.canvas,
  },
});
