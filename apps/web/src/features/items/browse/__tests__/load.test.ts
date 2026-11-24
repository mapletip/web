import { afterEach, describe, expect, it, vi } from 'vitest';

import { ITEM_BROWSE_UNAVAILABLE_MESSAGE, loadItemBrowse } from '../load';

const getItemBrowse = vi.hoisted(() => vi.fn());

vi.mock('@mapletip/data/items', () => ({ getItemBrowse }));

describe('loadItemBrowse', () => {
  afterEach(() => vi.restoreAllMocks());

  it('exposes no SDK diagnostics when the read fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getItemBrowse.mockRejectedValue(
      Object.assign(new Error('SHA-256 mismatch at v2/items/browse'), {
        code: 'INTEGRITY_ERROR',
      }),
    );

    const failure: unknown = await loadItemBrowse('cw-launch').catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(Error);
    expect(failure).toMatchObject({ message: ITEM_BROWSE_UNAVAILABLE_MESSAGE });
    expect(failure).not.toHaveProperty('code');
    expect(String(failure)).not.toContain('v2/items');
  });

  it('keeps an abort an abort', async () => {
    const abort = new DOMException('Request aborted', 'AbortError');
    getItemBrowse.mockRejectedValue(abort);

    await expect(loadItemBrowse('cw-launch')).rejects.toBe(abort);
  });
});
