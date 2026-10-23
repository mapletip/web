import pluginNext from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';

import { react } from './react.js';

/**
 * Next.js apps: the react layer plus Next's recommended + core-web-vitals
 * rules and react-hooks. Requires the optional peers of eslint/react plus
 * @next/eslint-plugin-next and eslint-plugin-react-hooks. Consumers extend
 * via array spread: `export default [...next(import.meta.dirname), overrides]`.
 *
 * @param {string} tsconfigRootDir usually `import.meta.dirname`
 */
export function next(tsconfigRootDir) {
  return [
    ...react(tsconfigRootDir),
    { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
    {
      plugins: { '@next/next': pluginNext },
      rules: {
        ...pluginNext.configs.recommended.rules,
        ...pluginNext.configs['core-web-vitals'].rules,
      },
    },
    reactHooks.configs.flat.recommended,
  ];
}
