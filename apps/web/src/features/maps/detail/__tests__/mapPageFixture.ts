import type { MapPagePackV1, MapPageRecordV1 } from '@mapletip/data/maps';

import type { BuildId } from '@/config/maplekit';
import { fixtureRelease, mapPublicId } from '@/mocks/release';

export interface MapPageFixtureOptions {
  readonly mapId: string;
  readonly buildId?: BuildId;
}

/** Read a Map page from the verified synthetic release used by app integration tests. */
export function mapPageRecordFixture({
  mapId,
  buildId = 'cw-launch',
}: MapPageFixtureOptions): MapPageRecordV1 {
  const descriptor = fixtureRelease.builds.get(buildId)?.mapPagePack;
  if (descriptor === undefined) {
    throw new Error(`Missing fixture Map page pack for ${buildId}.`);
  }
  const bytes = fixtureRelease.files.get(descriptor.path);
  if (bytes === undefined) {
    throw new Error(`Missing fixture Map page bytes for ${buildId}.`);
  }

  const pack = JSON.parse(new TextDecoder().decode(bytes)) as MapPagePackV1;
  const publicId = mapPublicId({ sourceId: `${buildId}:${mapId}` });
  const record = pack.records[publicId];
  if (record === undefined) {
    throw new Error(`Missing fixture Map "${mapId}" for ${buildId}.`);
  }
  return record;
}
