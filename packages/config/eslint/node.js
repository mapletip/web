import globals from 'globals';

import { base } from './base.js';

/**
 * Node.js packages. Consumers extend via array spread:
 * `export default [...node(import.meta.dirname), overrides]`.
 *
 * @param {string} tsconfigRootDir usually `import.meta.dirname`
 */
export function node(tsconfigRootDir) {
  return base(tsconfigRootDir, [
    { languageOptions: { globals: { ...globals.node } } },
  ]);
}
