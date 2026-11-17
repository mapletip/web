import type { MapPageRecordV1 } from '@mapletip/data/maps';

import type { BuildId } from '@/config/maplekit';
import { buildRecordDetailPath } from '@/features/detail';

export const UNNAMED_MAP_LABEL = 'Unnamed map';

/** Serializable, display-ready identity and geography for one Map Detail page. */
export interface MapDetailView {
  readonly publicId: string;
  readonly slug: string;
  readonly buildId: BuildId;
  readonly name: string;
  readonly subtitle?: string;
  readonly regionLabel?: string;
  readonly areaLabel?: string;
  readonly canonicalPath: string;
}

export interface ProjectMapDetailOptions {
  readonly record: MapPageRecordV1;
  readonly buildId: BuildId;
}

function nonBlank(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}

function knownText(fact: { readonly state: string; readonly value?: string }) {
  if (fact.state !== 'known') return undefined;
  return nonBlank(fact.value);
}

/** Project only the identity and geography needed by the current page skeleton. */
export function projectMapDetail({
  record,
  buildId,
}: ProjectMapDetailOptions): MapDetailView {
  const name = knownText(record.name);
  const streetName = knownText(record.streetName);
  const geography = record.geography;
  const regionLabel = nonBlank(geography?.regionLabel);
  const areaLabel = nonBlank(geography?.areaLabel);

  return {
    publicId: record.publicId,
    slug: record.slug,
    buildId,
    name: name ?? UNNAMED_MAP_LABEL,
    ...(name === undefined && streetName !== undefined
      ? { subtitle: streetName }
      : {}),
    ...(regionLabel === undefined ? {} : { regionLabel }),
    ...(areaLabel === undefined ? {} : { areaLabel }),
    canonicalPath: buildRecordDetailPath(
      'maps',
      record.slug,
      record.publicId,
      buildId,
    ),
  };
}
