# `@mapletip/theme`

MapleTip's single color scheme, **Maple Twilight** (dark only): palettes, semantic roles, the
CSS variable resolver and Mantine component defaults. It ships no runtime toggle and no light
palette.

## Usage

```tsx
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';

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

Hosts own scheme ownership and must force dark, so first paint, server rendering and hydrated
UI agree. Without the component library, import `@mantine/core/styles.layer.css` and then
`@mapletip/theme/theme.css`. That file declares its own layer order, so the import order does
not matter, but Mantine must come from its layer variant or its unlayered rules would win.
