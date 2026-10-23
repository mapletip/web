import { beforeEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { MonsterDataTable } from './MonsterDataTable';
import { bodyRows, cell, renderTable, tabUntil } from './testing';

/*
 * Characterisation of Mantine DataTable 9.4 against the same requirements.
 * Assertions describe observed behaviour (including shortfalls) so a library
 * upgrade that changes it is noticed.
 */

beforeEach(async () => {
  await page.viewport(1440, 900);
});

const Table = MonsterDataTable;

describe('Mantine DataTable 9.4 (minimal comparison)', () => {
  test('header cells are <th role="button" tabindex=0>: no scope, no aria-sort, no caption', async () => {
    const container = await renderTable({ Table });
    const headers = [...container.querySelectorAll<HTMLElement>('thead th')];
    expect(headers).toHaveLength(11);
    for (const th of headers) {
      expect(th.getAttribute('role')).toBe('button');
      expect(th.getAttribute('tabindex')).toBe('0');
      expect(th.hasAttribute('scope')).toBe(false);
      expect(th.hasAttribute('aria-sort')).toBe(false);
    }
    expect(container.querySelector('caption')).toBeNull();
    expect(container.querySelectorAll('tbody th')).toHaveLength(0);
  });

  test('sorting activates with click and Enter; records Space behaviour', async () => {
    const onSortChange = vi.fn();
    const container = await renderTable({ Table, onSortChange });
    const header = (accessor: string) =>
      container.querySelector<HTMLElement>(
        `thead th[data-accessor="${accessor}"]`,
      )!;
    await userEvent.click(header('hp'));
    expect(onSortChange).toHaveBeenLastCalledWith({
      field: 'hp',
      direction: 'desc',
    });
    header('level').focus();
    await userEvent.keyboard('{Enter}');
    const enterCalls = onSortChange.mock.calls.length;
    expect(onSortChange).toHaveBeenLastCalledWith({
      field: 'level',
      direction: 'desc',
    });
    header('accuracy').focus();
    await userEvent.keyboard(' ');
    const spaceActivated = onSortChange.mock.calls.length > enterCalls;
    console.info(
      `[spike] DataTable: Space activates header sort = ${spaceActivated}`,
    );
    expect(typeof spaceActivated).toBe('boolean');
  });

  test('first sort direction cannot differ per column (stats ascend first)', async () => {
    const onSortChange = vi.fn();
    const container = await renderTable({
      Table,
      initialSort: null,
      onSortChange,
    });
    await userEvent.click(
      container.querySelector<HTMLElement>('thead th[data-accessor="hp"]')!,
    );
    console.info(
      `[spike] DataTable: first click on HP -> ${JSON.stringify(onSortChange.mock.calls[0])}`,
    );
    expect(onSortChange).toHaveBeenCalledOnce();
  });

  test('row hover tints the row; there is no column highlight', async () => {
    const container = await renderTable({ Table });
    const row = bodyRows(container)[2]!;
    await userEvent.hover(cell(container, 2, 3));
    await vi.waitFor(() =>
      expect(getComputedStyle(row).backgroundColor).not.toBe(
        'rgba(0, 0, 0, 0)',
      ),
    );
    expect(getComputedStyle(cell(container, 2, 3), '::after').content).toBe(
      'none',
    );
  });

  test('pinFirstColumn keeps the identity column fixed under horizontal scroll at 1024px', async () => {
    await page.viewport(1024, 768);
    const container = await renderTable({ Table });
    const viewport = container.querySelector<HTMLElement>(
      '.mantine-datatable-scroll-area-viewport, [data-scrollarea-viewport], .mantine-ScrollArea-viewport',
    )!;
    expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    const identity = cell(container, 0, 0);
    const stat = cell(container, 0, 3);
    const before = {
      identity: identity.getBoundingClientRect().left,
      stat: stat.getBoundingClientRect().left,
    };
    viewport.scrollLeft = 200;
    await vi.waitFor(() =>
      expect(stat.getBoundingClientRect().left).toBeLessThan(before.stat),
    );
    expect(identity.getBoundingClientRect().left).toBe(before.identity);
  });

  test('header stays visible while the body scrolls in its internal scroll area', async () => {
    const container = await renderTable({ Table });
    const viewport = container.querySelector<HTMLElement>(
      '.mantine-ScrollArea-viewport',
    )!;
    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    const head = container.querySelector<HTMLElement>('thead th')!;
    const top = head.getBoundingClientRect().top;
    viewport.scrollTop = 1500;
    await vi.waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    expect(head.getBoundingClientRect().top).toBe(top);
  });

  test('keyboard: header cells are tab stops (11), then the entity links', async () => {
    const container = await renderTable({ Table });
    const stops = await tabUntil(container, (active) => active.tagName === 'A');
    const leading = stops[0] === 'DIV' ? 1 : 0; // Firefox focuses the scroll region first
    expect(
      stops.slice(leading, leading + 11).every((tag) => tag === 'TH'),
    ).toBe(true);
    expect(stops[leading + 11]).toBe('A');
  });
});
