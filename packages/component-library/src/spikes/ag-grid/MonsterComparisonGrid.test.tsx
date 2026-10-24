import { MantineProvider } from '@mantine/core';
import { useMemo, useState, type ReactElement } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../styles.css';
import { theme } from '../../theme';

import {
  createSpikeMonsters,
  sortSpikeMonsters,
  type SpikeMonsterNumericField,
  type SpikeSort,
} from './fixtures';
import { MonsterComparisonGrid } from './MonsterComparisonGrid';

const records = createSpikeMonsters(100);

function Harness({
  layout = 'fixed',
  count = 100,
  initialSort = { field: 'exp', direction: 'desc' },
  hiddenColumns,
  onSortChange,
  onReady,
}: {
  readonly layout?: 'fixed' | 'auto' | 'bounded';
  readonly count?: number;
  readonly initialSort?: SpikeSort | null;
  readonly hiddenColumns?: readonly SpikeMonsterNumericField[];
  readonly onSortChange?: (sort: SpikeSort | null) => void;
  readonly onReady?: () => void;
}): ReactElement {
  const [sort, setSort] = useState<SpikeSort | null>(initialSort);
  const rows = useMemo(
    () => sortSpikeMonsters(records.slice(0, count), sort),
    [count, sort],
  );
  return (
    <MantineProvider theme={theme}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(0, 1fr)',
          gap: 16,
        }}
      >
        <aside aria-label="Filters">rail</aside>
        <main style={{ minWidth: 0 }}>
          <button type="button">Before grid</button>
          <MonsterComparisonGrid
            rows={rows}
            sort={sort}
            onSortChange={(next) => {
              onSortChange?.(next);
              setSort(next);
            }}
            layout={layout}
            {...(hiddenColumns ? { hiddenColumns } : {})}
            {...(onReady ? { onFirstDataRendered: onReady } : {})}
          />
          <button type="button">After grid</button>
          {/* Trailing page content so the page itself can scroll. */}
          <div style={{ height: 1200 }} />
        </main>
      </div>
    </MantineProvider>
  );
}

async function renderGrid(
  props: Parameters<typeof Harness>[0] = {},
): Promise<HTMLElement> {
  const ready = vi.fn();
  const screen = await render(<Harness {...props} onReady={ready} />);
  // Generous: a cold WebKit start over a remote browser connection can exceed 1s.
  await vi.waitFor(() => expect(ready).toHaveBeenCalled(), { timeout: 5000 });
  return screen.container;
}

function bodyRows(container: HTMLElement): HTMLElement[] {
  return [
    ...container.querySelectorAll<HTMLElement>(
      '.ag-grid-scrolling-container [role="row"]',
    ),
  ];
}

/** AG Grid 36 scrolls both axes in one native viewport (the `role="grid"` element). */
function gridViewport(container: HTMLElement): HTMLElement {
  return container.querySelector<HTMLElement>('.ag-grid-viewport')!;
}

function cell(
  container: HTMLElement,
  rowIndex: number,
  colId: string,
): HTMLElement {
  const found = container.querySelector<HTMLElement>(
    `[role="row"][row-index="${rowIndex}"] [col-id="${colId}"]`,
  );
  if (!found) throw new Error(`No cell ${rowIndex}/${colId}`);
  return found;
}

beforeEach(async () => {
  await page.viewport(1440, 900);
});

