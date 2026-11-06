/**
 * One application-wide MapleKit configuration, shared by every domain.
 *
 * The same immutable release serves Monster, Equipment, Items and any future
 * domain; each domain only chooses the build it reads through its own SDK
 * product API.
 */
import type { GetMonsterBrowseOptions } from '@mapletip/data/monsters';

/** MapleKit data origin; immutable release files are served from here. */
const DATA_ORIGIN = 'https://data.mapletip.com/';

/**
 * Caller-owned trust anchor. The manifest `path`, `sha256` and `byteLength`
 * establish the immutable verification boundary and the SDK verifies them before
 * parsing anything; there is no "latest" discovery.
 */
const RELEASE_PIN = {
  format: 'mapletip.local-release-pin',
  releaseId:
    'release-522b28866e453e0f1369688c0e48dd153311c18d093961ad44409df33200905e',
  path: 'v1/releases/aa16dd552dc2502ed6a16ea19b9e778d06c2d83aedd1d89a456197b0cf0ea06f.json',
  sha256: 'aa16dd552dc2502ed6a16ea19b9e778d06c2d83aedd1d89a456197b0cf0ea06f',
  byteLength: 745,
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
