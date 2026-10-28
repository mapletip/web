import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { defineConfig } from 'playwright/test';

const require = createRequire(import.meta.url);
const configDirectory = import.meta.dirname;
const storybookStaticDirectory = path.join(configDirectory, 'storybook-static');
const port = 6106;

/**
 * Vite's CLI resolved from this config instead of `PATH`, so the same command
 * runs under `pnpm run` and inside the pinned Playwright container, where only
 * the mounted `node_modules` is guaranteed to exist.
 */
const viteCli = path.join(
  path.dirname(require.resolve('vite/package.json')),
  'bin/vite.js',
);

if (!existsSync(path.join(storybookStaticDirectory, 'iframe.html'))) {
  throw new Error(
    'Visual regression tests serve the built Storybook. Run ' +
      '`pnpm build-storybook` (or download the CI `storybook` artifact) first.',
  );
}

/**
 * Approved baselines are reviewed artifacts, so CI must never write them.
 * Playwright already refuses to create missing snapshots when `CI` is set; this
 * second guard also rejects an explicit update flag, so a workflow edit cannot
 * silently turn the visual job into an approval step.
 */
if (
  process.env['CI'] !== undefined &&
  process.argv.some(
    (argument) =>
      argument === '-u' || argument.startsWith('--update-snapshots'),
  )
) {
  throw new Error('Refusing to update visual regression baselines in CI.');
}

export default defineConfig({
  testDir: './visual',
  outputDir: './visual-results',
  /**
   * Only approved baselines live here. `{platform}` keeps host-generated
   * references from overwriting the authoritative Linux set; CI compares
   * `*-linux.png` exclusively.
   */
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{platform}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  /*
   * Approved baselines are only rewritten through an explicit, reviewed update
   * run (`--update-snapshots=all`, see scripts/visual-regression.sh). Relying on
   * Playwright's CI autodetection alone is not enough: plain `CI=true` does not
   * always suppress writes. With `none`, an ordinary run can never create or
   * accept a baseline - a missing file is a failure.
   */
  updateSnapshots: 'none',
  /*
   * A visual mismatch is reported, never retried into a pass: instability must
   * stay visible instead of being absorbed by reruns.
   */
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'visual-report' }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${String(port)}`,
    browserName: 'chromium',
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
    headless: true,
    trace: 'off',
  },
  expect: {
    /**
     * Upstream Playwright defaults are deliberate: a per-pixel YIQ threshold of
     * 0.2 with no diff-pixel allowance, so any visibly different pixel fails.
     * Add no masks or widened tolerances here; stabilize the story instead.
     */
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      /* Scrollbar chrome only; see visual/screenshot.css. */
      stylePath: './visual/screenshot.css',
    },
  },
  webServer: {
    /**
     * `vite preview` is already installed and serves the same `storybook-static`
     * build the CI `validate` job uploads, so no bespoke static server is added.
     * `--strictPort` and `reuseExistingServer: false` fail loudly instead of
     * silently screenshotting a stale build.
     */
    command: `"${process.execPath}" "${viteCli}" preview --outDir ${path.basename(storybookStaticDirectory)} --port ${String(port)} --strictPort --host 127.0.0.1`,
    cwd: configDirectory,
    url: `http://127.0.0.1:${String(port)}/iframe.html`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
