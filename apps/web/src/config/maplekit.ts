/**
 * One application-wide MapleKit configuration, shared by every domain.
 *
 * The same immutable release serves Monster, Equipment, Items and any future
 * domain; each domain only chooses the build it reads through its own SDK
 * product API.
 */
import type { GetMonsterBrowseOptions } from '@mapletip/data/monsters';
import { notFound } from '@tanstack/react-router';

/** MapleKit data origin; immutable release files are served from here. */
const DATA_ORIGIN = 'https://d0.mapletip.com/';

/**
 * Caller-owned trust anchor. The manifest `path`, `sha256` and `byteLength`
 * establish the immutable verification boundary and the SDK verifies them before
 * parsing anything; there is no "latest" discovery.
 */
const RELEASE_PIN = {
  format: 'mapletip.local-release-pin',
  releaseId:
    'release-dbf14ba28dad5bc90760a5c5ee4f77e3f45ff105d003b822e14f905aa32701ca',
  path: 'v1/releases/6fbe1994bff03cb5776e051d455506f2cd57e9ffe735cdc44a0eb1716e044527.json',
  sha256: '6fbe1994bff03cb5776e051d455506f2cd57e9ffe735cdc44a0eb1716e044527',
  byteLength: 868,
} as const satisfies GetMonsterBrowseOptions['pin'];

export const MAPLEKIT_RELEASE = {
  baseUrl: DATA_ORIGIN,
  pin: RELEASE_PIN,
} as const;

/** Canonical build for the unversioned Monster page. */
export const DEFAULT_BUILD_ID = 'cw-launch';

/**
 * Explicitly supported builds in the pinned release. A build is reachable only by
 * its own route slug; the SDK still decides whether a given product exists for it.
 */
export const BUILDS = {
  'cw-launch': { label: 'Classic World' },
  'gms-v83': { label: 'GMS v83' },
} as const;

export type BuildId = keyof typeof BUILDS;

/** Narrow an arbitrary route slug to an explicitly supported build. */
export function isBuildId(value: string): value is BuildId {
  return Object.hasOwn(BUILDS, value);
}

/**
 * Narrow an arbitrary route slug to an explicitly supported alternate build. The
 * canonical build has its own unversioned URL, so that slug is refused here to
 * avoid duplicate content; anything else unknown is a genuine not-found before
 * any SDK work happens.
 */
export function supportedBuildSlug(slug: string): BuildId {
  if (slug === DEFAULT_BUILD_ID || !isBuildId(slug)) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  return slug;
}
