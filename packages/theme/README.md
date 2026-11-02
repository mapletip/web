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
UI agree. Without the component library, import `@mapletip/theme/theme.css` after Mantine's
stylesheets; `@mapletip/component-library/styles.css` already does that.
