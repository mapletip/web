import { describe, expect, it } from 'vitest';

import { emptyDropBrowseFixture } from '@/features/monsters/browse/__tests__/monsterCatalogFixture';

import {
  classifyDrop,
  resolveBrowseDropEvidence,
  type DropEvidence,
} from '../drop-sources';

describe('classifyDrop', () => {
  const historical: DropEvidence = {
    kind: 'historical-overlay',
    label: "Another version's game files",
    build: 'gms-v83',
  };
  const native: DropEvidence = {
    kind: 'native',
    label: "This version's game files",
    build: 'gms-v83',
  };
  const vod: DropEvidence = {
    kind: 'vod',
    label: 'VOD',
    build: 'cw-launch',
    date: '2026-02-01',
    url: 'https://example.test/watch?v=one',
    startSeconds: 95,
  };

  it.each([
    ['historical only', [historical], false, ['GMS v83 Monster Book']],
    ['native', [native], true, ['GMS v83 Monster Book']],
    ['historical and VOD', [historical, vod], true, ['VOD']],
    ['VOD without URL', [{ ...vod, url: undefined }], true, ['VOD']],
    [
      'unknown kind',
      [{ kind: 'screenshot', label: 'Screenshot', build: 'cw-launch' }],
      true,
      ['Screenshot'],
    ],
    [
      'two observations',
      [vod, { ...vod, label: 'Screenshot', kind: 'screenshot' }],
      true,
      ['VOD', 'Screenshot'],
    ],
  ] as const)('%s', (_name, evidence, confirmed, labels) => {
    const result = classifyDrop(evidence);
    expect(result.confirmed).toBe(confirmed);
    expect(result.sources.map(({ label }) => label)).toEqual(labels);
    expect(result.sources.every(({ observed }) => observed)).toBe(
      !labels[0].endsWith('Monster Book'),
    );
  });

  it('keeps one Monster Book per distinct build', () => {
    expect(
      classifyDrop([historical, historical, { ...native, build: 'cw-launch' }]),
    ).toEqual({
      confirmed: true,
      sources: [
        {
          observed: false,
          label: 'GMS v83 Monster Book',
          buildLabel: 'GMS v83',
        },
        {
          observed: false,
          label: 'Classic World Monster Book',
          buildLabel: 'Classic World',
        },
      ],
    });
  });
});

describe('drop source resolution', () => {
  it('builds a source with a timed URL and preserves its query string', () => {
    expect(
      classifyDrop([
        {
          kind: 'vod',
          label: 'VOD',
          build: 'gms-v83',
          url: 'https://example.test/watch?v=one',
          startSeconds: 95,
        },
      ]).sources,
    ).toEqual([
      {
        observed: true,
        label: 'VOD',
        buildLabel: 'GMS v83',
        href: 'https://example.test/watch?v=one&t=95s',
        startSeconds: 95,
      },
    ]);
  });

  it('keeps an untimed URL and omits null optional source fields', () => {
    expect(
      classifyDrop([
        {
          kind: 'vod',
          label: 'VOD',
          build: 'cw-launch',
          date: null,
          url: 'https://video.example/watch?v=fixture',
          startSeconds: null,
        },
      ]).sources,
    ).toEqual([
      {
        observed: true,
        label: 'VOD',
        buildLabel: 'Classic World',
        href: 'https://video.example/watch?v=fixture',
      },
    ]);
  });

  it('resolves a browse entry to its published source and kind label', () => {
    const pack = emptyDropBrowseFixture();
    pack.evidenceKinds.push({ key: 'screenshot', label: 'Screenshot' });
    pack.evidenceSources.push({
      kind: 'screenshot',
      build: 'fixture-build',
      date: '2026-01-15',
      url: 'https://example.test/watch',
    });
    expect(
      resolveBrowseDropEvidence({
        pack,
        evidence: { source: 0, startSeconds: 75 },
      }),
    ).toEqual({
      kind: 'screenshot',
      label: 'Screenshot',
      build: 'fixture-build',
      date: '2026-01-15',
      url: 'https://example.test/watch',
      startSeconds: 75,
    });
  });

  it('rejects missing source indices and missing kind labels', () => {
    const pack = emptyDropBrowseFixture();
    expect(() =>
      resolveBrowseDropEvidence({ pack, evidence: { source: 0 } }),
    ).toThrow('missing source index 0');
    pack.evidenceSources.push({ kind: 'screenshot', build: 'cw-launch' });
    expect(() =>
      resolveBrowseDropEvidence({ pack, evidence: { source: 0 } }),
    ).toThrow('missing kind label screenshot');
  });
});
