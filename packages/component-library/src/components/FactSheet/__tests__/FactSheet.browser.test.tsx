import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { FactSheet } from '@/components/FactSheet';
import type { Fact } from '@/components/FactSheet';

const twelveFacts: readonly Fact[] = Array.from({ length: 12 }, (_, index) => ({
  label: `Fact ${index + 1}`,
  value: String(index + 1),
}));

async function mount(facts: readonly Fact[]) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <div style={{ width: '100%' }}>
        <FactSheet facts={facts} />
      </div>
    </MantineProvider>,
  );
}

describe('FactSheet explanations', () => {
  it('shows an explanation on hover', async () => {
    await mount([
      {
        label: 'Health',
        value: '10',
        explanation: 'Total health before any modifiers.',
      },
    ]);

    await userEvent.hover(page.getByRole('button', { name: 'Health' }));

    await expect
      .element(page.getByRole('tooltip'))
      .toHaveTextContent('Total health before any modifiers.');
  });

  it('shows an explanation on keyboard focus', async () => {
    await mount([
      {
        label: 'Health',
        value: '10',
        explanation: 'Total health before any modifiers.',
      },
    ]);

    await userEvent.tab();

    await expect
      .element(page.getByRole('button', { name: 'Health' }))
      .toHaveFocus();
    await expect
      .element(page.getByRole('tooltip'))
      .toHaveTextContent('Total health before any modifiers.');
  });
});

describe('FactSheet responsive columns', () => {
  it('shows one column in the supplied order below the tablet breakpoint', async () => {
    await page.viewport(390, 900);
    await mount(twelveFacts);

    const labels = page.getByRole('term').elements();
    expect(labels).toHaveLength(12);

    const lefts = labels.map((label) => label.getBoundingClientRect().left);
    for (const left of lefts) expect(left).toBeCloseTo(lefts[0]!, 0);

    const tops = labels.map((label) => label.getBoundingClientRect().top);
    for (let index = 1; index < tops.length; index += 1) {
      expect(tops[index]!).toBeGreaterThan(tops[index - 1]!);
    }
  });

  it('fills the first column and then the second from the tablet breakpoint', async () => {
    await page.viewport(1200, 900);
    await mount(twelveFacts);

    const labels = page.getByRole('term').elements();
    expect(labels).toHaveLength(12);

    const lefts = labels.map((label) => label.getBoundingClientRect().left);
    const tops = labels.map((label) => label.getBoundingClientRect().top);

    for (const index of [0, 1, 2, 3, 4, 5]) {
      expect(lefts[index]!).toBeCloseTo(lefts[0]!, 0);
    }
    for (const index of [6, 7, 8, 9, 10, 11]) {
      expect(lefts[index]!).toBeCloseTo(lefts[6]!, 0);
      expect(lefts[index]!).toBeGreaterThan(lefts[0]!);
    }

    // Reading down the first column, then down the second.
    expect(tops[1]!).toBeGreaterThan(tops[0]!);
    expect(tops[6]!).toBeCloseTo(tops[0]!, 0);
  });
});
