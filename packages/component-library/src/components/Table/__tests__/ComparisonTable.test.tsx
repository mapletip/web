import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commands, page, server, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../../styles.css';
import { ComparisonTable } from '@/components/Table/ComparisonTable';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

beforeEach(async () => {
  document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  await page.viewport(1024, 768);
});

async function mount({
  field = 'value1',
  direction = 'desc',
}: {
  readonly field?: string;
  readonly direction?: 'asc' | 'desc';
} = {}) {
  const columns = makeDemoColumns();
  const rows = demoRecords.slice(0, 12);
  await render(
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver}>
      <ComparisonTable
        ariaLabel="Sample comparison"
        records={rows}
        columns={columns}
        idAccessor="id"
        identityField="name"
        sortStatus={{ field, direction }}
        onSortChange={() => undefined}
      />
    </MantineProvider>,
  );
  await vi.waitFor(() =>
    expect(document.querySelector('tbody tr')).not.toBeNull(),
  );
}

describe('ComparisonTable', () => {
  it('pins the identity column first even when the input order differs', async () => {
    const columns = makeDemoColumns();
    await render(
      <MantineProvider theme={theme}>
        <ComparisonTable
          ariaLabel="Sample comparison"
          records={demoRecords.slice(0, 4)}
          columns={[...columns.slice(1), columns[0]!]}
          idAccessor="id"
          identityField="name"
          onSortChange={() => undefined}
        />
      </MantineProvider>,
    );
    const headers = [...document.querySelectorAll('thead th')];
    expect(headers[0]?.textContent).toContain('Record');
    expect(
      getComputedStyle(document.querySelector('tbody tr :first-child')!)
        .position,
    ).toBe('sticky');
  });

  it('documents the accepted DataTable semantics (upstream #844)', async () => {
    // These assertions record the ACTUAL upstream behavior; flip them if upstream fixes #844.
    await mount();
    const table = document.querySelector('table')!;
    expect(table.getAttribute('aria-label')).toBe('Sample comparison');
    expect(table.querySelector('caption')).toBeNull();
    const sortable = document.querySelectorAll('thead th[role="button"]');
    expect(sortable.length).toBeGreaterThan(0);
    expect(document.querySelector('thead th[aria-sort]')).toBeNull();
    const identityCell = document.querySelector(
      'tbody tr:first-child :first-child',
    )!;
    expect(identityCell.tagName).toBe('TD');
    expect(identityCell.getAttribute('data-pinned')).toBe('left');
  });

  it('wraps a long identity label and right-aligns numeric cells', async () => {
    const columns = makeDemoColumns().map((column) =>
      column.accessor === 'name' ? { ...column, width: 240 } : column,
    );
    await render(
      <MantineProvider theme={theme}>
        <ComparisonTable
          ariaLabel="Long labels"
          records={demoRecords.slice(0, 12)}
          columns={columns}
          idAccessor="id"
          identityField="name"
          onSortChange={() => undefined}
        />
      </MantineProvider>,
    );
    const shortCell = document.querySelector<HTMLTableCellElement>(
      'tbody tr:first-child :first-child',
    )!;
    const longCell = document.querySelector<HTMLTableCellElement>(
      'tbody tr:nth-child(8) :first-child',
    )!;
    expect(longCell.offsetHeight).toBeGreaterThan(shortCell.offsetHeight);
    expect(
      getComputedStyle(document.querySelector('tbody tr td:nth-child(3)')!)
        .textAlign,
    ).toBe('right');
  });

  it('keeps horizontal scrolling inside the table at 320 px and pins identity', async () => {
    await page.viewport(320, 640);
    await render(
      <MantineProvider theme={theme}>
        <ComparisonTable
          ariaLabel="Narrow comparison"
          records={demoRecords.slice(0, 12)}
          columns={makeDemoColumns()}
          idAccessor="id"
          identityField="name"
          maxHeight={480}
          onSortChange={() => undefined}
        />
      </MantineProvider>,
    );
    const scrollArea = document.querySelector<HTMLElement>(
      '[data-scrollarea-viewport="true"]',
    )!;
    expect(scrollArea.scrollWidth).toBeGreaterThan(scrollArea.clientWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    scrollArea.scrollLeft = 160;
    const identity = document.querySelector<HTMLTableCellElement>(
      'tbody tr:first-child :first-child',
    )!;
    expect(
      Math.abs(
        identity.getBoundingClientRect().left -
          scrollArea.getBoundingClientRect().left,
      ),
    ).toBeLessThanOrEqual(1);
  });

  it('scrolls a bounded maxHeight region with a sticky header and pinned identity', async () => {
    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
      >
        <ComparisonTable
          ariaLabel="Bounded comparison"
          records={demoRecords.slice(0, 30)}
          columns={makeDemoColumns()}
          idAccessor="id"
          identityField="name"
          maxHeight={240}
          onSortChange={() => undefined}
        />
      </MantineProvider>,
    );

    const viewport = document.querySelector<HTMLElement>(
      '[data-scrollarea-viewport="true"]',
    )!;
    const table = document.querySelector('table')!;
    const header = document.querySelector<HTMLElement>('thead')!;

    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    expect(getComputedStyle(table).overflowY).toBe('clip');
    // clip must not turn the table into a second horizontal scroll container.
    expect(getComputedStyle(table).overflowX).toBe('visible');

    viewport.scrollTop = 160;
    viewport.scrollLeft = 120;
    await vi.waitFor(() => {
      expect(viewport.scrollTop).toBeGreaterThan(0);
      expect(viewport.scrollLeft).toBeGreaterThan(0);
      expect(
        Math.abs(
          header.getBoundingClientRect().top -
            viewport.getBoundingClientRect().top,
        ),
      ).toBeLessThanOrEqual(1);
    });

    const identity = document.querySelector<HTMLTableCellElement>(
      'tbody tr td[data-pinned]',
    )!;
    expect(
      Math.abs(
        identity.getBoundingClientRect().left -
          viewport.getBoundingClientRect().left,
      ),
    ).toBeLessThanOrEqual(1);
  });

  it('resizes columns while keeping the identity pinned and scrollable', async () => {
    window.localStorage.clear();
    await mount();

    const header = document.querySelector<HTMLElement>(
      'thead th[data-accessor="group"]',
    )!;
    const handle = header.querySelector<HTMLElement>(
      '.mantine-datatable-header-resizable-handle',
    );
    expect(handle).not.toBeNull();
    expect(
      document
        .querySelector('thead th[data-accessor="name"]')
        ?.getAttribute('data-pinned'),
    ).toBe('left');

    const initialWidth = header.getBoundingClientRect().width;
    handle!.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        clientX: header.getBoundingClientRect().right,
      }),
    );
    document.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: header.getBoundingClientRect().right + 48,
      }),
    );
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await vi.waitFor(
      () => {
        expect(header.getBoundingClientRect().width).toBeGreaterThan(
          initialWidth,
        );
      },
      { timeout: 5_000 },
    );

    await page.viewport(320, 640);
    const scrollArea = document.querySelector<HTMLElement>(
      '[data-scrollarea-viewport="true"]',
    )!;
    expect(scrollArea.scrollWidth).toBeGreaterThan(scrollArea.clientWidth);
    scrollArea.scrollLeft = 120;
    const identity = document.querySelector<HTMLTableCellElement>(
      'tbody tr:first-child :first-child',
    )!;
    expect(
      Math.abs(
        identity.getBoundingClientRect().left -
          scrollArea.getBoundingClientRect().left,
      ),
    ).toBeLessThanOrEqual(1);
    expect(identity.getAttribute('data-pinned')).toBe('left');
    window.localStorage.clear();
  });

  it('keeps pinned identity cells opaque when another column is hovered', async () => {
    await mount();
    const identity = document.querySelector<HTMLTableCellElement>(
      'tbody tr:first-child :first-child',
    )!;
    const numeric = document.querySelector<HTMLTableCellElement>(
      'tbody tr:first-child td:nth-child(3)',
    )!;
    await userEvent.hover(numeric);
    await vi.waitFor(() => {
      const color = getComputedStyle(identity).backgroundColor;
      expect(color).not.toBe('transparent');
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
    });
  });

  it('highlights Record, Category and numeric body columns', async () => {
    await mount();
    const row = document.querySelector<HTMLTableRowElement>(
      'tbody tr:nth-child(2)',
    )!;
    for (const columnIndex of [1, 2, 4]) {
      const hovered = row.children[columnIndex - 1] as HTMLTableCellElement;
      await userEvent.hover(hovered);
      expect(getComputedStyle(row).backgroundColor).not.toBe('transparent');
      expect(getComputedStyle(hovered, '::before').content).toBe('""');
      expect(getComputedStyle(hovered, '::before').backgroundColor).not.toBe(
        'transparent',
      );
    }
  });

  it('moves the column emphasis with the pointer and clears it on leave', async () => {
    await mount();
    const firstColumn = document.querySelector<HTMLTableCellElement>(
      'tbody tr:nth-child(2) td:nth-child(2)',
    )!;
    const secondColumn = document.querySelector<HTMLTableCellElement>(
      'tbody tr:nth-child(2) td:nth-child(4)',
    )!;
    const tableHeight = document
      .querySelector('table')!
      .getBoundingClientRect().height;

    await userEvent.hover(firstColumn);
    const firstOverlay = getComputedStyle(firstColumn, '::before');
    expect(firstOverlay.content).toBe('""');
    // The overlay is taller than the table, so the emphasis spans every row.
    expect(
      Math.abs(Number.parseFloat(firstOverlay.top)),
    ).toBeGreaterThanOrEqual(tableHeight);
    expect(
      Math.abs(Number.parseFloat(firstOverlay.bottom)),
    ).toBeGreaterThanOrEqual(tableHeight);

    await userEvent.hover(secondColumn);
    expect(getComputedStyle(secondColumn, '::before').content).toBe('""');
    expect(getComputedStyle(firstColumn, '::before').content).toBe('none');

    await userEvent.unhover(secondColumn);
    expect(getComputedStyle(secondColumn, '::before').content).toBe('none');
  });

  it('layers the full-height Record highlight above sibling pinned cells', async () => {
    await mount();
    const hovered = document.querySelector<HTMLTableCellElement>(
      'tbody tr:first-child :first-child',
    )!;
    const sibling = document.querySelector<HTMLTableCellElement>(
      'tbody tr:nth-child(2) :first-child',
    )!;

    await userEvent.hover(hovered);

    expect(hovered.hasAttribute('data-pinned')).toBe(true);
    expect(getComputedStyle(hovered).zIndex).toBe('3');
    expect(getComputedStyle(sibling).zIndex).toBe('2');
    const overlay = getComputedStyle(hovered, '::before');
    expect(overlay.top).not.toBe('0px');
    expect(overlay.bottom).not.toBe('0px');
  });

  it('uses the approved dark surfaces and native row hover in the dark scheme', async () => {
    document.documentElement.setAttribute('data-mantine-color-scheme', 'dark');
    await render(
      <MantineProvider theme={theme} forceColorScheme="dark">
        <ComparisonTable
          ariaLabel="Dark comparison"
          records={demoRecords.slice(0, 12)}
          columns={makeDemoColumns()}
          idAccessor="id"
          identityField="name"
          sortStatus={{ field: 'value1', direction: 'desc' }}
          onSortChange={() => undefined}
        />
      </MantineProvider>,
    );

    const row = document.querySelector<HTMLTableRowElement>(
      'tbody tr:first-child',
    )!;
    const numericCell =
      row.querySelector<HTMLTableCellElement>('td:nth-child(4)')!;
    expect(getComputedStyle(document.body).backgroundColor).toBe(
      'rgb(17, 17, 20)',
    );
    await userEvent.hover(numericCell);
    expect(getComputedStyle(row).backgroundColor).toBe('rgb(36, 36, 40)');
    expect(getComputedStyle(numericCell, '::before').backgroundColor).not.toBe(
      'transparent',
    );
  });

  it('renders unknown values with the body text color and announces Unknown', async () => {
    await render(
      <MantineProvider theme={theme}>
        <ComparisonTable
          ariaLabel="Unknown and zero values"
          records={demoRecords.slice(3, 6)}
          columns={makeDemoColumns()}
          idAccessor="id"
          identityField="name"
          onSortChange={() => undefined}
        />
      </MantineProvider>,
    );
    const unknown = document.querySelector<HTMLElement>(
      '[data-testid="unknown-value"]',
    )!;
    expect(getComputedStyle(unknown).color).not.toBe('rgb(134, 142, 150)');
    await expect
      .element(page.getByRole('cell', { name: 'Unknown' }))
      .toBeInTheDocument();
    await expect
      .element(page.getByRole('cell', { name: '0' }))
      .toBeInTheDocument();
  });

  it('keeps entity links as ordinary anchors', async () => {
    await mount();
    const link = page.getByRole('link', { name: /Record 001/u });
    expect(link.element().getAttribute('href')).toBe('/records/record-001');
    // Keep the Vitest iframe on its harness route while preserving native link behavior.
    link.element().setAttribute('target', '_blank');
    link.element().setAttribute('rel', 'noreferrer');
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    });
    link.element().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('keeps the missing-image placeholder hidden from assistive technology', async () => {
    await render(
      <MantineProvider theme={theme}>
        <ComparisonTable
          ariaLabel="Missing image"
          records={demoRecords.slice(4, 5)}
          columns={makeDemoColumns()}
          idAccessor="id"
          identityField="name"
          onSortChange={() => undefined}
        />
      </MantineProvider>,
    );
    const link = page.getByRole('link', { name: 'Record 005' }).element();
    expect(
      link.querySelector('[data-testid="missing-image-placeholder"]'),
    ).not.toBeNull();
    expect(
      link
        .querySelector('[data-testid="missing-image-placeholder"]')
        ?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('outlines a row when a record link receives keyboard focus', async () => {
    await mount();
    const firstLink = document.querySelector<HTMLAnchorElement>(
      'tbody tr:first-child a',
    )!;
    firstLink.focus({ focusVisible: true });
    expect(getComputedStyle(firstLink.closest('tr')!).outlineStyle).toBe(
      'solid',
    );
    expect(getComputedStyle(firstLink).outlineStyle).toBe('solid');
    expect(getComputedStyle(firstLink).outlineWidth).toBe('2px');
  });

  it('tabs through sortable headers and then record links in reading order', async () => {
    await mount();
    const headers = [
      ...document.querySelectorAll<HTMLElement>('thead th[role="button"]'),
    ];
    const links = [...document.querySelectorAll<HTMLAnchorElement>('tbody a')];
    headers[0]!.focus();
    for (const header of headers.slice(1)) {
      await userEvent.tab();
      expect(document.activeElement).toBe(header);
    }
    await userEvent.tab();
    expect(document.activeElement).toBe(links[0]);
  });

  it.skipIf(server.browser !== 'chromium')(
    'uses system outlines in forced-colors mode',
    async () => {
      await mount();
      await commands.emulateMedia({ forcedColors: 'active' });
      const row = document.querySelector<HTMLTableRowElement>(
        'tbody tr:nth-child(2)',
      )!;
      const numeric =
        row.querySelector<HTMLTableCellElement>('td:nth-child(4)')!;
      await userEvent.hover(numeric);
      expect(getComputedStyle(row).outlineWidth).toBe('1px');
      expect(getComputedStyle(numeric, '::before').outlineWidth).toBe('2px');
      await commands.emulateMedia({ forcedColors: 'none' });
    },
  );
});
