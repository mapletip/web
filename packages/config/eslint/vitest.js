import vitest from '@vitest/eslint-plugin';

/**
 * Extra layer for test files; spread alongside a node/react factory's
 * result: `export default [...node(import.meta.dirname), ...vitestRules]`.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default [
  {
    files: ['**/*.test.{ts,tsx}'],
    ...vitest.configs.recommended,
  },
];
