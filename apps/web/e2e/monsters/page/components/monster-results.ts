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

function dropActionLabel(name: string, count: number): string {
  const countText = count.toLocaleString('en-US');
  const drops =
    count === 0 ? countText : `${countText} ${count === 1 ? 'drop' : 'drops'}`;
  return `${name}, ${drops}. Show drops.`;
}
