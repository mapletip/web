import { react } from '@mapletip/config/eslint/react';
import vitestRules from '@mapletip/config/eslint/vitest';

export default [
  ...react(import.meta.dirname),
  ...vitestRules,
  { ignores: ['storybook-static/**', 'postcss.config.cjs'] },
];
