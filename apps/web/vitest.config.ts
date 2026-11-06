import { react } from '@mapletip/config/vitest/react';
import { defineConfig, mergeConfig } from 'vitest/config';

/**
 * Projects by boundary:
 *
 * - `unit`      Node: pure transformations and the SDK loader.
 * - `component` jsdom + RTL: React rendering and semantic interaction.
 * - `ssr`       Node: renders the page and the route error boundary without browser globals.
 *
 * The pinned release itself is verified through the running application (SSR
 * routes, real browser) rather than a network-dependent test here.
 */
const nodeTests = mergeConfig(
  react(),
  defineConfig({
    test: {
      name: 'unit',
      environment: 'node',
      include: ['src/**/__tests__/**/*.test.ts'],
      exclude: ['src/**/__tests__/**/*.browser.test.ts'],
    },
  }),
);

const componentTests = mergeConfig(
  react(),
  defineConfig({
    test: {
      name: 'component',
      environment: 'jsdom',
      include: ['src/**/__tests__/**/*.test.tsx'],
      exclude: ['src/**/__tests__/**/*.ssr.test.tsx'],
      setupFiles: ['./vitest.setup.ts'],
    },
  }),
);

const ssrTests = mergeConfig(
  react(),
  defineConfig({
    test: {
      name: 'ssr',
      environment: 'node',
      include: ['src/**/__tests__/**/*.ssr.test.tsx'],
    },
  }),
);

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { projects: [nodeTests, componentTests, ssrTests] },
});
