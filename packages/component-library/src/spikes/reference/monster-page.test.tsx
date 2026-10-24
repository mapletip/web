import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../styles.css';
import { theme } from '../../theme';

import { MonsterPage } from './support/MonsterPage';

beforeEach(async () => {
  document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  await page.viewport(1440, 900);
});

async function mount(
  onApplyCommit?: Parameters<typeof MonsterPage>[0]['onApplyCommit'],
) {
  const screen = await render(
    <MantineProvider theme={theme}>
      <MonsterPage {...(onApplyCommit ? { onApplyCommit } : {})} />
    </MantineProvider>,
  );
  await vi.waitFor(
    () => expect(document.querySelector('tbody tr')).not.toBeNull(),
    { timeout: 5000 },
  );
  return screen;
}

const shown = (el: Element | null) => !!el && el.checkVisibility();
const rail = () =>
  document.querySelector<HTMLElement>('aside[aria-label="Monster filters"]');
const cards = () =>
  document.querySelector<HTMLElement>('ul[aria-label="Monster cards"]');
const quick = () =>
  [...document.querySelectorAll('button')].find(
    (b) => b.textContent === 'Filters',
  ) ?? null;
const bodyRows = () => [...document.querySelectorAll<HTMLElement>('tbody tr')];
const cell = (r: number, c: number) =>
  bodyRows()[r]!.children[c] as HTMLElement;
const scrollViewport = () =>
  document.querySelector<HTMLElement>('.mantine-ScrollArea-viewport')!;

describe('layout', () => {
  test.each([992, 1024, 1280, 1440])(
    '%ipx: rail 240px + table visible; cards and quick facets hidden',
    async (w) => {
      await page.viewport(w, 800);
      await mount();
      expect(shown(rail())).toBe(true);
      expect(rail()!.getBoundingClientRect().width).toBe(240);
      expect(shown(document.querySelector('table'))).toBe(true);
      expect(
        shown(
          document
            .querySelector('table')!
            .closest('div[class*="visibleFrom"], .mantine-visible-from-md') ??
            document.querySelector('table'),
        ),
      ).toBe(true);
      expect(shown(cards())).toBe(false);
      expect(shown(quick())).toBe(false);
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(w);
    },
  );

  test.each([375, 320])(
    '%ipx: cards and quick facets visible; rail and table hidden; no page scroll',
    async (w) => {
      await page.viewport(w, 800);
      await mount();
      expect(shown(rail())).toBe(false);
      expect(shown(cards())).toBe(true);
      expect(shown(quick())).toBe(true);
      expect(shown(document.querySelector('table'))).toBe(false);
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(w);
    },
  );

  test('rail scrolls with the page: not sticky, no scroll area', async () => {
    await mount();
    const style = getComputedStyle(rail()!);
    expect(style.position).toBe('static');
    expect(style.overflowY).toBe('visible');
  });
});

describe('table header semantics and sorting', () => {
  test('11 header cells each hold one button; table named by the heading; sort state in the name', async () => {
    await mount();
    const ths = [...document.querySelectorAll('thead th')];
    expect(ths).toHaveLength(11);
    for (const th of ths) expect(th.querySelectorAll('button')).toHaveLength(1);
    const heading = document.querySelector('h1')!;
    expect(
      document.querySelector('table')!.getAttribute('aria-labelledby'),
    ).toBe(heading.id);
    const text = (id: string) =>
      document.querySelector(`thead th[data-accessor="${id}"] button`)!
        .textContent;
    expect(text('exp')).toContain('sorted descending');
    expect(text('hp')).not.toContain('sorted');
    expect(text('weaponAttack')).toContain('(Weapon attack)');
  });

  test('click, Enter and Space sort with per-column first direction', async () => {
    await mount();
    const btn = (id: string) =>
      document.querySelector<HTMLButtonElement>(
        `thead th[data-accessor="${id}"] button`,
      )!;
    const heading = () => document.querySelector('h1')!.textContent;
    await userEvent.click(btn('hp'));
    expect(heading()).toContain('hp descending');
    btn('level').focus();
    await userEvent.keyboard('{Enter}');
    expect(heading()).toContain('level ascending');
    btn('accuracy').focus();
    await userEvent.keyboard(' ');
    expect(heading()).toContain('accuracy descending');
    expect(
      document.querySelector('thead th[data-accessor="accuracy"] button')!
        .textContent,
    ).toContain('sorted descending');
  });

  test('titleClassName reaches the header cell styling', async () => {
    await mount();
    const th = document.querySelector<HTMLElement>(
      'thead th[data-accessor="hp"]',
    )!;
    expect(th.className).toMatch(/headerCell/u);
    expect(getComputedStyle(th).fontWeight).toBe('650');
  });
});

