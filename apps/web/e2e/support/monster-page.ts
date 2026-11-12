import type { Page } from '@playwright/test';

import { MonsterCards } from './components/monster-cards';
import { MonsterDrops } from './components/monster-drops';
import {
  MonsterFilterCollection,
  QuickFilters,
} from './components/monster-filters';
import { MonsterPagination } from './components/monster-pagination';
import { MonsterTable } from './components/monster-table';

export class MonsterPage {
  readonly table: MonsterTable;
  readonly cards: MonsterCards;
  readonly filters: MonsterFilterCollection;
  readonly quickFilters: QuickFilters;
  readonly drops: MonsterDrops;
  readonly pagination: MonsterPagination;

  constructor(readonly page: Page) {
    this.table = new MonsterTable(page);
    this.cards = new MonsterCards(page);
    this.filters = new MonsterFilterCollection(page);
    this.quickFilters = new QuickFilters(page);
    this.drops = new MonsterDrops(page, this.table, this.cards);
    this.pagination = new MonsterPagination(page);
  }

  get summary() {
    return this.page.getByText(/^\d+ Monsters?$/u).first();
  }

  get search() {
    return this.page.getByRole('textbox', {
      name: 'Search Classic World monsters',
    });
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
