import type { Locator, Page } from '@playwright/test';

import { MonsterCards } from './monster-cards';
import { MonsterTable } from './monster-table';

export class MonsterDrops {
  constructor(
    private readonly page: Page,
    private readonly table: MonsterTable,
    private readonly cards: MonsterCards,
  ) {}

  tableButton(name: string, count: number): Locator {
    return this.table.dropButton(name, count);
  }

  cardButton(name: string, count: number): Locator {
    return this.cards.dropButton(name, count);
  }

  panel(name: string, count: number): MonsterDropListing {
    return new MonsterDropListing(
      this.page.getByRole('region', { name: `${name} Drops (${count})` }),
    );
  }

  drawer(name: string): MonsterDropListing {
    return new MonsterDropListing(
      this.page.getByRole('dialog', {
        name: new RegExp(escapeRegExp(name), 'u'),
      }),
    );
  }

  certaintyDialog(buttonName: string): DropCertaintyDialog {
    return new DropCertaintyDialog(
      this.page.getByRole('dialog', { name: buttonName }),
    );
  }
}

export class MonsterDropListing {
  constructor(readonly root: Locator) {}

  text(value: string | RegExp): Locator {
    return this.root.getByText(value);
  }

  category(name: string, level?: 1 | 2 | 3 | 4 | 5 | 6): Locator {
    return this.root.getByRole('heading', {
      name,
      ...(level === undefined ? {} : { level }),
    });
  }

  get itemSearch(): Locator {
    return this.root.getByRole('textbox', { name: 'Search items' });
  }

  certaintyButton(
    confirmation: 'confirmed' | 'unconfirmed',
    item: string,
  ): Locator {
    const state = confirmation === 'confirmed' ? 'confirmed' : 'unconfirmed';
    return this.root.getByRole('button', {
      name: `Show ${state} drop details for ${item}`,
    });
  }

  closeButton(monster: string): Locator {
    return this.root.getByRole('button', {
      name: `Close Drops for ${monster}`,
    });
  }

  get certaintyLegend(): Locator {
    return this.root.getByRole('group', { name: 'Drop certainty legend' });
  }
}

export class DropCertaintyDialog {
  constructor(readonly root: Locator) {}

  text(value: string): Locator {
    return this.root.getByText(value);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
