import { mapMinimapUrl } from '@mapletip/data/maps';
import type { ReactElement } from 'react';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import {
  MapRecordCard,
  projectMapRecordDestination,
  type MapRecordCardView,
} from '@/features/maps/shared';

import type { MapBrowseRecord } from './records';

export const UNNAMED_MAP = 'Unnamed map';

export interface MapBrowseCardProps {
  readonly record: MapBrowseRecord;
  readonly buildId: BuildId;
}

/** Project one record to the shared map card. */
export function mapBrowseCardView({
  record,
  buildId,
}: MapBrowseCardProps): MapRecordCardView {
  return {
    key: record.publicId,
    name: record.name ?? UNNAMED_MAP,
    ...(record.minimapId === undefined
      ? { minimapUnavailableLabel: 'Minimap unavailable' }
      : {
          minimapUrl: mapMinimapUrl(MAPLEKIT_RELEASE.baseUrl, record.minimapId),
        }),
    footerParts: [],
    destination: projectMapRecordDestination({
      slug: record.slug,
      publicId: record.publicId,
      buildId,
    }),
  };
}

export function MapBrowseCard(props: MapBrowseCardProps): ReactElement {
  return <MapRecordCard map={mapBrowseCardView(props)} />;
}
