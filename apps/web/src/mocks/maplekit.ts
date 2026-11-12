import { notFound } from '@tanstack/react-router';

import { fixtureRelease } from './release';

// Keep the mock module independent because @/config/maplekit resolves here in
// mock mode.
export const DEFAULT_BUILD_ID = 'cw-launch';

export const BUILDS = {
  'cw-launch': { label: 'Classic World' },
  'gms-v83': { label: 'GMS v83' },
} as const;

export type BuildId = keyof typeof BUILDS;

export function isBuildId(value: string): value is BuildId {
  return Object.hasOwn(BUILDS, value);
}

export function supportedBuildSlug(slug: string): BuildId {
  if (slug === DEFAULT_BUILD_ID || !isBuildId(slug)) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  return slug;
}

export const MAPLEKIT_RELEASE = {
  baseUrl: 'https://d0.mapletip.com/',
  pin: fixtureRelease.pin,
} as const;
