import type { Locator, Page } from '@playwright/test';

import { dropActionLabel } from './drop-action';

const CARDS_NAME = 'Classic World monsters cards';

export class MonsterCards {
  readonly root: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('list', { name: CARDS_NAME });
  }

  card(name: string): MonsterCard {
    return new MonsterCard(
      this.root.getByRole('article').filter({ hasText: name }),
    );
  }

  heading(name: string): Locator {
    return this.root.getByRole('heading', { name });
  }

  dropButton(name: string, count: number): Locator {
    return this.card(name).root.getByRole('button', {
      name: dropActionLabel(name, count),
    });
  }
}

export class MonsterCard {
  constructor(readonly root: Locator) {}

  fact(label: string): Locator {
    return this.root.getByLabel(label);
  }

  text(value: string, exact = false): Locator {
    return this.root.getByText(value, { exact });
  }
}
