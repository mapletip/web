import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { defineBrowseSearch, type BrowseSearch } from '../search-params';
import {
  useBrowseUrlState,
  type OnSearchChangeOptions,
  type UseBrowseUrlStateResult,
} from '../useBrowseUrlState';

const NAME_SORTS = [
  { label: 'Name (A–Z)', field: 'name', direction: 'asc' },
  { label: 'Name (Z–A)', field: 'name', direction: 'desc' },
] as const;
const address = defineBrowseSearch({ sortOptions: NAME_SORTS });
const browseSearchSchema = address.schema;

describe('useBrowseUrlState', () => {
  function setup({
    search = browseSearchSchema.parse({}),
    onSearchChange = vi.fn(),
    contextKey = 'all',
    defaultHiddenColumns = [],
    sortOptions = NAME_SORTS,
  }: {
    readonly search?: BrowseSearch;
    readonly onSearchChange?: (
      options: OnSearchChangeOptions,
    ) => void | Promise<void>;
    readonly contextKey?: string;
    readonly defaultHiddenColumns?: readonly string[];
    readonly sortOptions?: typeof NAME_SORTS;
  } = {}) {
    let latestResult: UseBrowseUrlStateResult | undefined;

    function TestConsumer() {
      latestResult = useBrowseUrlState({
        address,
        search,
        onSearchChange,
        contextKey,
        defaultHiddenColumns,
        sortOptions,
      });
      return null;
    }

    render(<TestConsumer />);
    return {
      getResult: () => {
        if (!latestResult) throw new Error('Hook has not rendered.');
        return latestResult;
      },
      onSearchChange,
    };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces text search and requests replace history', () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    const { getResult } = setup({ onSearchChange });

    act(() => {
      void getResult().handleStateChange({
        ...getResult().browseState,
        search: 'pot',
      });
    });
    expect(getResult().browseState.search).toBe('pot');
    expect(onSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(onSearchChange).toHaveBeenCalledWith({
      search: { q: 'pot', page: 1, pageSize: 50, sort: 'name-asc' },
      replace: true,
    });
  });

  it('pushes discrete state changes', () => {
    const onSearchChange = vi.fn();
    const { getResult } = setup({ onSearchChange });

    act(() => {
      void getResult().handleStateChange({
        ...getResult().browseState,
        page: 2,
      });
    });

    expect(onSearchChange).toHaveBeenCalledWith({
      search: { q: '', page: 2, pageSize: 50, sort: 'name-asc' },
      replace: false,
    });
  });

  it('initializes the current context column visibility defaults', () => {
    const { getResult } = setup({
      contextKey: 'use:scrolls',
      defaultHiddenColumns: ['specials'],
    });

    expect(getResult().browseState.hiddenColumns).toEqual(['specials']);
  });

  it('pushes facet changes with active options and resets the page', () => {
    const onSearchChange = vi.fn();
    const { getResult } = setup({
      search: browseSearchSchema.parse({ page: 4 }),
      onSearchChange,
    });

    act(() => {
      void getResult().handleStateChange({
        ...getResult().browseState,
        page: 1,
        filters: { types: ['potion'] },
      });
    });

    expect(onSearchChange).toHaveBeenCalledWith({
      search: {
        q: '',
        page: 1,
        pageSize: 50,
        sort: 'name-asc',
        types: ['potion'],
      },
      replace: false,
    });
  });

  it('replaces clamp corrections', () => {
    const onSearchChange = vi.fn();
    const { getResult } = setup({
      search: browseSearchSchema.parse({ page: 3 }),
      onSearchChange,
    });

    act(() => {
      void getResult().handleStateChange(
        { ...getResult().browseState, page: 1 },
        { reason: 'clamp' },
      );
    });

    expect(onSearchChange).toHaveBeenCalledWith({
      search: { q: '', page: 1, pageSize: 50, sort: 'name-asc' },
      replace: true,
    });
  });

  it('replaces drawer apply changes and returns onSearchChange result', () => {
    const commitPromise = Promise.resolve();
    const onSearchChange = vi.fn().mockReturnValue(commitPromise);
    const { getResult } = setup({
      search: browseSearchSchema.parse({ page: 2 }),
      onSearchChange,
    });

    let result: void | Promise<void> = undefined;
    act(() => {
      result = getResult().handleStateChange(
        { ...getResult().browseState, page: 1 },
        { reason: 'apply' },
      );
    });

    expect(result).toBe(commitPromise);
    expect(onSearchChange).toHaveBeenCalledWith({
      search: { q: '', page: 1, pageSize: 50, sort: 'name-asc' },
      replace: true,
    });
  });

  it('cancels a pending search replace before pushing a discrete change', () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    const { getResult } = setup({ onSearchChange });

    act(() => {
      void getResult().handleStateChange({
        ...getResult().browseState,
        search: 'pot',
      });
    });
    act(() => {
      void getResult().handleStateChange({
        ...getResult().browseState,
        page: 2,
      });
    });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith({
      search: { q: 'pot', page: 2, pageSize: 50, sort: 'name-asc' },
      replace: false,
    });
  });
});
