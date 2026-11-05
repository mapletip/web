import { react } from '@mapletip/config/eslint/react';

export default [
  ...react(import.meta.dirname),
  { ignores: ['.output/**', 'src/routeTree.gen.ts'] },
];
