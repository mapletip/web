import type { BuildId } from '@/config/maplekit';
import { canonicalBuildParam, formatRecordAddress } from '@/features/detail';

export const MAP_DETAIL_ROUTE = '/maplestory/{-$buildId}/maps/$slugId' as const;

export interface MapDetailLinkOptions {
  readonly slug: string;
  readonly publicId: string;
  readonly buildId: BuildId;
}

/** Return typed router options for a same-build Map Detail link. */
export function mapDetailLinkProps({
  slug,
  publicId,
  buildId,
}: MapDetailLinkOptions) {
  return {
    to: MAP_DETAIL_ROUTE,
    params: {
      buildId: canonicalBuildParam(buildId),
      slugId: formatRecordAddress(slug, publicId),
    },
  } as const;
}
