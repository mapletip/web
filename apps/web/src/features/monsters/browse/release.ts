/**
 * Committed, reproducible MapleKit release selection for the Monster browse
 * pages.
 *
 * These values are not secrets and are not environment-derived: the same commit
 * always reads the same immutable release. The release root is content-addressed
 * and CORS-enabled, so the pin — not a "latest" lookup — decides what is read.
 *
 * `@mapletip/data/monsters` does not re-export `ReleasePin`, so the pin is
 * checked structurally against the SDK option it is passed to
 * (`satisfies GetMonsterBrowseOptions['pin']`) instead of restating the type.
 */
import type { GetMonsterBrowseOptions } from '@mapletip/data/monsters';

/** Immutable HTTPS release root published by MapleKit (CORS: `*`). */
export const releaseBaseUrl = 'https://data.mapletip.com/';

/**
 * Authoritative local release pin for the release this app reads.
 *
 * The manifest at `path` is pinned by `sha256` and `byteLength`; the SDK
 * verifies both before parsing anything.
 */
export const releasePin = {
  format: 'mapletip.local-release-pin',
  releaseId:
    'release-522b28866e453e0f1369688c0e48dd153311c18d093961ad44409df33200905e',
  path: 'v1/releases/aa16dd552dc2502ed6a16ea19b9e778d06c2d83aedd1d89a456197b0cf0ea06f.json',
  sha256: 'aa16dd552dc2502ed6a16ea19b9e778d06c2d83aedd1d89a456197b0cf0ea06f',
  byteLength: 745,
} as const satisfies GetMonsterBrowseOptions['pin'];

/**
 * The supported builds in the pinned release. A route slug may select one of
 * these explicitly configured builds (validated against this table), but nothing
 * discovers releases from browser state, arbitrary URLs or a mutable "latest".
 * The build-to-family mapping and its scope checks belong to the SDK's verified
 * build index, so the app owns only the label and page copy here.
 */
export const MONSTER_BUILDS = {
  'cw-launch': {
    buildId: 'cw-launch',
    label: 'Classic World',
    title: 'Classic World monsters — MapleTip',
    description:
      'Browse every Classic World monster in the verified MapleKit release, with authoritative stats and honest unknown states.',
  },
  'gms-v83': {
    buildId: 'gms-v83',
    label: 'GMS v83',
    title: 'GMS v83 monsters — MapleTip',
    description:
      'Browse every GMS v83 monster in the verified MapleKit release, with authoritative stats and honest unknown states.',
  },
} as const;

export type MonsterBuildId = keyof typeof MONSTER_BUILDS;

/** Narrow an arbitrary route slug to an explicitly supported build. */
export function isMonsterBuildId(value: string): value is MonsterBuildId {
  return Object.hasOwn(MONSTER_BUILDS, value);
}

export type MonsterBuild = (typeof MONSTER_BUILDS)[MonsterBuildId];
