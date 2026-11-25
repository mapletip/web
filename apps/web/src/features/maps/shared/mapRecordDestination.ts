import type { BuildId } from '@/config/maplekit';
import { buildRecordDetailPath } from '@/features/detail';

import type { MapRecordCardDestination } from './MapRecordCard';

export interface ProjectMapRecordDestinationOptions {
  readonly slug: string;
  readonly publicId: string;
  readonly buildId: BuildId;
}

/** Build the canonical same-build route for a map card. */
export function projectMapRecordDestination({
  slug,
  publicId,
  buildId,
}: ProjectMapRecordDestinationOptions): MapRecordCardDestination {
  return { href: buildRecordDetailPath('maps', slug, publicId, buildId) };
}

/** Refer to a monster before the destination map's own focus token is known. */
export function mapMonsterFocusByPublicId(publicId: string): string {
  return `monster-id-${publicId}`;
}
