import type { Locator, Page } from '@playwright/test';

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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
