import { afterEach, describe, expect, it, vi } from 'vitest';

import { withLoadBoundary } from '../load-error';

const MESSAGE = 'Data could not be loaded.';

function boundary(load: () => Promise<unknown>) {
  return withLoadBoundary({
    load,
    failureMessage: MESSAGE,
    logMessage: 'Fixture load failed.',
  });
}

describe('withLoadBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns the loaded value', async () => {
    await expect(boundary(() => Promise.resolve(42))).resolves.toBe(42);
  });

  it('preserves an abort error as an abort', async () => {
    const abort = new DOMException('Request aborted', 'AbortError');

    await expect(boundary(() => Promise.reject(abort))).rejects.toBe(abort);
  });

  it('replaces an SDK error with a generic error without its cause', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = Object.assign(
      new Error('SHA-256 mismatch at v2/catalogs/a'),
      { code: 'INTEGRITY_ERROR' },
    );

    const sanitized: unknown = await boundary(() =>
      Promise.reject(failure),
    ).catch((error: unknown) => error);

    expect(sanitized).toBeInstanceOf(Error);
    expect(sanitized).not.toBe(failure);
    expect(sanitized).toMatchObject({ message: MESSAGE });
    expect(sanitized).not.toHaveProperty('cause');
    expect(sanitized).not.toHaveProperty('code');
  });
});
