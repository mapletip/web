import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { validateSearch, type ItemBrowseSearch } from '../../search-params';
import {
  useItemBrowseUrlState,
  type OnSearchChangeOptions,
  type UseItemBrowseUrlStateResult,
} from '../useItemBrowseUrlState';

describe('useItemBrowseUrlState', () => {
  function setup({
    search = validateSearch({}),
    onSearchChange = vi.fn(),
  }: {
    readonly search?: ItemBrowseSearch;
    readonly onSearchChange?: (options: OnSearchChangeOptions) => void;
  } = {}) {
    let latestResult: UseItemBrowseUrlStateResult | undefined;

    function TestConsumer() {
      latestResult = useItemBrowseUrlState({ search, onSearchChange });
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
      getResult().handleStateChange({
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
      getResult().handleStateChange({ ...getResult().browseState, page: 2 });
    });

    expect(onSearchChange).toHaveBeenCalledWith({
      search: { q: '', page: 2, pageSize: 50, sort: 'name-asc' },
      replace: false,
    });
  });

  it('pushes facet changes with active options and resets the page', () => {
    const onSearchChange = vi.fn();
    const { getResult } = setup({
      search: validateSearch({ page: 4 }),
      onSearchChange,
    });

    act(() => {
      getResult().handleStateChange({
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
      search: validateSearch({ page: 3 }),
      onSearchChange,
    });

    act(() => {
      getResult().handleStateChange(
        { ...getResult().browseState, page: 1 },
        { reason: 'clamp' },
      );
    });

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
      getResult().handleStateChange({
        ...getResult().browseState,
        search: 'pot',
      });
    });
    act(() => {
      getResult().handleStateChange({
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
