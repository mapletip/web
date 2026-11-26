import type { StaticMonsterDropBrowseV1_2 } from '@mapletip/data/monsters';

import { BUILDS, isBuildId } from '@/config/maplekit';

export interface DropSource {
  /** False for game files ("GMS v83 Monster Book"), true for an observation such as a VOD. */
  readonly observed: boolean;
  readonly label: string;
  readonly buildLabel: string;
  readonly date?: string;
  readonly href?: string;
  readonly startSeconds?: number;
}

export interface DropEvidence {
  readonly kind: string;
  readonly label: string;
  readonly build: string;
  readonly date?: string | null | undefined;
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
    const label = buildLabel(source.build);
    return [
      { observed: false, label: `${label} Monster Book`, buildLabel: label },
    ];
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

function toDropSource({
  label,
  build,
  date,
  url,
  startSeconds,
}: DropEvidence): DropSource {
  const normalizedStartSeconds = startSeconds ?? undefined;
  return {
    observed: true,
    label,
    buildLabel: buildLabel(build),
    ...(date == null ? {} : { date }),
    ...(url == null
      ? {}
      : { href: sourceHref({ url, startSeconds: normalizedStartSeconds }) }),
    ...(normalizedStartSeconds === undefined
      ? {}
      : { startSeconds: normalizedStartSeconds }),
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
    date: source.date,
    url: source.url,
    startSeconds: evidence.startSeconds,
  };
}
