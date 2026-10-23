import { afterEach, describe, expect, test, vi } from 'vitest';
import { commands, page, server, userEvent } from 'vitest/browser';

import { MonsterMantineTable } from './MonsterMantineTable';
import { MonsterTanStackTable } from './MonsterTanStackTable';
import { bodyRows, cell, renderTable, tabUntil } from './testing';

afterEach(async () => {
  await commands.emulateMedia({ forcedColors: 'none' });
});

// Playwright's emulateMedia is only wired through for Chromium in this setup.
describe.skipIf(server.browser !== 'chromium').each([
  ['Mantine Table + TanStack Table', MonsterTanStackTable],
  ['Mantine Table alone', MonsterMantineTable],
] as const)('forced colors: %s', (_name, Table) => {
  test('forced-colors media is applied; hover and focus keep non-color indications', async () => {
    await page.viewport(1440, 900);
    await commands.emulateMedia({ forcedColors: 'active' });
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const container = await renderTable({ Table });

    // Row hover: outline (background tints are overridden by the UA).
    await userEvent.hover(cell(container, 2, 3));
    await vi.waitFor(() =>
      expect(getComputedStyle(bodyRows(container)[2]!).outlineStyle).toBe(
        'solid',
      ),
    );

    // Column hover: the overlay is replaced by an outline on the hovered cell.
    const target = cell(container, 3, 5);
    await userEvent.hover(target);
    await vi.waitFor(() =>
      expect(getComputedStyle(target, '::after').outlineStyle).toBe('solid'),
    );

    // Pinned cells stay opaque (Canvas) so scrolled content never shows through.
    expect(getComputedStyle(cell(container, 0, 0)).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    );

    // Keyboard focus is a real outline on the link.
    await tabUntil(container, (active) => active.tagName === 'A');
    const link = document.activeElement as HTMLElement;
    expect(link.tagName).toBe('A');
    expect(getComputedStyle(link).outlineStyle).not.toBe('none');

    // Sort state is conveyed by aria-sort and the arrow glyph, not by color.
    expect(
      container.querySelector('th[aria-sort="descending"]')?.textContent,
    ).toContain('↓');
  });
});
