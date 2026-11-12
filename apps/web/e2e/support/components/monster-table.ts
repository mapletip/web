import type { Locator, Page } from '@playwright/test';

import { dropActionLabel } from './drop-action';

export class MonsterTable {
  readonly root: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('table', { name: /monsters comparison$/u });
  }

  row(name: string | RegExp): Locator {
    return this.root.getByRole('row', { name });
  }

  get dropButtons(): Locator {
    return this.root.getByRole('button', { name: /Show drops\.$/u });
  }

  dropButton(name: string, count: number): Locator {
    return this.root.getByRole('button', {
      name: dropActionLabel(name, count),
    });
  }

  sortButton(name: string): Locator {
    return this.root.getByRole('button', { name, exact: true });
  }
}
