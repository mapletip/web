import { notFound } from '@tanstack/react-router';

import type { BuildId } from '@/config/maplekit';

import { resolveBuildIdParam } from './address';

/** Resolve an optional build route param or raise the router's not-found result. */
export function requireBuildId(rawBuildId?: string): BuildId {
  const buildId = resolveBuildIdParam(rawBuildId);
  if (buildId === null) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound();
  }
  return buildId;
}
