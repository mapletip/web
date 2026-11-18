import type { BuildId } from '@/config/maplekit';
import {
  buildRecordDetailPath,
  canonicalBuildParam,
  formatRecordAddress,
} from '@/features/detail';

import type { MapRecordCardDestination } from './MapRecordCard';

export interface ProjectMapRecordDestinationOptions {
  readonly slug: string;
  readonly publicId: string;
  readonly buildId: BuildId;
}

/** Build the canonical same-build route and typed route params for a map card. */
export function projectMapRecordDestination({
  slug,
  publicId,
  buildId,
}: ProjectMapRecordDestinationOptions): MapRecordCardDestination {
  const slugId = formatRecordAddress(slug, publicId);
  const buildParam = canonicalBuildParam(buildId);
  return {
    href: buildRecordDetailPath('maps', slug, publicId, buildId),
    params: {
      ...(buildParam === undefined ? {} : { buildId: buildParam }),
      slugId,
    },
  };
}
