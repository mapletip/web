import reactPlugin from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * Base factory for React packages tested in a real browser (headless
 * Chromium via Playwright) instead of jsdom. A factory for the same reason
 * as vitest/react: each consumer gets fresh plugin and provider instances.
 * Requires the optional peers @vitest/browser-playwright and playwright.
 * Extend via `mergeConfig(browser(), { test: { include: [...] } })`.
 *
 * When PLAYWRIGHT_WS_ENDPOINT is set, connects to a remote Playwright
 * server (e.g. the official container) instead of launching a local
 * browser — for hosts that can't run Chromium natively.
 */
export function browser() {
  const wsEndpoint = process.env['PLAYWRIGHT_WS_ENDPOINT'];

  return defineConfig({
    plugins: [reactPlugin()],
    test: {
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(
          wsEndpoint ? { connectOptions: { wsEndpoint } } : {},
        ),
        instances: [{ browser: 'chromium' }],
      },
    },
  });
}
