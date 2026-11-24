import type { Page } from '@playwright/test';

/** Open a page and wait until React has hydrated it. */
export async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    return (
      main !== null &&
      Object.keys(main).some((key) => key.startsWith('__reactProps'))
    );
  });
}

export function summary(page: Page) {
  return page.getByText(/^\d+ Maps?$/u).first();
}

/** Type into a searchable picker and choose the matching option. */
export async function pick(
  page: Page,
  {
    picker,
    text,
    option,
  }: {
    readonly picker: ReturnType<Page['getByRole']>;
    readonly text: string;
    readonly option: RegExp;
  },
): Promise<void> {
  await picker.click();
  await picker.pressSequentially(text);
  await page.getByRole('option', { name: option }).click();
}
