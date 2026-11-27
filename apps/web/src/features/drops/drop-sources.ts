import type { StaticMonsterDropBrowseV1_2 } from '@mapletip/data/monsters';

import { BUILDS, isBuildId } from '@/config/maplekit';

/** A drop source as players see it: its name, linked when it has a link. */
export interface DropSource {
  readonly label: string;
  readonly href?: string;
}

export interface DropEvidence {
  readonly kind: string;
  readonly label: string;
  readonly build: string;
  readonly url?: string | null | undefined;
  readonly startSeconds?: number | null | undefined;
}

export function classifyDrop(evidence: readonly DropEvidence[]): {
  readonly confirmed: boolean;
  readonly sources: readonly DropSource[];
} {
  const observations = evidence.filter(
    ({ kind }) => kind !== 'native' && kind !== 'historical-overlay',
  );
  if (observations.length > 0) {
    return { confirmed: true, sources: observations.map(toDropSource) };
  }

  const builds = new Set<string>();
  const sources = evidence.flatMap((source) => {
    if (builds.has(source.build)) return [];
    builds.add(source.build);
    return [{ label: `${buildLabel(source.build)} Monster Book` }];
  });
  return {
    confirmed: evidence.some(({ kind }) => kind === 'native'),
    sources,
  };
}

function buildLabel(build: string): string {
  return isBuildId(build) ? BUILDS[build].label : build;
}

function sourceHref({
  url,
  startSeconds,
}: {
  readonly url: string;
  readonly startSeconds?: number | undefined;
}): string {
  if (startSeconds === undefined) return url;
  const href = new URL(url);
  href.searchParams.set('t', `${startSeconds}s`);
  return href.toString();
}

function toDropSource({ label, url, startSeconds }: DropEvidence): DropSource {
  return url == null
    ? { label }
    : {
        label,
        href: sourceHref({ url, startSeconds: startSeconds ?? undefined }),
      };
}

export function resolveBrowseDropEvidence({
  pack,
  evidence,
}: {
  readonly pack: Pick<
    StaticMonsterDropBrowseV1_2,
    'evidenceKinds' | 'evidenceSources'
  >;
  readonly evidence: {
    readonly source: number;
    readonly startSeconds?: number | null | undefined;
  };
}): DropEvidence {
  const source = pack.evidenceSources[evidence.source];
  if (source === undefined) {
    throw new Error(
      `Monster drop browse references missing source index ${evidence.source}.`,
    );
  }
  const label = pack.evidenceKinds.find(
    ({ key }) => key === source.kind,
  )?.label;
  if (label === undefined) {
    throw new Error(
      `Monster drop browse references missing kind label ${source.kind}.`,
    );
  }
  return {
    kind: source.kind,
    label,
    build: source.build,
    url: source.url,
    startSeconds: evidence.startSeconds,
  };
}
