import jsxA11y from 'eslint-plugin-jsx-a11y';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import { base } from './base.js';

/**
 * React (browser) packages. Requires the optional peers
 * eslint-plugin-react, eslint-plugin-react-hooks and eslint-plugin-jsx-a11y.
 * Consumers extend via
 * array spread: `export default [...react(import.meta.dirname), overrides]`.
 *
 * @param {string} tsconfigRootDir usually `import.meta.dirname`
 */
export function react(tsconfigRootDir) {
  return base(tsconfigRootDir, [
    reactHooks.configs.flat.recommended,
    jsxA11y.flatConfigs.strict,
    {
      languageOptions: {
        globals: { ...globals.node, ...globals.browser },
      },
    },
    {
      ...pluginReact.configs.flat['jsx-runtime'],
      settings: { react: { version: 'detect' } },
    },
  ]);
}
