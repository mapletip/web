import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

if (
  process.env['CI'] &&
  process.argv.some((argument) => argument.startsWith('--update-snapshots'))
) {
  throw new Error(
    'CI compares committed web visual baselines and cannot update them.',
  );
}

const wsEndpoint = process.env['PLAYWRIGHT_WS_ENDPOINT'];
const appDir = fileURLToPath(new URL('.', import.meta.url));
const use = {
  baseURL: 'http://127.0.0.1:4173',
  ...(wsEndpoint === undefined ? {} : { connectOptions: { wsEndpoint } }),
  contextOptions: { reducedMotion: 'reduce' as const },
  trace: 'on-first-retry' as const,
  video: 'off' as const,
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  ...(process.env['CI'] ? { workers: 2 } : {}),
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  updateSnapshots: process.env['CI'] ? 'none' : 'missing',
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      stylePath: fileURLToPath(
        new URL('./e2e/support/visual.css', import.meta.url),
      ),
    },
  },
  use,
  projects: [
    {
      name: 'desktop',
      testMatch: ['**/*.desktop.spec.ts', '**/*.routing.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        ...use,
        browserName: 'chromium',
        viewport: { width: 1366, height: 900 },
      },
    },
    {
      name: 'mobile',
      testMatch: '**/*.mobile.spec.ts',
      use: {
        ...devices['iPhone 13'],
        ...use,
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'visual',
      testMatch: '**/*.visual.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        ...use,
        browserName: 'chromium',
      },
    },
  ],
  webServer: [
    {
      command: 'HOST=127.0.0.1 PORT=4173 node .output-msw/server/index.mjs',
      cwd: appDir,
      url: 'http://127.0.0.1:4173/api/healthz',
      reuseExistingServer: !process.env['CI'],
      timeout: 30_000,
    },
    {
      command:
        'HOST=127.0.0.1 PORT=4174 MOCK_ORIGIN=failing node .output-msw/server/index.mjs',
      cwd: appDir,
      url: 'http://127.0.0.1:4174/api/healthz',
      reuseExistingServer: !process.env['CI'],
      timeout: 30_000,
    },
  ],
});
