import reactPlugin from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Base factory for React + jsdom packages. A factory (not a shared object)
 * so each consumer gets fresh vite plugin instances — plugins hold per-build
 * state and must not be reused across concurrent builds. Extend via
 * `mergeConfig(react(), { test: { setupFiles: ['./setup.ts'] } })`.
 */
export function react() {
  return defineConfig({
    plugins: [reactPlugin()],
    test: {
      environment: 'jsdom',
    },
  });
}
