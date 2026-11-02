import { setProjectAnnotations } from '@storybook/react-vite';
import { beforeAll } from 'vitest';

import preview from './preview';

/**
 * Shared visual-test setup. Registers the real preview annotations once
 * (decorators, MantineProvider, theme, globals), so component visual tests only
 * compose their own stories. Storybook 10's `setProjectAnnotations()` returns the
 * composed annotations and requires no cleanup hook.
 */
setProjectAnnotations(preview);

/**
 * Deterministic page baseline for component screenshots. The stories use
 * Storybook's `fullscreen` layout, so the test document needs the same zero body
 * margin, and scrollbar chrome (which is browser UI, not component output) is
 * hidden so its overlay fade cannot make captures unstable. Mantine draws its
 * own overlay scrollbars inside scroll areas, so they are hidden as well: they
 * are transient chrome with the same timing problem, and the components under
 * test are what sits inside them. Carets are handled by the screenshot
 * `caret: 'hide'` option instead of styling.
 */
beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = `
    body { margin: 0; }
    html { scrollbar-width: none; }
    ::-webkit-scrollbar { display: none; }
    .mantine-ScrollArea-scrollbar { display: none !important; }
  `;
  document.head.append(style);
});
