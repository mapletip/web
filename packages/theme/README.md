# `@mapletip/theme`

MapleTip's shared Mantine theme: **Maple Twilight** (dark, default) and **Parchment**
(light).

```ts
import '@mapletip/component-library/styles.css';
import { MantineProvider } from '@mantine/core';
import { ColorSchemeScript, cssVariablesResolver, theme } from '@mapletip/theme';

// Render once in the document shell, before first paint.
<ColorSchemeScript defaultColorScheme="dark" />;

<MantineProvider
  theme={theme}
  cssVariablesResolver={cssVariablesResolver}
  defaultColorScheme="dark"
>
  <App />
</MantineProvider>;
```

The package owns the palettes, semantic color roles and the few intentional Mantine
component defaults. It has no React provider: color-scheme persistence and SSR scripts
remain host responsibilities. `@mapletip/component-library/styles.css` already imports the
theme's global stylesheet; consumers that do not use the component library should import
`@mapletip/theme/theme.css` after Mantine's stylesheets.

Contrast and scheme behavior are covered by the package tests.
