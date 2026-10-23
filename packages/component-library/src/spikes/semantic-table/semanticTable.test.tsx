import { beforeEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { sortSpikeMonsters } from '../ag-grid/fixtures';

import { MonsterMantineTable } from './MonsterMantineTable';
import { MonsterTanStackTable } from './MonsterTanStackTable';
import {
  bodyRows,
  cell,
  records,
  renderTable,
  scroller,
  tabUntil,
} from './testing';

beforeEach(async () => {
  await page.viewport(1440, 900);
});

/** Identical behaviour is required of both candidates, so every test runs on both. */
describe.each([
  ['Mantine Table + TanStack Table', MonsterTanStackTable],
  ['Mantine Table alone', MonsterMantineTable],
] as const)('%s', (_name, Table) => {
  describe('semantics', () => {
    test('caption, column headers, row headers and sort state', async () => {
      const container = await renderTable({ Table });
      expect(container.querySelector('table > caption')?.textContent).toContain(
        'sorted by EXP',
      );
      expect(container.querySelectorAll('thead th[scope="col"]')).toHaveLength(
        11,
      );
      expect(container.querySelectorAll('tbody th[scope="row"]')).toHaveLength(
        100,
      );
      const sorted = [
        ...container.querySelectorAll('thead th[aria-sort]'),
      ].filter((th) => th.getAttribute('aria-sort') !== 'none');
      expect(sorted).toHaveLength(1);
      expect(sorted[0]?.getAttribute('aria-sort')).toBe('descending');
      expect(sorted[0]?.textContent).toContain('EXP');
    });

    test('unknown renders "—" named Unknown; zero renders 0; missing sprite shows a placeholder', async () => {
      const container = await renderTable({ Table, initialSort: null });
      // Fixture index 3: unknown HP; index 5: known zero EXP; index 4: no sprite.
      expect(cell(container, 3, 2).textContent).toBe('—Unknown');
      expect(cell(container, 5, 3).textContent).toBe('0');
      expect(cell(container, 4, 0).textContent).toContain('?');
    });

    test('numeric cells are right aligned; long names wrap in a taller row', async () => {
      const container = await renderTable({ Table, initialSort: null });
      expect(getComputedStyle(cell(container, 0, 2)).textAlign).toMatch(
        /right|end/u,
      );
      const height = (index: number) =>
        bodyRows(container)[index]!.offsetHeight;
      expect(height(7)).toBeGreaterThan(height(6));
    });

    test('hidden columns are removed from header and rows', async () => {
      const container = await renderTable({
        Table,
        hiddenColumns: ['magicAttack', 'magicDefense'],
      });
      expect(container.querySelectorAll('thead th')).toHaveLength(9);
      expect(bodyRows(container)[0]!.children).toHaveLength(9);
    });
  });

  describe('sorting and keyboard', () => {
    test('header buttons sort with click, Enter and Space (native button semantics)', async () => {
      const onSortChange = vi.fn();
      const container = await renderTable({ Table, onSortChange });
      const button = (title: string) =>
        container.querySelector<HTMLButtonElement>(
          `thead th button[title="${title}"]`,
        )!;
      await userEvent.click(button('HP'));
      expect(onSortChange).toHaveBeenLastCalledWith({
        field: 'hp',
        direction: 'desc',
      });
      button('Level').focus();
      await userEvent.keyboard('{Enter}');
      expect(onSortChange).toHaveBeenLastCalledWith({
        field: 'level',
        direction: 'asc',
      });
      button('Accuracy').focus();
      await userEvent.keyboard(' ');
      expect(onSortChange).toHaveBeenLastCalledWith({
        field: 'accuracy',
        direction: 'desc',
      });
    });

    test('re-sorted rows come from the query layer; unknown values stay last', async () => {
      const container = await renderTable({
        Table,
        initialSort: { field: 'hp', direction: 'asc' },
      });
      const expected = sortSpikeMonsters(records, {
        field: 'hp',
        direction: 'asc',
      });
      expect(bodyRows(container)[0]!.textContent).toContain(expected[0]!.name);
      expect(cell(container, 99, 2).textContent).toContain('Unknown');
      expect(
        container.querySelector('th[aria-sort="ascending"]')?.textContent,
      ).toContain('HP');
    });

    test('the table is not a single tab stop: headers and links are ordinary tab stops', async () => {
      const container = await renderTable({ Table });
      const stops = await tabUntil(
        container,
        (active) => active.tagName === 'A',
      );
      const leading = stops[0] === 'DIV' ? 1 : 0; // Firefox focuses the scroll region first
      expect(
        stops.slice(leading, leading + 11).every((tag) => tag === 'BUTTON'),
      ).toBe(true);
      expect(stops[leading + 11]).toBe('A');
      console.info(
        `[spike] ${_name}: scroll region is a Tab stop = ${leading === 1}`,
      );
      console.info(
        `[spike] ${_name}: Tab order = 11 header buttons, then entity links (one per row)`,
      );
    });

    test('entity links are real anchors; modified clicks are not intercepted', async () => {
      const container = await renderTable({ Table });
      const link = cell(container, 0, 0).querySelector('a')!;
      expect(link.getAttribute('href')).toMatch(/^\/monsters\//u);
      let prevented: boolean | undefined;
      const observe = (event: MouseEvent) => {
        prevented = event.defaultPrevented;
        event.preventDefault();
      };
      document.addEventListener('click', observe);
      link.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
        }),
      );
      document.removeEventListener('click', observe);
      expect(prevented).toBe(false);
    });
  });

  describe('highlighting (CSS only)', () => {
    test('row hover: Mantine highlightOnHover tints the row', async () => {
      const container = await renderTable({ Table });
      const row = bodyRows(container)[2]!;
      await userEvent.hover(cell(container, 2, 3));
      await vi.waitFor(() =>
        expect(getComputedStyle(row).backgroundColor).not.toBe(
          'rgba(0, 0, 0, 0)',
        ),
      );
    });

    test('column hover: a body stat cell paints a clipped full-height overlay; the pinned cell keeps the row tint', async () => {
      const container = await renderTable({ Table });
      const target = cell(container, 3, 3);
      await userEvent.hover(target);
      await vi.waitFor(() =>
        expect(getComputedStyle(target, '::after').backgroundColor).not.toBe(
          'rgba(0, 0, 0, 0)',
        ),
      );
      const overlay = getComputedStyle(target, '::after');
      expect(overlay.position).toBe('absolute');
      expect(Math.abs(parseFloat(overlay.top))).toBeGreaterThan(1000);
      // The oversized overlay is clipped: hovering does not change the scrollable height.
      const hoveredHeight = scroller(container).scrollHeight;
      await userEvent.unhover(target);
      await vi.waitFor(() =>
        expect(getComputedStyle(target, '::after').content).toBe('none'),
      );
      expect(scroller(container).scrollHeight).toBe(hoveredHeight);
      const pinned = cell(container, 3, 0);
      expect(getComputedStyle(pinned).backgroundColor).not.toBe(
        'rgba(0, 0, 0, 0)',
      );
      expect(getComputedStyle(pinned, '::after').content).toBe('none');
    });

    test('intersection: the hovered cell has both the row tint and the column overlay', async () => {
      const container = await renderTable({ Table });
      const target = cell(container, 3, 3);
      await userEvent.hover(target);
      await vi.waitFor(() =>
        expect(getComputedStyle(target, '::after').backgroundColor).not.toBe(
          'rgba(0, 0, 0, 0)',
        ),
      );
      expect(
        getComputedStyle(bodyRows(container)[3]!).backgroundColor,
      ).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('sorted-column emphasis tints the cells of the sorted column only', async () => {
      const container = await renderTable({ Table });
      expect(getComputedStyle(cell(container, 0, 3)).backgroundColor).not.toBe(
        'rgba(0, 0, 0, 0)',
      );
      expect(getComputedStyle(cell(container, 0, 2)).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)',
      );
    });

    test('keyboard focus: a focused link outlines its row and the link', async () => {
      const container = await renderTable({ Table });
      await tabUntil(
        container,
        (active) => active.closest('tbody tr') === bodyRows(container)[1],
      );
      const link = document.activeElement as HTMLElement;
      expect(link.tagName).toBe('A');
      expect(link.closest('tr')).toBe(bodyRows(container)[1]);
      const row = bodyRows(container)[1]!;
      await vi.waitFor(() =>
        expect(getComputedStyle(row).outlineStyle).not.toBe('none'),
      );
      expect(
        parseFloat(getComputedStyle(row).outlineWidth),
      ).toBeGreaterThanOrEqual(2);
      expect(getComputedStyle(link).outlineStyle).not.toBe('none');
    });
  });

  describe('layout and scrolling', () => {
    test('pinned identity stays put under horizontal scroll at 1024px', async () => {
      await page.viewport(1024, 768);
      const container = await renderTable({ Table });
      const box = scroller(container);
      expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
      const identity = cell(container, 0, 0);
      const stat = cell(container, 0, 3);
      const before = {
        identity: identity.getBoundingClientRect().left,
        stat: stat.getBoundingClientRect().left,
      };
      box.scrollLeft = 200;
      await vi.waitFor(() =>
        expect(stat.getBoundingClientRect().left).toBeLessThan(before.stat),
      );
      expect(identity.getBoundingClientRect().left).toBe(before.identity);
    });

    test('header stays visible while the body scrolls inside the bounded container', async () => {
      const container = await renderTable({ Table });
      const box = scroller(container);
      expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
      const head = container.querySelector<HTMLElement>('thead th')!;
      const top = head.getBoundingClientRect().top;
      box.scrollTop = 1500;
      await vi.waitFor(() => expect(box.scrollTop).toBeGreaterThan(0));
      expect(head.getBoundingClientRect().top).toBe(top);
      expect(cell(container, 0, 0).getBoundingClientRect().top).toBeLessThan(
        top,
      );
    });

    test('the header is not page-sticky: it leaves the viewport when the page scrolls past the table', async () => {
      const container = await renderTable({ Table });
      const head = container.querySelector<HTMLElement>('thead th')!;
      const top = head.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + 100);
      await vi.waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
      expect(head.getBoundingClientRect().bottom).toBeLessThan(0);
      window.scrollTo(0, 0);
    });

    test('short results fit their rows; long results cap and scroll', async () => {
      const short = await renderTable({ Table, count: 8 });
      const box = scroller(short);
      expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight + 1);
      const shortHeight = box.offsetHeight;
      document.body.innerHTML = '';
      const long = await renderTable({ Table });
      console.info(
        `[spike] ${_name}: 8 rows -> ${shortHeight}px, 100 rows -> ${scroller(long).offsetHeight}px @1440x900`,
      );
      expect(shortHeight).toBeLessThan(scroller(long).offsetHeight);
    });

    test.each([992, 1024, 1280, 1440])(
      '%ipx: rail + table without page overflow',
      async (width) => {
        await page.viewport(width, 800);
        const container = await renderTable({ Table });
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
        const bounds = scroller(container).getBoundingClientRect();
        const visible = [
          ...container.querySelectorAll<HTMLElement>(
            'thead th:not(:first-child)',
          ),
        ].filter((th) => {
          const rect = th.getBoundingClientRect();
          return rect.left >= bounds.left && rect.right <= bounds.right;
        }).length;
        console.info(
          `[spike] ${_name} ${width}px: scroll viewport=${scroller(container).clientWidth}px, numeric columns fully visible=${visible}/10`,
        );
        expect(cell(container, 0, 0).getBoundingClientRect().width).toBe(240);
        expect(visible).toBeGreaterThanOrEqual(4);
      },
    );
  });
});
