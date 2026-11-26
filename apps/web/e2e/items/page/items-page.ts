import type { Locator, Page } from '@playwright/test';

/** Accessible locators and journeys for Items Browse. */
export class ItemsPage {
  constructor(readonly page: Page) {}

  heading(name?: string): Locator {
    return name === undefined
      ? this.page.getByRole('heading', { level: 1 })
      : this.page.getByRole('heading', { name, exact: true });
  }

  item(name: string): Locator {
    return this.page
      .getByRole('heading', { name, exact: true })
      .or(this.page.getByRole('cell', { name, exact: true }));
  }

  get summary(): Locator {
    return this.page.getByText(/^\d+ Items?$/u).first();
  }

  async goto(path = '/maplestory/items'): Promise<void> {
    await this.page.goto(path);
    await this.ready();
  }

  async ready(): Promise<void> {
    await this.page.waitForFunction(() => {
      const main = document.querySelector('main');
      return (
        main !== null &&
        Object.keys(main).some((key) => key.startsWith('__reactProps'))
      );
    });
  }

  async filterBy({
    facet,
    option,
  }: {
    readonly facet: string;
    readonly option: string;
  }): Promise<void> {
    const main = this.page.getByRole('main');
    const optionCheckbox = () =>
      main.getByRole('group', { name: facet }).getByRole('checkbox', {
        name: new RegExp(`^${option}(?:\\s|$)`, 'u'),
      });

    if (await optionCheckbox().isVisible()) {
      await optionCheckbox().click();
      return;
    }

    const quickFilters = main.getByRole('region', { name: 'Quick filters' });
    await quickFilters
      .getByRole('button', { name: /Open all filters/u })
      .click();
    const dialog = this.page.getByRole('dialog', { name: 'Filters' });
    await dialog
      .getByRole('group', { name: facet })
      .getByRole('checkbox', {
        name: new RegExp(`^${option}(?:\\s|$)`, 'u'),
      })
      .click();
    await dialog
      .getByRole('button', {
        name: /^Show \d+ Classic World items$/u,
      })
      .click();
  }
}
