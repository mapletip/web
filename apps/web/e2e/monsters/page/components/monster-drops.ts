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

  certaintyButton(
    listing: Locator,
    confirmation: 'confirmed' | 'unconfirmed',
    item: string,
  ): Locator {
    return listing.getByRole('button', {
      name: `Show ${confirmation} drop details for ${item}`,
    });
  }

  certaintyDialog(buttonName: string): Locator {
    return this.page.getByRole('dialog', { name: buttonName });
  }

  certaintyLegend(listing: Locator): Locator {
    return listing.getByRole('group', { name: 'Drop certainty legend' });
  }

  closeButton(listing: Locator, monster: string): Locator {
    return listing.getByRole('button', {
      name: `Close Drops for ${monster}`,
    });
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
