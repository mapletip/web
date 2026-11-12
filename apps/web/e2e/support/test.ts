import { expect, test as base, type Page } from '@playwright/test';

import { spriteResponse } from '../../src/mocks/sprites';

// Playwright's fixture callback is named `use`; it is not a React hook.
/* eslint react-hooks/rules-of-hooks: off */
/* Playwright also requires destructuring for fixtures with no dependencies. */
/* eslint no-empty-pattern: off */

interface ExpectedBrowserErrors {
  readonly console: RegExp[];
  readonly page: RegExp[];
}

interface Fixtures {
  readonly artifactRequests: string[];
  readonly expectedArtifactRequests: RegExp[];
  readonly escapedDataRequests: string[];
  readonly expectedBrowserErrors: ExpectedBrowserErrors;
}

export const test = base.extend<Fixtures>({
  artifactRequests: async ({}, use) => {
    await use([]);
  },
  expectedArtifactRequests: async ({}, use) => {
    await use([]);
  },
  escapedDataRequests: [
    async ({ context }, use) => {
      const requests: string[] = [];
      await context.route('https://d0.mapletip.com/**', async (route) => {
        const url = new URL(route.request().url());
        const sprite =
          /\/media\/images\/[a-f0-9]{2}\/([a-f0-9]{64})\.png$/u.exec(
            url.pathname,
          );
        if (sprite?.[1] !== undefined) {
          const response = spriteResponse(sprite[1]);
          await route.fulfill({
            status: response.status,
            contentType: response.contentType,
            body: response.body,
          });
          return;
        }
        requests.push(url.href);
        await route.abort();
      });
      await use(requests);
      expect(
        requests,
        `Unexpected request escaped mock mode: ${requests.join(', ')}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
  expectedBrowserErrors: async ({}, use) => {
    await use({
      console: [
        /Failed to load resource: the server responded with a status of 404/u,
      ],
      page: [],
    });
  },
  page: async (
    { page, artifactRequests, expectedArtifactRequests, expectedBrowserErrors },
    use,
  ) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (
        url.origin === 'https://d0.mapletip.com' &&
        !url.pathname.startsWith('/media/')
      ) {
        artifactRequests.push(url.pathname);
      }
    });
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await use(page);
    const unexpectedConsole = consoleErrors.filter(
      (message) =>
        !expectedBrowserErrors.console.some((pattern) => pattern.test(message)),
    );
    const unexpectedPage = pageErrors.filter(
      (message) =>
        !expectedBrowserErrors.page.some((pattern) => pattern.test(message)),
    );
    const unexpectedArtifacts = artifactRequests.filter(
      (path) => !expectedArtifactRequests.some((pattern) => pattern.test(path)),
    );
    expect(unexpectedConsole, 'Unexpected browser console errors').toEqual([]);
    expect(unexpectedPage, 'Unexpected uncaught page errors').toEqual([]);
    expect(
      unexpectedArtifacts,
      `Unexpected browser data artifact requests: ${unexpectedArtifacts.join(', ')}`,
    ).toEqual([]);
  },
});

export { expect };

/** Wait for the app's React hydration before using browser-side controls. */
export async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    return (
      main !== null &&
      Object.keys(main).some((key) => key.startsWith('__reactProps'))
    );
  });
}
