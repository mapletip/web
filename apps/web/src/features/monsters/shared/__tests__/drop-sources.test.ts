import { describe, expect, it } from 'vitest';

import { emptyDropBrowseFixture } from '../../browse/__tests__/monsterCatalogFixture';
import { resolveBrowseDropSource, toDropSource } from '../drop-sources';

describe('drop source resolution', () => {
  it('builds a source with a timed URL and preserves its query string', () => {
    expect(
      toDropSource({
        label: 'VOD',
        build: 'gms-v83',
        url: 'https://example.test/watch?v=one',
        startSeconds: 95,
      }),
    ).toEqual({
      label: 'VOD',
      buildLabel: 'GMS v83',
      href: 'https://example.test/watch?v=one&t=95s',
      startSeconds: 95,
    });
  });

  it('keeps an untimed URL and omits null optional source fields', () => {
    expect(
      toDropSource({
        label: 'VOD',
        build: 'cw-launch',
        date: null,
        url: 'https://video.example/watch?v=fixture',
        startSeconds: null,
      }),
    ).toEqual({
      label: 'VOD',
      buildLabel: 'Classic World',
      href: 'https://video.example/watch?v=fixture',
    });
  });

  it('uses published kind labels and build labels, including unknown kinds and builds', () => {
    const pack = emptyDropBrowseFixture();
    pack.evidenceKinds.push({ key: 'screenshot', label: 'Screenshot' });
    pack.evidenceSources.push({
      kind: 'screenshot',
      build: 'fixture-build',
      date: '2026-01-15',
      url: 'https://example.test/watch',
    });
    expect(
      resolveBrowseDropSource({
        pack,
        evidence: { source: 0, startSeconds: 75 },
      }),
    ).toEqual({
      label: 'Screenshot',
      buildLabel: 'fixture-build',
      date: '2026-01-15',
      href: 'https://example.test/watch?t=75s',
      startSeconds: 75,
    });
  });

  it('rejects missing source indices and missing kind labels', () => {
    const pack = emptyDropBrowseFixture();
    expect(() =>
      resolveBrowseDropSource({ pack, evidence: { source: 0 } }),
    ).toThrow('missing source index 0');
    pack.evidenceSources.push({ kind: 'screenshot', build: 'cw-launch' });
    expect(() =>
      resolveBrowseDropSource({ pack, evidence: { source: 0 } }),
    ).toThrow('missing kind label screenshot');
  });
});