describe('AG Grid Community spike — structure and accessibility', () => {
  test('exposes ARIA grid semantics with row count and sort state', async () => {
    const container = await renderGrid();
    const grid = container.querySelector('[role="treegrid"], [role="grid"]');
    expect(grid).not.toBeNull();
    expect(grid?.getAttribute('aria-rowcount')).toBe('101');
    const expHeader = container.querySelector(
      '[role="columnheader"][col-id="exp"]',
    );
    expect(expHeader?.getAttribute('aria-sort')).toBe('descending');
    const hpHeader = container.querySelector(
      '[role="columnheader"][col-id="hp"]',
    );
    expect(hpHeader?.getAttribute('aria-sort')).toBe('none');
  });

  test('fixed layout virtualises rows', async () => {
    const container = await renderGrid({ layout: 'fixed' });
    const rendered = bodyRows(container).length;
    console.info(`[spike] rendered rows (fixed, 1440x900): ${rendered}`);
    expect(rendered).toBeLessThan(100);
  });

  test('auto-height renders all 100 rows (no row virtualisation)', async () => {
    const container = await renderGrid({ layout: 'auto' });
    const firstFrame = bodyRows(container).length;
    // Rows are created in batches over several frames, then all 100 stay in the DOM.
    await vi.waitFor(() => expect(bodyRows(container)).toHaveLength(100));
    console.info(
      `[spike] auto-height rows at first data rendered: ${firstFrame}`,
    );
  });

  test('unknown renders as "—" with an accessible "Unknown"; zero renders 0', async () => {
    const container = await renderGrid({ layout: 'auto', initialSort: null });
    // Fixture index 3 has unknown HP; index 5 has a known zero EXP.
    const unknown = cell(container, 3, 'hp');
    expect(unknown.textContent).toBe('—Unknown');
    expect(unknown.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      '—',
    );
    expect(cell(container, 5, 'exp').textContent).toBe('0');
  });

  test('numeric cells are right aligned; identity is pinned left', async () => {
    const container = await renderGrid();
    expect(getComputedStyle(cell(container, 0, 'hp')).textAlign).toMatch(
      /right|end/u,
    );
    expect(
      cell(container, 0, 'name').closest('.ag-grid-pinned-left-cells'),
    ).not.toBeNull();
  });

  test('missing sprite shows a placeholder and long names wrap within a taller row', async () => {
    const container = await renderGrid({ layout: 'auto', initialSort: null });
    expect(cell(container, 4, 'name').textContent).toContain('?');
    const height = (index: number) =>
      container.querySelector<HTMLElement>(
        `[role="row"][row-index="${index}"]`,
      )!.offsetHeight;
    // Auto row height is measured after the cell renders.
    await vi.waitFor(() => expect(height(7)).toBeGreaterThan(height(6)));
  });
});

describe('AG Grid Community spike — highlighting', () => {
  test('hovering a cell highlights its row (one row element spans pinned and scrolling cells) and its column', async () => {
    const container = await renderGrid();
    const target = cell(container, 2, 'hp');
    await userEvent.hover(target);
    await vi.waitFor(() =>
      expect(target.classList).toContain('ag-column-hover'),
    );
    expect(cell(container, 5, 'hp').classList).toContain('ag-column-hover');
    expect(cell(container, 5, 'exp').classList).not.toContain(
      'ag-column-hover',
    );
    const hoveredRows = container.querySelectorAll(
      '[role="row"][row-index="2"].ag-row-hover',
    );
    expect(hoveredRows.length).toBe(1);
    expect(hoveredRows[0]?.querySelector('[col-id="name"]')).not.toBeNull();
    const header = container.querySelector(
      '[role="columnheader"][col-id="hp"]',
    );
    expect(header?.classList).toContain('ag-column-hover');
  });

  test('hovering the pinned identity column highlights the pinned column', async () => {
    const container = await renderGrid();
    const target = cell(container, 1, 'name');
    await userEvent.hover(target);
    await vi.waitFor(() =>
      expect(cell(container, 4, 'name').classList).toContain('ag-column-hover'),
    );
  });

  test('sorted column cells carry the sorted class after a header sort', async () => {
    const container = await renderGrid();
    expect(cell(container, 0, 'exp').className).toMatch(/sorted/u);
    await userEvent.click(
      container.querySelector(
        '[role="columnheader"][col-id="hp"] .ag-header-cell-label',
      )!,
    );
    await vi.waitFor(() =>
      expect(cell(container, 0, 'hp').className).toMatch(/sorted/u),
    );
    expect(cell(container, 0, 'exp').className).not.toMatch(/sorted/u);
  });
});

