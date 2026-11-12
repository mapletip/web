import type { Locator, Page } from '@playwright/test';

/** The responsive Monster results surface, including its search and paging. */
export class MonsterResults {
  readonly root: Locator;
  readonly table: Locator;
  readonly cards: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('region', { name: /monsters results$/u });
    this.table = this.root.getByRole('table', {
      name: /monsters comparison$/u,
    });
    this.cards = this.root.getByRole('list', { name: /monsters cards$/u });
  }

  get search(): Locator {
    return this.root.getByRole('textbox', { name: /Search .* monsters$/u });
  }

  get summary(): Locator {
    return this.root.getByText(/^\d+ Monsters?$/u).first();
  }

  row(name: string | RegExp): Locator {
    return this.table.getByRole('row', { name });
  }

  get dropButtons(): Locator {
    return this.table.getByRole('button', { name: /Show drops\.$/u });
  }

  tableDropButton(name: string, count: number): Locator {
    return this.table.getByRole('button', {
      name: dropActionLabel(name, count),
    });
  }

  sortButton(name: string): Locator {
    return this.table.getByRole('button', { name, exact: true });
  }

  card(name: string): Locator {
    return this.cards.getByRole('article').filter({ hasText: name });
  }

  cardHeading(name: string): Locator {
    return this.cards.getByRole('heading', { name });
  }

  cardDropButton(name: string, count: number): Locator {
    return this.card(name).getByRole('button', {
      name: dropActionLabel(name, count),
    });
  }

  get nextPageButton(): Locator {
    return this.root.getByRole('button', { name: 'Next page' });
  }

  pageSize(buildName: string): Locator {
    return this.root.getByRole('combobox', {
      name: `${buildName} monsters per page`,
    });
  }
}

/** The desktop facets and mobile quick-filter dialog. */
export class MonsterFilters {
  private readonly root: Locator;
  private readonly quickFilterRegion: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('main');
    this.quickFilterRegion = this.root.getByRole('region', {
      name: 'Quick filters',
    });
  }

  facet(name: string, within: Locator = this.root): Locator {
    return within.getByRole('group', { name });
  }

  checkbox(facet: string, option: string | RegExp, within?: Locator): Locator {
    return this.facet(facet, within).getByRole('checkbox', { name: option });
  }

  quickButton(name: string | RegExp): Locator {
    return this.quickFilterRegion.getByRole('button', { name });
  }

  get dropItems(): Locator {
    return this.root.getByRole('combobox', { name: 'Drops' });
  }

  get clearButton(): Locator {
    return this.root.getByRole('button', { name: 'Clear filters' });
  }

  removeButton(name: string): Locator {
    return this.root.getByRole('button', {
      name: new RegExp(`Remove ${escapeRegExp(name)}`, 'u'),
    });
  }

  async openAll(): Promise<Locator> {
    await this.quickButton(/Open all filters/u).click();
    return this.page.getByRole('dialog', { name: 'Filters' });
  }

  applyButton(dialog: Locator): Locator {
    return dialog.getByRole('button', { name: 'Apply' });
  }
}

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

function dropActionLabel(name: string, count: number): string {
  const countText = count.toLocaleString('en-US');
  const drops =
    count === 0 ? countText : `${countText} ${count === 1 ? 'drop' : 'drops'}`;
  return `${name}, ${drops}. Show drops.`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
