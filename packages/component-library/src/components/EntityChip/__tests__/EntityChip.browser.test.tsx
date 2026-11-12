import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { EntityChip } from '@/components/EntityChip';
import type { EntityChipProps } from '@/components/EntityChip';

const destination = { href: '/maplestory/monsters/synthetic-record-100100' };
const longName =
  'Synthetic item with a deliberately long name that must wrap inside the chip without widening the page';

async function mount(props: Partial<EntityChipProps> = {}) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <div style={{ width: '20rem', maxWidth: '100%' }}>
        <EntityChip name="Synthetic item" {...props} />
      </div>
    </MantineProvider>,
  );
}

describe('EntityChip keyboard order', () => {
  it('moves focus from the link to the trailing control', async () => {
    await mount({
      destination,
      trailing: <button type="button">Confirmed</button>,
    });

    await userEvent.tab();
    await expect
      .element(page.getByRole('link', { name: 'Synthetic item' }))
      .toHaveFocus();

    await userEvent.tab();
    await expect
      .element(page.getByRole('button', { name: 'Confirmed' }))
      .toHaveFocus();
  });
});

describe('EntityChip wrapping', () => {
  it('wraps a long name inside the chip without overflowing the page', async () => {
    await page.viewport(390, 800);
    await mount({
      name: longName,
      destination,
      trailing: <button type="button">Confirmed</button>,
    });

    const name = page.getByText(longName);
    await expect.element(name).toBeVisible();

    const chip = name.element().closest('a')?.parentElement;
    expect(chip).not.toBeNull();
    expect(chip!.getBoundingClientRect().right).toBeLessThanOrEqual(390);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
  });
});
