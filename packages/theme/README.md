# `@mapletip/theme`

MapleTip's approved brand & experience design system theme: **Graphite** (dark, default)
and **Clear Porcelain** (light), backed by Mantine.

## Approved Brand Foundations (v7)

- **Foundations**: Clear Porcelain light canvas (`#FAFAFB`), white panels (`#FFFFFF`), and Graphite dark foundation (`#111114` canvas, `#1A1A1D` panels).
- **Primary CTA**: Walnut Glow filled action (`#3D332C` light, `#514039` dark with `#8F7665` border), separate from brand accents.
- **Brand Accent**: Classic Maple orange (`#DD9554` light, `#EBA85F` dark).
- **Selection**: Classic Maple Glow (`#FFF2E2` light, `#4D382B` dark) with distinct edge markers.
- **Links & Keyboard Focus**: Maple Orange link (`#A34C16` light, `#F6BE90` dark) and warm focus ring (`#B45B22` light, `#F4AD70` dark) with a 2px offset and `focusGap` separation.
- **Statuses**: Clear Signals semantic status roles (success, warning, danger, info) meeting WCAG AA >= 4.5:1.
- **Typography**: Productive system sans-serif hierarchy (14px/20px UI & data with tabular figures, 16px/24px reading, 12px/16px metadata, 28/36px headings).
- **Density & Shape**: Balanced-compact density (44–48px rows, 40–44px controls), ~8px control radius, ~12px panel/card radius.

## Getting Started

```ts
import '@mapletip/component-library/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';

// Render once in the document shell before first paint (host responsibility)
<ColorSchemeScript defaultColorScheme="dark" />;

<MantineProvider
  theme={theme}
  cssVariablesResolver={cssVariablesResolver}
  defaultColorScheme="dark"
>
  <App />
</MantineProvider>;
```

The package owns canonical palettes, semantic color roles, CSS variables resolver, and intentional Mantine
component defaults. It has no React provider: color-scheme persistence and SSR scripts
remain host responsibilities. `@mapletip/component-library/styles.css` imports the
theme's global stylesheet; consumers that do not use the component library should import
`@mapletip/theme/theme.css` after Mantine's stylesheets.

All tokens and contrast guarantees are verified by package tests.
