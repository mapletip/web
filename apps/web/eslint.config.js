import { react } from '@mapletip/config/eslint/react';

export default [
  ...react(import.meta.dirname),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: ['./tsconfig.typecheck.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  { ignores: ['src/routeTree.gen.ts', 'postcss.config.cjs'] },
];
