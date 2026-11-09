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
import { useState } from 'react';
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
    let updateSearch!: (
      nextSearch: ItemBrowseSearch,
      nextResetKey?: string,
    ) => void;
    let currentSearch = searchProp;
    let stateResetKey = 'test';

    function TestConsumer() {
      const [, setVersion] = useState(0);
      updateSearch = (nextSearch, nextResetKey = stateResetKey) => {
        currentSearch = nextSearch;
        stateResetKey = nextResetKey;
        setVersion((version) => version + 1);
      };
      latestResult = useItemBrowseUrlState({
        searchProp: currentSearch,
        browseContext: dummyContext,
        stateResetKey,
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
      updateSearch: (nextSearch: ItemBrowseSearch, nextResetKey?: string) =>
        updateSearch(nextSearch, nextResetKey),
      router,
    };
  }

  it('debounces text search typing and uses replace: true', async () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    const { getResult } = await setup({
      searchProp: { page: 2 },
      onSearchChange,
    });

    act(() => {
      getResult().handleStateChange({
        ...getResult().browseState,
        search: 'pot',
        page: 1,
      });
    });

    // Immediate local search
    expect(getResult().localSearch).toBe('pot');
    expect(getResult().browseState.page).toBe(1);
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

  it('cancels a debounced search when the URL changes externally', async () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    const { getResult, updateSearch } = await setup({
      searchProp: { q: 'old', page: 2 },
      onSearchChange,
    });

    act(() => {
      getResult().handleStateChange({
        ...getResult().browseState,
        search: 'draft',
        page: 1,
      });
    });

    act(() => {
      updateSearch({ q: 'back', page: 3 });
    });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(getResult().localSearch).toBe('back');
    expect(getResult().browseState.page).toBe(3);
    expect(onSearchChange).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('resets pending state when the route context changes', async () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    const { getResult, updateSearch } = await setup({
      searchProp: { q: 'old', page: 2 },
      onSearchChange,
    });

    act(() => {
      getResult().handleStateChange({
        ...getResult().browseState,
        search: 'draft',
        page: 1,
      });
    });

    act(() => {
      updateSearch({ q: 'old', page: 2 }, 'other-route');
    });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(getResult().localSearch).toBe('old');
    expect(getResult().browseState.page).toBe(2);
    expect(onSearchChange).not.toHaveBeenCalled();
    vi.useRealTimers();
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
