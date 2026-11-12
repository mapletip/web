import type { Page } from '@playwright/test';

import { MonsterDrops, MonsterFilters, MonsterResults } from './components';

export class MonsterPage {
  readonly results: MonsterResults;
  readonly filters: MonsterFilters;
  readonly drops: MonsterDrops;

  constructor(readonly page: Page) {
    this.results = new MonsterResults(page);
    this.filters = new MonsterFilters(page);
    this.drops = new MonsterDrops(page, this.results);
  }

  heading(name?: string) {
    return name === undefined
      ? this.page.getByRole('heading', { level: 1 })
      : this.page.getByRole('heading', { name });
  }

  async goto(path = '/maplestory/monsters'): Promise<void> {
    await this.page.goto(path);
    await this.ready();
  }

  /** Wait for the server-rendered page to attach React event handlers. */
  async ready(): Promise<void> {
    await this.page.waitForFunction(() => {
      const main = document.querySelector('main');
      return (
        main !== null &&
        Object.keys(main).some((key) => key.startsWith('__reactProps'))
      );
    });
  }

  /** Wait for visible screenshot content and fonts to settle. */
  async captureReady(): Promise<void> {
    await this.ready();
    await this.page.evaluate(async () => {
      await document.fonts.ready;
    });
    await this.page.waitForFunction(() =>
      [...document.images]
        .filter((image) => {
          const bounds = image.getBoundingClientRect();
          return (
            bounds.width > 0 &&
            bounds.height > 0 &&
            bounds.top < window.innerHeight &&
            bounds.bottom > 0 &&
            bounds.left < window.innerWidth &&
            bounds.right > 0
          );
        })
        .every((image) => image.complete),
    );
    await this.page.evaluate(() => localStorage.clear());
  }
}
