import type { Locator, Page } from '@playwright/test';

export class MonsterPagination {
  constructor(private readonly page: Page) {}

  get nextButton(): Locator {
    return this.page.getByRole('button', { name: 'Next page' });
  }

  pageSize(buildName: string): Locator {
    return this.page.getByRole('combobox', {
      name: `${buildName} monsters per page`,
    });
  }
}
