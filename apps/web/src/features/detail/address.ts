import {
  DEFAULT_BUILD_ID,
  supportedBuildSlug,
  type BuildId,
} from '@/config/maplekit';

const RECORD_ADDRESS_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*)-([a-z0-9]{8})$/;

export interface ParsedRecordAddress {
  readonly slug: string;
  readonly publicId: string;
}

/**
 * Parse a `{slug}-{publicId}` route segment where `publicId` is 8 lowercase
 * base36 characters and `slug` is a lowercase hyphenated identifier.
 */
export function parseRecordAddress(slugId: string): ParsedRecordAddress | null {
  const match = RECORD_ADDRESS_PATTERN.exec(slugId);
  if (!match?.[1] || !match[2]) {
    return null;
  }
  return {
    slug: match[1],
    publicId: match[2],
  };
}

/** Format a canonical `{slug}-{publicId}` route segment. */
export function formatRecordAddress(slug: string, publicId: string): string {
  return `${slug}-${publicId}`;
}

/**
 * Resolve an optional `{-$buildId}` route param to a supported `BuildId`,
 * returning `null` for explicit default-build slugs or unknown builds.
 */
export function resolveBuildIdParam(rawBuildId?: string): BuildId | null {
  if (rawBuildId === undefined) {
    return DEFAULT_BUILD_ID;
  }
  try {
    return supportedBuildSlug(rawBuildId);
  } catch {
    return null;
  }
}

/**
 * Convert a `BuildId` into the optional `{-$buildId}` route param value,
 * omitting the default build so canonical URLs stay unprefixed.
 */
export function canonicalBuildParam(buildId: BuildId): BuildId | undefined {
  return buildId === DEFAULT_BUILD_ID ? undefined : buildId;
}

function buildPrefix(buildId?: BuildId): string {
  return buildId === undefined || buildId === DEFAULT_BUILD_ID
    ? ''
    : `/${buildId}`;
}

/** Build the canonical collection path for a domain section and optional build. */
export function buildCollectionPath(
  section: string,
  buildId?: BuildId,
): string {
  return `/maplestory${buildPrefix(buildId)}/${section}`;
}

/** Build the canonical detail path for a record, omitting the default build prefix. */
export function buildRecordDetailPath(
  section: string,
  slug: string,
  publicId: string,
  buildId?: BuildId,
): string {
  return `${buildCollectionPath(section, buildId)}/${formatRecordAddress(slug, publicId)}`;
}
