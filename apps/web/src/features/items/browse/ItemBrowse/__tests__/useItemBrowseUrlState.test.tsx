import { MantineProvider } from '@mantine/core';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { BrowseContext, ItemBrowseSearch } from '../../search-params';
import {
  useItemBrowseUrlState,
  type UseItemBrowseUrlStateResult,
} from '../useItemBrowseUrlState';

describe('useItemBrowseUrlState', () => {
  const dummyContext: BrowseContext = {
    facets: [],
    sortOptions: [
      { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
      { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
    ],
  };

  async function setup({
    searchProp,
    onSearchChange,
  }: {
    searchProp?: ItemBrowseSearch;
    onSearchChange?: (
      nextSearch: Record<string, unknown>,
      replace: boolean,
    ) => void;
  }) {
    let latestResult!: UseItemBrowseUrlStateResult;

    function TestConsumer() {
      latestResult = useItemBrowseUrlState({
        searchProp,
        browseContext: dummyContext,
        onSearchChange,
      });
      return null;
    }

    const rootRoute = createRootRoute({ component: () => <Outlet /> });
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: TestConsumer,
    });
    const testTree = rootRoute.addChildren([indexRoute]);
    const history = createMemoryHistory({ initialEntries: ['/'] });
    const router = createRouter({ routeTree: testTree, history });
    await router.load();

    render(
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    return {
      getResult: () => latestResult,
      router,
    };
  }

  it('debounces text search typing and uses replace: true', async () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    const { getResult } = await setup({ onSearchChange });

    act(() => {
      getResult().handleStateChange({
        ...getResult().browseState,
        search: 'pot',
      });
    });

    // Immediate local search
    expect(getResult().localSearch).toBe('pot');
    expect(onSearchChange).not.toHaveBeenCalled();

    // After debounce
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onSearchChange).toHaveBeenCalledWith({ q: 'pot' }, true);
    vi.useRealTimers();
  });

  it('emits discrete change with replace: false', async () => {
    const onSearchChange = vi.fn();
    const { getResult } = await setup({ onSearchChange });

    act(() => {
      getResult().handleStateChange({
        ...getResult().browseState,
        page: 2,
      });
    });

    expect(onSearchChange).toHaveBeenCalledWith({ page: 2 }, false);
  });

  it('emits corrective clamp transition with replace: true', async () => {
    const onSearchChange = vi.fn();
    const { getResult } = await setup({ onSearchChange });

    act(() => {
      getResult().handleStateChange(
        {
          ...getResult().browseState,
          page: 1,
        },
        { reason: 'clamp' },
      );
    });

    expect(onSearchChange).toHaveBeenCalledWith({}, true);
  });

  it('builds real location href for getPageHref', async () => {
    const { getResult } = await setup({});
    const href = getResult().getPageHref(2, {
      ...getResult().browseState,
      page: 2,
    });
    expect(href).toBe('/?page=2');
  });
});