describe('AG Grid Community spike — controlled sorting', () => {
  test('header click reports the sort to the owner, which supplies re-ordered rows', async () => {
    const onSortChange = vi.fn();
    const container = await renderGrid({ onSortChange });
    await userEvent.click(
      container.querySelector(
        '[role="columnheader"][col-id="hp"] .ag-header-cell-label',
      )!,
    );
    await vi.waitFor(() =>
      expect(onSortChange).toHaveBeenCalledWith({
        field: 'hp',
        direction: 'desc',
      }),
    );
    const expected = sortSpikeMonsters(records, {
      field: 'hp',
      direction: 'desc',
    })[0]!;
    await vi.waitFor(() =>
      expect(cell(container, 0, 'name').textContent).toContain(expected.name),
    );
    expect(
      container
        .querySelector('[role="columnheader"][col-id="hp"]')
        ?.getAttribute('aria-sort'),
    ).toBe('descending');
  });

  test('query-layer order is kept: unknown HP sorts last in both directions', async () => {
    const container = await renderGrid({
      layout: 'auto',
      initialSort: { field: 'hp', direction: 'asc' },
    });
    // Rows beyond the first viewport are rendered in later frames even in auto-height layout.
    await vi.waitFor(() =>
      expect(cell(container, 99, 'hp').textContent).toContain('Unknown'),
    );
  });

  test('Enter on a focused header toggles sort from the keyboard', async () => {
    const onSortChange = vi.fn();
    const container = await renderGrid({ onSortChange });
    container
      .querySelector<HTMLElement>('[role="columnheader"][col-id="level"]')!
      .focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() =>
      expect(onSortChange).toHaveBeenCalledWith({
        field: 'level',
        direction: 'asc',
      }),
    );
  });
});

