# `@mapletip/theme`

MapleTip's single Mantine theme: **Maple Twilight** (dark, default) and **Parchment**
(light).

```ts
import '@mapletip/component-library/styles.css';
import {
  ColorSchemeScript,
  localStorageColorSchemeManager,
  MantineProvider,
} from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';

// Server document shell, before first paint.
<ColorSchemeScript defaultColorScheme="dark" />;

// Root provider (client or server render).
<MantineProvider
  theme={theme}
  cssVariablesResolver={cssVariablesResolver}
  defaultColorScheme="dark"
  colorSchemeManager={localStorageColorSchemeManager()}
>
  <App />
</MantineProvider>;
```

`ColorSchemeScript` and `localStorageColorSchemeManager` use the same
`mantine-color-scheme-value` key, so a saved explicit choice wins over the dark default
and `auto` follows the operating system. The theme package itself has no DOM or React
provider; color-scheme persistence belongs to the host.

`@mapletip/component-library/styles.css` imports `@mapletip/theme/theme.css` after the
Mantine and Mantine DataTable stylesheets. That stylesheet provides the shared focus ring,
plain-link styling, DataTable border variables and reduced-motion handling. If a host does
not use the component library stylesheet, import `@mapletip/theme/theme.css` itself.

## What the theme owns

- The warm `maple` primary palette and `primaryShade: { dark: 4, light: 7 }`.
- Twilight charcoal and Parchment neutral palettes, mapped onto Mantine's `dark` and
  `gray` colour roles so components and Mantine DataTable inherit them.
- Scheme-specific semantic variables Mantine cannot derive:
  `--mantine-color-body` (Parchment canvas only), `--mantine-color-anchor`,
  `--mantine-color-error`, `--pagination-active-color`, `--mapletip-color-focus`,
  `--mapletip-color-border-subtle`, and the forest/sky/grape/gold/danger accents.
- Deliberate Mantine defaults: underlined anchors, a scheme-aware filled primary label,
  and a readable checked-checkbox icon. No per-component styling layer.

## Accessibility contract

Contrast pairs are asserted in `src/__tests__/theme.test.ts` (normal text at least
4.5:1, essential boundaries and focus at least 3:1). Three Mantine 9.7.3 defaults that
bypass its contrast resolver are compensated for and documented in `theme.ts`: a `Badge`
without `variant`/`color`, the active `Pagination` label, and the `Checkbox` icon. The decorative
`--mapletip-color-border-subtle` is intentionally below 3:1 and must not be used for a
required control boundary. Focus uses a two-pixel ring offset from the control, so it is
verified against the surrounding surface rather than directly against a filled orange
button. Component-level rendered states are verified in the component library's browser
tests.

## Deferred

The website application shell does not exist yet in this repository. Integrating the theme
into that shell, including its actual first-paint document, is deferred until the
application exists; this package only documents and tests the contract.
