import { react } from '@mapletip/config/eslint/react';

export default [
  ...react(import.meta.dirname),
  { ignores: ['src/routeTree.gen.ts', 'postcss.config.cjs'] },
];
