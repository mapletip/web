import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { RecordSections } from '@/components/RecordSections';

const sections = [
  {
    id: 'locations',
    title: 'Locations',
    count: 12,
    content: <div style={{ height: 520 }}>Places</div>,
  },
  {
    id: 'drops',
    title: 'Drops',
    count: 128,
    content: <div style={{ height: 520 }}>Items</div>,
  },
  {
    id: 'quests',
    title: 'Quests',
    count: 'unknown' as const,
    content: <div style={{ height: 520 }}>Quests</div>,
  },
  {
    id: 'summoned-by',
    title: 'Summoned by',
    count: 4,
    content: <div style={{ height: 520 }}>Summons</div>,
  },
];

async function mount() {
  await page.viewport(390, 800);
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <div style={{ width: '100%' }}>
        <RecordSections sections={sections} />
      </div>
    </MantineProvider>,
  );
}

describe('RecordSections narrow navigation', () => {
  it('keeps overflow inside the navigation and makes all links horizontally reachable', async () => {
    await mount();

    const navigation = page
      .getByRole('navigation', { name: 'Record sections' })
      .element();
    expect(navigation.scrollWidth).toBeGreaterThan(navigation.clientWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);

    navigation.scrollLeft = navigation.scrollWidth;
    expect(navigation.scrollLeft).toBeGreaterThan(0);

    const lastLink = page
      .getByRole('link', { name: 'Summoned by (4)' })
      .element();
    const navigationBounds = navigation.getBoundingClientRect();
    const lastLinkBounds = lastLink.getBoundingClientRect();
    expect(lastLinkBounds.left).toBeGreaterThanOrEqual(navigationBounds.left);
    expect(lastLinkBounds.right).toBeLessThanOrEqual(
      navigationBounds.right + 1,
    );
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
  });

  it('sticks while scrolling and native hash links land below the navigation', async () => {
    await mount();

    const navigation = page
      .getByRole('navigation', { name: 'Record sections' })
      .element();
    expect(getComputedStyle(navigation).position).toBe('sticky');

    window.scrollTo(0, 900);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    expect(navigation.getBoundingClientRect().top).toBe(0);

    navigation.scrollLeft = navigation.scrollWidth;
    await userEvent.click(page.getByRole('link', { name: 'Summoned by (4)' }));

    expect(window.location.hash).toBe('#summoned-by');
    const heading = page
      .getByRole('heading', { name: 'Summoned by (4)' })
      .element();
    expect(heading.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      navigation.getBoundingClientRect().bottom,
    );
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
  });

  it('allows keyboard activation of an accordion control', async () => {
    await mount();

    const control = page.getByRole('button', { name: 'Drops (128)' });
    control.element().focus();
    await userEvent.keyboard('{Enter}');

    await expect.element(control).toHaveAttribute('aria-expanded', 'false');
  });
});
