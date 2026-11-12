import { openRelease } from '@mapletip/data/release';
import { describe, expect, it } from 'vitest';

import { buildRelease, fixtureRelease } from '../release';
import { world } from '../world';

function fileFetch(files: ReadonlyMap<string, Uint8Array>): typeof fetch {
  return (input) => {
    const url = input instanceof Request ? input.url : String(input);
    const path = new URL(url).pathname.slice(1);
    const bytes = files.get(path);
    return Promise.resolve(
      bytes === undefined
        ? new Response(null, { status: 404 })
        : new Response(new Uint8Array(bytes).buffer, {
            headers: { 'content-type': 'application/json' },
          }),
    );
  };
}

describe('fixture release', () => {
  it('opens both builds through the real SDK with all verification enabled', async () => {
    const release = await openRelease({
      baseUrl: 'https://d0.mapletip.com/',
      pin: fixtureRelease.pin,
      fetch: fileFetch(fixtureRelease.files),
    });

    for (const [buildId, expectedCount] of [
      ['cw-launch', 30],
      ['gms-v83', 3],
    ] as const) {
      const product = await release.openBuild(buildId);
      const [catalog, dropBrowse] = await Promise.all([
        product.loadCatalog(),
        product.loadDropBrowse(),
      ]);
      expect(catalog.records).toHaveLength(expectedCount);
      expect(Object.keys(dropBrowse.records)).toHaveLength(expectedCount);
    }
  });

  it('rejects a catalog whose bytes no longer match its digest', async () => {
    const catalogPath = fixtureRelease.builds.get('cw-launch')?.catalog.path;
    if (catalogPath === undefined)
      throw new Error('Missing fixture catalog path.');
    const files = new Map(fixtureRelease.files);
    const original = files.get(catalogPath);
    if (original === undefined)
      throw new Error('Missing fixture catalog bytes.');
    const tampered = new Uint8Array(original);
    tampered[0] = (tampered[0] ?? 0) ^ 1;
    files.set(catalogPath, tampered);

    const release = await openRelease({
      baseUrl: 'https://d0.mapletip.com/',
      pin: fixtureRelease.pin,
      fetch: fileFetch(files),
    });
    const product = await release.openBuild('cw-launch');

    await expect(product.loadCatalog()).rejects.toThrow();
  });

  it('builds the same pin deterministically', async () => {
    const secondRelease = await buildRelease(world);
    expect(secondRelease.pin).toEqual(fixtureRelease.pin);
  });
});