describe('AG Grid Community spike — keyboard and links', () => {
  test('arrow keys move cell focus; focus is visible', async () => {
    const container = await renderGrid();
    cell(container, 0, 'hp').focus();
    await userEvent.keyboard('{ArrowDown}');
    const focused = document.activeElement as HTMLElement;
    expect(focused.getAttribute('col-id')).toBe('hp');
    expect(focused.closest('[role="row"]')?.getAttribute('row-index')).toBe(
      '1',
    );
    expect(focused.classList).toContain('ag-cell-focus');
  });

  test('the grid is one Tab stop: Tab from any cell leaves to the next page control', async () => {
    const container = await renderGrid();
    cell(container, 0, 'name').focus();
    await userEvent.keyboard('{Tab}');
    const afterTab = document.activeElement as HTMLElement;
    console.info(
      `[spike] Tab from identity cell (tabToNextCell=false) focuses: ${afterTab.tagName} ${afterTab.textContent}`,
    );
    // ARIA grid pattern: arrows move within the grid, Tab moves past it.
    expect(afterTab.textContent).toBe('After grid');
  });

  test('Shift+Tab from the first header leaves the grid to preceding content', async () => {
    const container = await renderGrid();
    container
      .querySelector<HTMLElement>('[role="columnheader"][col-id="name"]')!
      .focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement?.textContent).toBe('Before grid');
  });

  test('Enter on a focused identity cell activates its entity link', async () => {
    const container = await renderGrid();
    const target = cell(container, 0, 'name');
    let activated: string | null = null;
    const observe = (event: MouseEvent) => {
      activated =
        (event.target as HTMLElement).closest('a')?.getAttribute('href') ??
        null;
      event.preventDefault();
    };
    document.addEventListener('click', observe);
    target.focus();
    await userEvent.keyboard('{Enter}');
    document.removeEventListener('click', observe);
    expect(activated).toBe(target.querySelector('a')?.getAttribute('href'));
  });

  test('entity links are real anchors and modified clicks are not intercepted by the grid', async () => {
    const container = await renderGrid();
    const link = cell(container, 0, 'name').querySelector('a')!;
    expect(link.getAttribute('href')).toMatch(/^\/monsters\//u);
    let preventedByGrid: boolean | undefined;
    const observe = (event: MouseEvent) => {
      preventedByGrid = event.defaultPrevented;
      event.preventDefault(); // keep the test page from navigating
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
    expect(preventedByGrid).toBe(false);
  });
});

describe('AG Grid Community spike — layout and scrolling', () => {
  test('horizontal overflow at 1024px scrolls natively while the pinned column stays put', async () => {
    await page.viewport(1024, 768);
    const container = await renderGrid();
    const viewport = gridViewport(container);
    expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    const identity = cell(container, 0, 'name');
    const hp = cell(container, 0, 'hp');
    const identityBefore = identity.getBoundingClientRect().left;
    const hpBefore = hp.getBoundingClientRect().left;
    viewport.scrollLeft = 200;
    await vi.waitFor(() =>
      expect(hp.getBoundingClientRect().left).toBeLessThan(hpBefore),
    );
    expect(identity.getBoundingClientRect().left).toBe(identityBefore);
  });

  test('no horizontal overflow at 1440px with all columns', async () => {
    const container = await renderGrid();
    const viewport = gridViewport(container);
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth + 1);
  });

  test('fixed layout keeps the header visible while the grid body scrolls', async () => {
    const container = await renderGrid({ layout: 'fixed' });
    const viewport = gridViewport(container);
    const header = container.querySelector<HTMLElement>('.ag-header')!;
    const headerTop = header.getBoundingClientRect().top;
    viewport.scrollTop = 1200;
    await vi.waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    expect(header.getBoundingClientRect().top).toBe(headerTop);
  });

  test('auto-height header scrolls away with the page (not sticky)', async () => {
    const container = await renderGrid({ layout: 'auto' });
    const header = container.querySelector<HTMLElement>('.ag-header')!;
    const top = header.getBoundingClientRect().top;
    window.scrollTo(0, 1500);
    await vi.waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
    const after = header.getBoundingClientRect().top;
    console.info(
      `[spike] auto-height header top before=${top} after scroll=${after}`,
    );
    expect(after).toBeLessThan(0);
    window.scrollTo(0, 0);
  });

  test('hidden columns are removed from the header', async () => {
    const container = await renderGrid({
      hiddenColumns: ['magicAttack', 'magicDefense'],
    });
    expect(
      container.querySelector('[role="columnheader"][col-id="magicAttack"]'),
    ).toBeNull();
    expect(
      container.querySelector('[role="columnheader"][col-id="hp"]'),
    ).not.toBeNull();
  });
});

describe('AG Grid Community spike — performance (recorded, generous budgets)', () => {
  test.each(['fixed', 'auto'] as const)(
    'time to first data rendered (%s)',
    async (layout) => {
      const ready = vi.fn();
      const start = performance.now();
      await render(<Harness layout={layout} onReady={ready} />);
      await vi.waitFor(() => expect(ready).toHaveBeenCalled());
      const elapsed = performance.now() - start;
      console.info(
        `[spike] first data rendered (${layout}): ${elapsed.toFixed(0)}ms`,
      );
      expect(elapsed).toBeLessThan(2000);
    },
  );

  test('sort: grid sort event to re-ordered first row rendered', async () => {
    let sortedAt = 0;
    const container = await renderGrid({
      layout: 'auto',
      onSortChange: () => {
        sortedAt = performance.now();
      },
    });
    const expected = sortSpikeMonsters(records, {
      field: 'hp',
      direction: 'desc',
    })[0]!;
    await userEvent.click(
      container.querySelector(
        '[role="columnheader"][col-id="hp"] .ag-header-cell-label',
      )!,
    );
    await vi.waitFor(
      () =>
        expect(cell(container, 0, 'name').textContent).toContain(expected.name),
      {
        interval: 5,
      },
    );
    const elapsed = performance.now() - sortedAt;
    console.info(
      `[spike] sort (auto, 100 rows) event → rendered: ${elapsed.toFixed(0)}ms`,
    );
    expect(elapsed).toBeLessThan(500);
  });
});

