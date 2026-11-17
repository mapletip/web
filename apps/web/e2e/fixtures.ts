import { expect, test as base } from '@playwright/test';

import { spriteResponse } from '../src/mocks/sprites';

interface Fixtures {
  readonly escapedDataRequests: string[];
}

export const test = base.extend<Fixtures>({
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
});

export { expect };
