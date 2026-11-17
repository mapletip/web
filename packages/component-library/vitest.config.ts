import { browser } from '@mapletip/config/vitest/browser';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import process from 'node:process';
import type { Page } from 'playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';

/**
 * Approved visual baselines are reviewed artifacts. The visual command already
 * passes `--update=none`; this guard rejects any other update flag in CI, so a
 * workflow edit cannot turn the job into an approval step.
 */
if (
  process.env['CI'] !== undefined &&
  process.argv.some(
    (argument) => argument === '-u' || /^--update(?!\.|=none)/u.test(argument),
  )
) {
  throw new Error('Refusing to update visual regression baselines in CI.');
}

type EmulateMediaOptions = Parameters<Page['emulateMedia']>[0];
interface DragPointerOptions {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
}
interface PinchAtOptions {
  readonly x: number;
  readonly y: number;
  readonly startDistance: number;
  readonly endDistance: number;
}

// Custom browser commands run on the Node/Playwright side of the browser test
// server, which the in-page test context cannot reach. Declare the call-site
// types beside the registered handlers; Vitest augments this interface by design.
declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateMedia(options: EmulateMediaOptions): Promise<void>;
    movePointer(x: number, y: number): Promise<void>;
    dragPointer(options: DragPointerOptions): Promise<void>;
    wheelAt(x: number, y: number, deltaY: number): Promise<void>;
    pinchAt(options: PinchAtOptions): Promise<void>;
  }
}

const emulateMedia: BrowserCommand<[options: EmulateMediaOptions]> = async (
  context,
  options,
) => {
  const { page } = context as unknown as { page: Page };
  await page.emulateMedia(options);
};

const movePointer: BrowserCommand<[x: number, y: number]> = async (
  context,
  x,
  y,
) => {
  const { page } = context as unknown as { page: Page };
  await page.mouse.move(x, y);
};

const dragPointer: BrowserCommand<[options: DragPointerOptions]> = async (
  context,
  { startX, startY, endX, endY },
) => {
  const { page } = context as unknown as { page: Page };
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();
};

const wheelAt: BrowserCommand<[x: number, y: number, deltaY: number]> = async (
  context,
  x,
  y,
  deltaY,
) => {
  const { page } = context as unknown as { page: Page };
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, deltaY);
};

const pinchAt: BrowserCommand<[options: PinchAtOptions]> = async (
  context,
  { x, y, startDistance, endDistance },
) => {
  const { page } = context as unknown as { page: Page };
  const session = await page.context().newCDPSession(page);
  const touchPoints = (distance: number) => [
    { id: 1, x: x - distance / 2, y },
    { id: 2, x: x + distance / 2, y },
  ];

  // Dispatch touch input directly so the shared page's emulation stays unchanged.
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: touchPoints(startDistance),
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: touchPoints(endDistance),
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
  } finally {
    await session.detach();
  }
};

const browserCommands = {
  emulateMedia,
  movePointer,
  dragPointer,
  wheelAt,
  pinchAt,
};

/**
 * Projects are split by the boundary a test exercises, not by fashion:
 *
 * - `unit`      Node, no DOM: pure algorithms, range membership, comparisons.
 * - `component` jsdom + RTL: React rendering, state and semantic interaction.
 * - `browser`   real Chromium: layout, focus, portals, scrolling, storage.
 * - `ssr`       Node: renders without browser globals.
 * - `storybook` story documentation and play interactions.
 * - `visual`    approved screenshot baselines.
 *
 * Each project composes the shared Vitest/Browser factory it needs rather than
 * depending on a root project being in browser mode.
 */
const sourceAlias = { '@': path.join(import.meta.dirname, 'src') };

function nodeProject(name: string, include: string[]) {
  return {
    extends: false,
    plugins: [react()],
    resolve: { alias: sourceAlias },
    test: { name, environment: 'node', include },
  };
}

function browserProject(name: string, options: Record<string, unknown>) {
  return mergeConfig(
    browser(),
    defineConfig({
      resolve: { alias: sourceAlias },
      test: { name, ...options },
    }),
  );
}

export default defineConfig({
  // Pre-bundle everything tests import so Vite never re-optimises (and reloads)
  // mid-run, which otherwise surfaces as a duplicate-React error.
  optimizeDeps: {
    include: [
      '@mantine/core',
      '@mantine/hooks',
      '@tanstack/react-table',
      'react-dom/client',
      'react-dom/server',
      'vitest-browser-react',
    ],
  },
  test: {
    projects: [
      nodeProject('unit', ['src/**/__tests__/**/*.test.ts']),
      {
        extends: false,
        plugins: [react()],
        resolve: { alias: sourceAlias },
        test: {
          name: 'component',
          environment: 'jsdom',
          globals: true,
          include: ['src/**/__tests__/**/*.test.tsx'],
          exclude: [
            'src/**/__tests__/**/*.browser.test.tsx',
            'src/**/__tests__/**/*.ssr.test.tsx',
            'src/**/__tests__/**/*.visual.test.tsx',
          ],
          setupFiles: [
            path.join(import.meta.dirname, 'src/test-support/jsdom.setup.ts'),
          ],
        },
      },
      browserProject('browser', {
        include: ['src/**/__tests__/**/*.browser.test.{ts,tsx}'],
        browser: { commands: browserCommands },
      }),
      nodeProject('ssr', ['src/**/__tests__/**/*.ssr.test.tsx']),
      mergeConfig(
        browserProject('storybook', { browser: { commands: browserCommands } }),
        defineConfig({
          plugins: [
            storybookTest({
              configDir: path.join(import.meta.dirname, '.storybook'),
              storybookScript: 'pnpm storybook',
            }),
          ],
        }),
      ),
      // Opt-in screenshot comparisons: `pnpm test` runs `--project '!visual'`,
      // `test:visual` runs `--project visual`. Visual tests are component tests,
      // so they are discovered beside each component's other tests. Not a
      // Storybook test project, so it never starts the Storybook server.
      browserProject('visual', {
        include: ['src/**/__tests__/**/*.visual.test.tsx'],
        setupFiles: ['.storybook/visual.setup.ts'],
        browser: {
          commands: browserCommands,
          viewport: { width: 1366, height: 768 },
        },
      }),
    ],
  },
});