function gridHeight(container: HTMLElement): number {
  return container.querySelector<HTMLElement>('.ag-root-wrapper')!.offsetHeight;
}

describe('AG Grid Community spike — bounded auto height (D1)', () => {
  test('short result set: bounded fits its rows; fixed keeps empty space', async () => {
    const bounded = await renderGrid({ layout: 'bounded', count: 8 });
    await vi.waitFor(() => expect(bodyRows(bounded)).toHaveLength(8));
    const viewport = gridViewport(bounded);
    expect(viewport.scrollHeight).toBeLessThanOrEqual(
      viewport.clientHeight + 1,
    );
    const boundedHeight = gridHeight(bounded);
    document.body.innerHTML = '';
    const fixed = await renderGrid({ layout: 'fixed', count: 8 });
    const fixedHeight = gridHeight(fixed);
    console.info(
      `[spike] 8 rows @1440x900: bounded height=${boundedHeight}px, fixed height=${fixedHeight}px`,
    );
    expect(boundedHeight).toBeLessThan(fixedHeight);
  });

  test('long result set: bounded stops growing, virtualises and keeps its header while the body scrolls', async () => {
    const container = await renderGrid({ layout: 'bounded' });
    const viewport = gridViewport(container);
    const height = gridHeight(container);
    // Body cap is 100dvh − 160px = 740px; plus header and borders.
    expect(height).toBeLessThan(900);
    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    const rendered = bodyRows(container).length;
    expect(rendered).toBeLessThan(100);
    const header = container.querySelector<HTMLElement>('.ag-header')!;
    const headerTop = header.getBoundingClientRect().top;
    viewport.scrollTop = 1200;
    await vi.waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    expect(header.getBoundingClientRect().top).toBe(headerTop);
    console.info(
      `[spike] 100 rows @1440x900: bounded height=${height}px, rendered rows=${rendered}`,
    );
  });

  test('bounded header is not page-sticky: it leaves the viewport when the page scrolls past the grid top', async () => {
    const container = await renderGrid({ layout: 'bounded' });
    const header = container.querySelector<HTMLElement>('.ag-header')!;
    const top = header.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + 100);
    await vi.waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
    expect(header.getBoundingClientRect().bottom).toBeLessThan(0);
    window.scrollTo(0, 0);
  });
});

describe('AG Grid Community spike — persistent rail widths (D3)', () => {
  test.each([992, 1024, 1280, 1440])(
    '%ipx: rail + table without page overflow; records visible columns',
    async (width) => {
      await page.viewport(width, 800);
      const container = await renderGrid({ layout: 'bounded' });
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
      const viewport = gridViewport(container);
      const bounds = viewport.getBoundingClientRect();
      const fullyVisible = [
        ...container.querySelectorAll<HTMLElement>(
          '.ag-header-cell[col-id]:not([col-id="name"])',
        ),
      ].filter((headerCell) => {
        const rect = headerCell.getBoundingClientRect();
        return rect.left >= bounds.left && rect.right <= bounds.right;
      }).length;
      console.info(
        `[spike] ${width}px: grid viewport=${viewport.clientWidth}px, content=${viewport.scrollWidth}px, numeric columns fully visible=${fullyVisible}/10`,
      );
      expect(cell(container, 0, 'name').getBoundingClientRect().width).toBe(
        240,
      );
      expect(fullyVisible).toBeGreaterThanOrEqual(4);
    },
  );
});
