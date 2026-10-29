import { MantineProvider } from '@mantine/core';
import { theme } from '@mapletip/theme';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import '@/styles.css';
import { NeutralBrowserMarkup } from '@/components/FacetedBrowser/__tests__/fixtures/NeutralBrowserMarkup';
import { FacetedBrowser } from '@/components/FacetedBrowser/FacetedBrowser';
import { ComparisonTable } from '@/components/Table/ComparisonTable';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

let cleanup: (() => void) | undefined;

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  document.documentElement.removeAttribute('data-mantine-color-scheme');
});

describe('FacetedBrowser hydration', () => {
  it('hydrates server markup without recoverable errors or a measurable layout shift', async () => {
    await page.viewport(1440, 900);
    document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );

    const tree = (
      <MantineProvider theme={theme} forceColorScheme="light">
        <NeutralBrowserMarkup />
      </MantineProvider>
    );
    const host = document.createElement('div');
    host.style.width = '1000px';
    host.style.maxWidth = '100vw';
    document.body.append(host);
    host.innerHTML = renderToString(tree);

    const table = host.querySelector('table')!;
    const before = table.getBoundingClientRect();
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;

    await act(async () => {
      root = hydrateRoot(host, tree, {
        onRecoverableError: (error) => errors.push(error),
      });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });

    const after = host.querySelector('table')!.getBoundingClientRect();
    expect(errors).toEqual([]);
    expect(host.querySelectorAll('table a[href^="/records/"]')).toHaveLength(
      100,
    );
    expect(
      host.querySelectorAll(
        '[aria-label="records cards"] a[href^="/records/"]',
      ),
    ).toHaveLength(100);
    expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);

    cleanup = () => {
      act(() => root?.unmount());
      host.remove();
    };
  });

  it('hydrates DataTable with poisoned empty-string localStorage state', async () => {
    await page.viewport(1440, 900);
    document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    localStorage.setItem('', '[]');

    const tree = (
      <MantineProvider theme={theme} forceColorScheme="light">
        <NeutralBrowserMarkup />
      </MantineProvider>
    );
    const host = document.createElement('div');
    host.style.width = '1000px';
    host.style.maxWidth = '100vw';
    document.body.append(host);
    host.innerHTML = renderToString(tree);

    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;

    try {
      await act(async () => {
        root = hydrateRoot(host, tree, {
          onRecoverableError: (error) => errors.push(error),
        });
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      });

      expect(errors).toEqual([]);
      expect(host.querySelector('table')).not.toBeNull();
      expect(host.querySelectorAll('table a[href^="/records/"]')).toHaveLength(
        100,
      );
    } finally {
      act(() => root?.unmount());
      host.remove();
      localStorage.removeItem('');
    }
  });

  it('hydrates two expandable tables with instance-scoped control ids', async () => {
    await page.viewport(1440, 900);
    document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const records = demoRecords.slice(0, 4);
    const columns = makeDemoColumns();
    const tree = (
      <MantineProvider theme={theme} forceColorScheme="light">
        <ComparisonTable
          ariaLabel="First expandable records"
          records={records}
          columns={columns}
          idAccessor="id"
          identityField="name"
          rowExpansionContent={(record) => (
            <a href={record.href}>First details for {record.name}</a>
          )}
        />
        <ComparisonTable
          ariaLabel="Second expandable records"
          records={records}
          columns={columns}
          idAccessor="id"
          identityField="name"
          rowExpansionContent={(record) => (
            <a href={record.href}>Second details for {record.name}</a>
          )}
        />
      </MantineProvider>
    );
    const host = document.createElement('div');
    host.style.width = '1200px';
    host.style.maxWidth = '100vw';
    document.body.append(host);
    host.innerHTML = renderToString(tree);

    const serverControls = [
      ...host.querySelectorAll<HTMLButtonElement>(
        'button[aria-label^="Expand details"]',
      ),
    ].map((button) => button.getAttribute('aria-controls'));
    expect(serverControls).toHaveLength(8);
    expect(new Set(serverControls).size).toBe(8);

    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(host, tree, {
        onRecoverableError: (error) => errors.push(error),
      });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });

    expect(errors).toEqual([]);
    await act(async () => {
      await page
        .getByRole('button', { name: 'Expand details for Record 001' })
        .first()
        .click();
      await page
        .getByRole('button', { name: 'Expand details for Record 001' })
        .first()
        .click();
    });
    await vi.waitFor(() => {
      const detailLinks = [...host.querySelectorAll('a')].filter((link) =>
        link.textContent?.includes('details for'),
      );
      expect(detailLinks).toHaveLength(2);
    });

    cleanup = () => {
      act(() => root?.unmount());
      host.remove();
    };
  });

  it('hydrates an integrated card-only FacetedBrowser without errors', async () => {
    const tree = (
      <MantineProvider theme={theme} forceColorScheme="light">
        <FacetedBrowser
          title={<h1>Live Browser</h1>}
          records={demoRecords.slice(0, 10)}
          idAccessor="id"
          presentation="cards"
          renderCard={(record) => <a href={record.href}>{record.name}</a>}
          defaultState={{
            search: '',
            filters: {},
            page: 1,
            pageSize: 10,
            hiddenColumns: [],
          }}
        />
      </MantineProvider>
    );

    const host = document.createElement('div');
    document.body.append(host);
    host.innerHTML = renderToString(tree);

    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;

    await act(async () => {
      root = hydrateRoot(host, tree, {
        onRecoverableError: (err) => errors.push(err),
      });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    });

    expect(errors).toEqual([]);
    expect(
      host.querySelectorAll('[aria-label="records cards"] a'),
    ).toHaveLength(10);
    expect(host.querySelector('a[href="/records/record-001"]')).not.toBeNull();

    act(() => root?.unmount());
    host.remove();
  });
});
