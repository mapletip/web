import { browser } from '@mapletip/config/vitest/browser';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import type { Page } from 'playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';

const emulateMedia: BrowserCommand<
  [options: Parameters<Page['emulateMedia']>[0]]
> = async (context, options) => {
  await (context as unknown as { page: Page }).page.emulateMedia(options);
};

export default mergeConfig(
  browser(),
  defineConfig({
    // Pre-bundle everything tests import so Vite never re-optimises (and reloads)
    // mid-run, which otherwise surfaces as a duplicate-React "useState of null" error
    // on a cold cache.
    optimizeDeps: {
      include: [
        'ag-grid-community',
        'ag-grid-react',
        'mantine-datatable',
        'react-dom/client',
        'react-dom/server',
        '@tanstack/react-table',
      ],
    },
    test: {
      browser: {
        commands: {
          // Playwright media emulation (forced colors, reduced motion) is not part of
          // vitest's `page` API; expose just the one Playwright call tests need.
          emulateMedia,
        },
      },
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            include: ['src/**/*.test.{ts,tsx}'],
            exclude: ['src/**/*.ssr.test.{ts,tsx}'],
          },
        },
        {
          // Real server rendering: plain Node, no DOM, so browser-only APIs fail loudly.
          extends: false,
          plugins: [react()],
          test: {
            name: 'ssr',
            environment: 'node',
            include: ['src/**/*.ssr.test.{ts,tsx}'],
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(import.meta.dirname, '.storybook'),
              storybookScript: 'pnpm storybook',
            }),
          ],
          test: {
            name: 'storybook',
          },
        },
      ],
    },
  }),
);
