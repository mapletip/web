import {
  createTheme,
  defaultVariantColorsResolver,
  type CSSVariablesResolver,
  type MantineThemeOverride,
  type VariantColorsResolver,
} from '@mantine/core';

import {
  maple,
  parchment,
  parchmentScheme,
  twilight,
  twilightScheme,
  type SchemeColors,
} from './colors';

/**
 * Filled primary actions need the opposite label colour in each scheme: the dark
 * scheme's primary shade is light orange, the light scheme's is dark orange.
 * `light-dark()` resolves from Mantine's `color-scheme`, so the label is decided
 * by the rendered scheme instead of Mantine's luminance heuristic.
 */
const variantColorResolver: VariantColorsResolver = (input) => {
  const resolved = defaultVariantColorsResolver(input);
  const isPrimaryFilled =
    input.variant === 'filled' &&
    (input.color ?? input.theme.primaryColor) === input.theme.primaryColor;

  if (!isPrimaryFilled) return resolved;

  return {
    ...resolved,
    color: `light-dark(${parchmentScheme.filledActionText}, ${twilightScheme.filledActionText})`,
  };
};

/**
 * The shared MapleTip Mantine theme: Maple Twilight (dark) and Parchment (light).
 *
 * The forest/sky/grape/gold/danger accents are semantic CSS variables, not full
 * Mantine scales, because no shipped component needs shade variants yet.
 */
export const theme: MantineThemeOverride = createTheme({
  primaryColor: 'maple',
  primaryShade: { light: 7, dark: 4 },
  colors: {
    maple,
    dark: twilight,
    gray: parchment,
  },
  white: parchmentScheme.panel,
  black: parchmentScheme.textPrimary,
  defaultRadius: 'md',
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
  // Inline links must not rely on colour alone (WCAG 1.4.1): the link role is
  // lighter than primary text in the dark scheme.
  components: {
    Anchor: { defaultProps: { underline: 'always' } },
    // Mantine's Badge falls back to white label text when neither `color` nor
    // `variant` is passed, bypassing `variantColorResolver`. Declaring the
    // default variant keeps the resolved, scheme-aware label.
    Badge: { defaultProps: { variant: 'filled' } },
    // Mantine's Checkbox icon uses a scheme-agnostic contrast heuristic, which
    // leaves a white tick on the dark scheme's light primary shade.
    Checkbox: {
      defaultProps: {
        iconColor: `light-dark(${parchmentScheme.filledActionText}, ${twilightScheme.filledActionText})`,
      },
    },
  },
  // Replaces Mantine's primary-coloured outline with the scheme's focus ring,
  // which stays perceptible around filled orange actions.
  focusClassName: 'mapletip-focus',
  variantColorResolver,
});

function schemeVariables(scheme: SchemeColors): Record<string, string> {
  return {
    '--mantine-color-anchor': scheme.link,
    '--mantine-color-error': scheme.accents.danger,
    // Mantine's Pagination falls back to white here instead of the variant
    // resolver, which does not meet contrast on the dark primary shade.
    '--pagination-active-color': scheme.filledActionText,
    '--mapletip-color-focus': scheme.focus,
    '--mapletip-color-border-subtle': scheme.borderSubtle,
    '--mapletip-color-accent-forest': scheme.accents.forest,
    '--mapletip-color-accent-sky': scheme.accents.sky,
    '--mapletip-color-accent-grape': scheme.accents.grape,
    '--mapletip-color-accent-gold': scheme.accents.gold,
    '--mapletip-color-accent-danger': scheme.accents.danger,
  };
}

/**
 * Adds only the scheme-specific roles Mantine cannot express through its own
 * variables: the parchment canvas, link colour, focus ring, decorative border
 * and the limited accent roles.
 */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    ...schemeVariables(parchmentScheme),
    '--mantine-color-body': parchmentScheme.canvas,
  },
  dark: schemeVariables(twilightScheme),
});
