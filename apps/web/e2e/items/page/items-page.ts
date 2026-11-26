import type { Locator, Page } from '@playwright/test';

import { browseReady } from '../../browse-ready';

/** Accessible locators for the Items category frame. */
export class ItemsPage {
  constructor(readonly page: Page) {}

  heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  item(name: string): Locator {
    return this.page.getByRole('heading', { name, exact: true });
  }

  get summary(): Locator {
    return this.page.getByText(/^\d+ Items?$/u).first();
  }

  get rail(): Locator {
    return this.page.getByRole('navigation', { name: 'Item categories' });
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await browseReady(this.page);
    await this.page.waitForFunction(() => {
      const main = document.querySelector('main');
      return (
        main !== null &&
        Object.keys(main).some((key) => key.startsWith('__reactProps'))
      );
    });
  }
}