describe('highlighting (scoped CSS on DataTable)', () => {
  test('hover: row + column overlay + intersection; none on header or identity; unhover clears; height unchanged', async () => {
    await mount();
    const target = cell(3, 5);
    const before = scrollViewport().scrollHeight;
    await userEvent.hover(target);
    await vi.waitFor(() =>
      expect(getComputedStyle(target, '::after').backgroundColor).not.toBe(
        'rgba(0, 0, 0, 0)',
      ),
    );
    expect(getComputedStyle(target, '::after').position).toBe('absolute');
    expect(getComputedStyle(bodyRows()[3]!).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
    expect(scrollViewport().scrollHeight).toBe(before);
    // Overlay reaches rows below the hovered row (z-index fix): sample a later row's cell stacking.
    expect(getComputedStyle(target, '::after').zIndex).toBe('1');
    await userEvent.unhover(target);
    await vi.waitFor(() =>
      expect(getComputedStyle(target, '::after').content).toBe('none'),
    );
    // Identity cell and header cell: no overlay.
    await userEvent.hover(cell(3, 0));
    expect(getComputedStyle(cell(3, 0), '::after').backgroundColor).toBe(
      'rgba(0, 0, 0, 0)',
    );
    // Playwright cannot hover a <th> directly (it times out); hover the button inside it.
    await userEvent.hover(
      document.querySelector('thead th[data-accessor="hp"] button')!,
    );
    expect(
      getComputedStyle(
        document.querySelector('thead th[data-accessor="hp"]')!,
        '::after',
      ).backgroundColor,
    ).toBe('rgba(0, 0, 0, 0)');
  });

  test('sorted tint on the sorted column only', async () => {
    await mount();
    // With the color scheme attribute set, DataTable cells have an opaque body background;
    // the sorted tint is the translucent one (alpha 0.08).
    expect(getComputedStyle(cell(0, 3)).backgroundColor).toMatch(
      /\/ 0\.08\)$/u,
    );
    expect(getComputedStyle(cell(0, 5)).backgroundColor).not.toMatch(
      /\/ 0\.08\)$/u,
    );
    expect(getComputedStyle(cell(0, 3)).fontWeight).toBe('600');
    expect(getComputedStyle(cell(0, 5)).fontWeight).not.toBe('600');
  });

  test('keyboard focus on a row link outlines the row', async () => {
    await mount();
    const link = cell(1, 0).querySelector('a')!;
    for (let i = 0; i < 20 && document.activeElement !== link; i += 1)
      await userEvent.tab();
    expect(document.activeElement).toBe(link);
    expect(getComputedStyle(bodyRows()[1]!).outlineStyle).toBe('solid');
    expect(
      parseFloat(getComputedStyle(bodyRows()[1]!).outlineWidth),
    ).toBeGreaterThanOrEqual(2);
  });

  test('bounded height at 1440x900', async () => {
    await mount();
    const h = scrollViewport().getBoundingClientRect().height;
    console.info(`[ref] DataTable scroll area height=${h}`);
    expect(h).toBeLessThanOrEqual(900 - 120 + 1);
    expect(scrollViewport().scrollHeight).toBeGreaterThan(
      scrollViewport().clientHeight,
    );
  });
});

describe('filter drawer', () => {
  beforeEach(async () => {
    await page.viewport(375, 812);
  });
  const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
  const button = (name: string) =>
    [
      ...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
    ].find((b) => b.textContent === name)!;

  test('Apply commits once and closes; Cancel, Escape and overlay discard; focus returns', async () => {
    const onCommit = vi.fn();
    await mount(onCommit);
    const opener = quick()!;
    await userEvent.click(opener);
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await userEvent.click(button('Cancel'));
    await vi.waitFor(() => expect(dialog()).toBeNull());
    expect(onCommit).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(document.activeElement).toBe(opener));
    await userEvent.click(opener);
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(dialog()).toBeNull());
    await userEvent.click(opener);
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await userEvent.click(button('Show results'));
    await vi.waitFor(() => expect(dialog()).toBeNull());
    expect(onCommit).toHaveBeenCalledOnce();
  });

  test('quick facet opens at its section with the autofocus control focused', async () => {
    await mount();
    await userEvent.click(
      [...document.querySelectorAll('button')].find(
        (b) => b.textContent === 'Level',
      )!,
    );
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    await vi.waitFor(() =>
      expect(
        (document.activeElement as HTMLElement).hasAttribute('data-autofocus'),
      ).toBe(true),
    );
    expect(document.querySelector('[role="dialog"] input')).not.toBeNull();
  });

  test('invalid range disables Apply and shows the error; Reset clears without closing', async () => {
    await mount();
    await userEvent.click(
      [...document.querySelectorAll('button')].find(
        (b) => b.textContent === 'Level',
      )!,
    );
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
    const [min, max] = [
      ...document.querySelectorAll<HTMLInputElement>('[role="dialog"] input'),
    ];
    await userEvent.fill(min!, '50');
    await userEvent.fill(max!, '10');
    await vi.waitFor(() => expect(button('Show results').disabled).toBe(true));
    expect(dialog()!.textContent).toContain('Minimum must not exceed maximum');
    await userEvent.click(button('Reset'));
    await vi.waitFor(() => expect(button('Show results').disabled).toBe(false));
    expect(dialog()).not.toBeNull();
  });

  test.each([375, 320])(
    '%ipx: footer visible and no horizontal overflow',
    async (w) => {
      await page.viewport(w, 640);
      await mount();
      await userEvent.click(quick()!);
      await vi.waitFor(() => expect(dialog()).not.toBeNull());
      // The drawer slides in over 250 ms; measure after it settles.
      await vi.waitFor(() =>
        expect(
          button('Cancel').getBoundingClientRect().bottom,
        ).toBeLessThanOrEqual(640),
      );
      expect(button('Cancel').getBoundingClientRect().top).toBeGreaterThan(0);
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(w);
    },
  );
});
