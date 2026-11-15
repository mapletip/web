import type { BuildId } from '@/config/maplekit';
import { canonicalBuildParam, formatRecordAddress } from '@/features/detail';

export interface MonsterPublicAddress {
  readonly slug?: string | undefined;
  readonly publicId?: string | undefined;
}

/** Return TanStack Router options for a same-build detail link when addressable. */
export function monsterDetailLinkProps(
  record: MonsterPublicAddress,
  buildId: BuildId,
):
  | {
      readonly to: '/maplestory/{-$buildId}/monsters/$slugId';
      readonly params: {
        readonly buildId: BuildId | undefined;
        readonly slugId: string;
      };
    }
  | undefined {
  if (record.slug === undefined || record.publicId === undefined) {
    return undefined;
  }
  return {
    to: '/maplestory/{-$buildId}/monsters/$slugId',
    params: {
      buildId: canonicalBuildParam(buildId),
      slugId: formatRecordAddress(record.slug, record.publicId),
    },
  };
}
