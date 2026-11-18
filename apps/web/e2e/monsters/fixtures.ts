import { expect, test as base } from '../fixtures';

import { MonsterPage } from './page/monster-page';

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
  readonly expectedBrowserErrors: ExpectedBrowserErrors;
  readonly monsterPage: MonsterPage;
}

export const test = base.extend<Fixtures>({
  monsterPage: async ({ page }, use) => {
    await use(new MonsterPage(page));
  },
  artifactRequests: async ({}, use) => {
    await use([]);
  },
  expectedArtifactRequests: async ({}, use) => {
    await use([]);
  },
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
