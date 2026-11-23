import { BUILDS, type BuildId } from '@/config/maplekit';
import {
  browsePageMetadata,
  type BrowsePageMetadata,
} from '@/features/browse/metadata';
import type { BrowseSearch } from '@/features/browse/search-params';

import { mapBrowseSearch } from './search-params';

export interface MapPageMetadataOptions {
  readonly buildId: BuildId;
  /** Current location's label; omitted on All maps. */
  readonly locationLabel?: string | undefined;
  readonly path: string;
  readonly search?: BrowseSearch | undefined;
}

export function mapPageMetadata({
  buildId,
  locationLabel,
  path,
  search,
}: MapPageMetadataOptions): BrowsePageMetadata {
  const buildLabel = BUILDS[buildId].label;
  return browsePageMetadata({
    buildId,
    topic: locationLabel === undefined ? 'Maps' : `${locationLabel} Maps`,
    path,
    description:
      locationLabel === undefined
        ? `Browse ${buildLabel} maps in MapleStory by place, monster and NPC.`
        : `Browse ${buildLabel} maps in ${locationLabel}, MapleStory, by monster and NPC.`,
    isDefaultView:
      search === undefined || mapBrowseSearch.isDefaultSearch(search),
  });
}
