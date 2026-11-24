import { BUILDS, type BuildId } from '@/config/maplekit';
import {
  browsePageMetadata,
  type BrowsePageMetadata,
} from '@/features/browse/metadata';
import type { BrowseSearch } from '@/features/browse/search-params';

import type { MapLocationNode } from './location';
import { mapBrowseSearch } from './search-params';

export interface MapPageMetadataOptions {
  readonly buildId: BuildId;
  readonly location: MapLocationNode;
  readonly path: string;
  readonly search?: BrowseSearch | undefined;
}

export function mapPageMetadata({
  buildId,
  location,
  path,
  search,
}: MapPageMetadataOptions): BrowsePageMetadata {
  const buildLabel = BUILDS[buildId].label;
  const topic = {
    all: 'Maps',
    region: `${location.label} Maps`,
    area: `${location.label} Maps`,
    collection: location.label,
  }[location.kind];
  const metadata = browsePageMetadata({
    buildId,
    topic,
    path,
    description:
      location.kind === 'all'
        ? `Browse ${buildLabel} maps in MapleStory by place, monster and NPC.`
        : `Browse ${buildLabel} ${location.kind === 'collection' ? location.label : `maps in ${location.label}`} in MapleStory by monster and NPC.`,
    isDefaultView:
      search === undefined || mapBrowseSearch.isDefaultSearch(search),
  });
  return {
    ...metadata,
    heading: location.kind === 'all' ? metadata.heading : topic,
  };
}
