import type { StaticMonsterDropBrowseV1_2 } from '@mapletip/data/monsters';

import { BUILDS, isBuildId } from '@/config/maplekit';

export interface DropSource {
  readonly label: string;
  readonly buildLabel: string;
  readonly date?: string;
  readonly href?: string;
  readonly startSeconds?: number;
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

export function toDropSource({
  label,
  build,
  date,
  url,
  startSeconds,
}: {
  readonly label: string;
  readonly build: string;
  readonly date?: string | null | undefined;
  readonly url?: string | null | undefined;
  readonly startSeconds?: number | null | undefined;
}): DropSource {
  const normalizedStartSeconds = startSeconds ?? undefined;
  return {
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

export function resolveBrowseDropSource({
  pack,
  evidence,
}: {
  readonly pack: StaticMonsterDropBrowseV1_2;
  readonly evidence: NonNullable<
    StaticMonsterDropBrowseV1_2['records'][string]
  >['entries'][number]['evidence'][number];
}): DropSource {
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
  return toDropSource({
    label,
    build: source.build,
    date: source.date,
    url: source.url,
    startSeconds: evidence.startSeconds,
  });
}
