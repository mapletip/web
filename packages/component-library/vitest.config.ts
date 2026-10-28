import { browser } from '@mapletip/config/vitest/browser';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import type { Page } from 'playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';

type EmulateMediaOptions = Parameters<Page['emulateMedia']>[0];

// Custom browser commands run on the Node/Playwright side of the browser test
// server, which the in-page test context cannot reach. Declare the call-site
// types beside the registered handlers; Vitest augments this interface by design.
declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateMedia(options: EmulateMediaOptions): Promise<void>;
  }
}

const emulateMedia: BrowserCommand<[options: EmulateMediaOptions]> = async (
  context,
  options,
) => {
  await (context as unknown as { page: Page }).page.emulateMedia(options);
};

export default mergeConfig(
  browser(),
  defineConfig({
    resolve: {
      alias: {
        '@': path.join(import.meta.dirname, 'src'),
      },
    },
    // Pre-bundle everything tests import so Vite never re-optimises (and reloads)
    // mid-run, which otherwise surfaces as a duplicate-React "useState of null" error
    // on a cold cache.
    optimizeDeps: {
      include: [
        '@mantine/core',
        '@tanstack/react-table',
        'react-dom/client',
        'react-dom/server',
        'vitest-browser-react',
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
            include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
            exclude: ['src/**/__tests__/**/*.ssr.test.{ts,tsx}'],
          },
        },
        {
          // Real server rendering: plain Node, no DOM, so browser-only APIs fail loudly.
          extends: false,
          plugins: [react()],
          resolve: {
            alias: {
              '@': path.join(import.meta.dirname, 'src'),
            },
          },
          test: {
            name: 'ssr',
            environment: 'node',
            include: ['src/**/__tests__/**/*.ssr.test.{ts,tsx}'],
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
