import type { Locator, Page } from '@playwright/test';

import type { MonsterResults } from './monster-results';

/** Drop triggers and the desktop panel or mobile drawer they open. */
export class MonsterDrops {
  constructor(
    private readonly page: Page,
    private readonly results: MonsterResults,
  ) {}

  tableButton(name: string, count: number): Locator {
    return this.results.tableDropButton(name, count);
  }

  cardButton(name: string, count: number): Locator {
    return this.results.cardDropButton(name, count);
  }

  panel(name: string, count: number): Locator {
    return this.page.getByRole('region', { name: `${name} Drops (${count})` });
  }

  drawer(name: string): Locator {
    return this.page.getByRole('dialog', {
      name: new RegExp(escapeRegExp(name), 'u'),
    });
  }

  category(
    listing: Locator,
    name: string,
    level?: 1 | 2 | 3 | 4 | 5 | 6,
  ): Locator {
    return listing.getByRole('heading', {
      name,
      ...(level === undefined ? {} : { level }),
    });
  }

  itemSearch(listing: Locator): Locator {
    return listing.getByRole('textbox', { name: 'Search items' });
  }

  sourceButton(listing: Locator, item: string): Locator {
    return listing.getByRole('button', { name: `Sources for ${item}` });
  }

  sourceDialog(item: string): Locator {
    return this.page.getByRole('dialog', { name: `Sources for ${item}` });
  }

  closeButton(listing: Locator, monster: string): Locator {
    // The desktop panel owns "Close Drops"; the shared mobile drawer uses the
    // generic "Close details" label.
    return listing.getByRole('button', {
      name: new RegExp(
        `Close (?:Drops|details) for ${escapeRegExp(monster)}`,
        'u',
      ),
    });
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
