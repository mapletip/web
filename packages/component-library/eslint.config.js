import { react } from '@mapletip/config/eslint/react';
import vitestRules from '@mapletip/config/eslint/vitest';

export default [
  ...react(import.meta.dirname),
  ...vitestRules,
  { ignores: ['storybook-static/**', 'postcss.config.cjs'] },
  {
    // Visual tests assert through the shared capture helper, which compares the
    // screenshot; the rule cannot see through it.
    files: ['src/**/__tests__/**/*.visual.test.{ts,tsx}'],
    rules: {
      'vitest/expect-expect': [
        'error',
        { assertFunctionNames: ['expectApprovedScreenshot'] },
      ],
    },
  },
];
