import type { Locator, Page } from '@playwright/test';

type ComponentRoot = Locator | Page;

export class MonsterFacet {
  constructor(readonly root: Locator) {}

  checkbox(name: string | RegExp): Locator {
    return this.root.getByRole('checkbox', { name });
  }

  get checkboxes(): Locator {
    return this.root.getByRole('checkbox');
  }

  get seeMoreButton(): Locator {
    return this.root.getByRole('button', { name: 'See more' });
  }
}

export class MonsterFilterCollection {
  constructor(readonly root: ComponentRoot) {}

  facet(name: string): MonsterFacet {
    return new MonsterFacet(this.root.getByRole('group', { name }));
  }

  get clearButton(): Locator {
    return this.root.getByRole('button', { name: 'Clear filters' });
  }

  removeButton(name: string): Locator {
    return this.root.getByRole('button', {
      name: new RegExp(`Remove ${escapeRegExp(name)}`, 'u'),
    });
  }

  get dropItems(): Locator {
    return this.root.getByRole('combobox', { name: 'Drops' });
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export class QuickFilters {
  readonly root: Locator;

  constructor(
    private readonly page: Page,
    root: Locator = page.getByRole('region', { name: 'Quick filters' }),
  ) {
    this.root = root;
  }

  button(name: string | RegExp): Locator {
    return this.root.getByRole('button', { name });
  }

  async openAll(): Promise<MonsterFilterDialog> {
    await this.button(/Open all filters/u).click();
    return new MonsterFilterDialog(this.page);
  }
}

export class MonsterFilterDialog {
  readonly root: Locator;
  readonly filters: MonsterFilterCollection;

  constructor(page: Page) {
    this.root = page.getByRole('dialog', { name: 'Filters' });
    this.filters = new MonsterFilterCollection(this.root);
  }

  get applyButton(): Locator {
    return this.root.getByRole('button', { name: 'Apply' });
  }
}
