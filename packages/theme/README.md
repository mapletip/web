# `@mapletip/theme`

MapleTip ships one color scheme: **Maple Twilight**, a dark theme backed by Mantine. The
package owns the canonical palettes, semantic roles, CSS variable resolver and intentional
Mantine component defaults. It does not provide a runtime theme toggle or light palette.

## Brand foundations

- **Surfaces and text:** deep neutral canvas, panel and raised roles with warm off-white
  primary text and readable secondary text.
- **Brand and links:** luminous Maple amber identifies the brand and interactive links.
- **Primary actions:** Walnut Glow separates filled actions from brand accents.
- **Selection and focus:** selected rows use a distinct warm surface; keyboard focus uses
  the Maple Twilight focus token and remains visible against controls and panels.
- **Statuses:** success, warning, danger and information roles pair text with a tinted
  background and meet the theme's contrast contract.
- **Typography and density:** system sans-serif; 28/36 page headings, 24/32 entity headings,
  20/28 section headings, 16/24 reading text, 14/20 interface text and 12/16 metadata.
- **Shape:** 8px control radius and 12px panel/card radius.

## Getting started

```tsx
import '@mapletip/component-library/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';

// Render once in the document shell before first paint.
<ColorSchemeScript defaultColorScheme="dark" />;

<MantineProvider
  theme={theme}
  cssVariablesResolver={cssVariablesResolver}
  defaultColorScheme="dark"
  forceColorScheme="dark"
>
  <App />
</MantineProvider>;
```

Hosts must force the dark scheme so first paint, server rendering and hydrated UI all use
Maple Twilight. The package has no React provider; scheme ownership remains with the host.
Consumers that do not use the component library should import
`@mapletip/theme/theme.css` after Mantine's stylesheets.

All color roles, contrast guarantees and theme typography values are verified by package
tests.
