import { getMapBrowse } from '@mapletip/data/maps';

import type { BuildId } from '@/config/maplekit';
import { fileFetch } from '@/mocks/fileFetch';
import { fixtureRelease } from '@/mocks/release';

import { projectMapBrowse, type MapBrowseData } from '../project';

/** The mock release's Map Browse read, projected like the loader does. */
export async function mapBrowseFixture(
  buildId: BuildId = 'cw-launch',
): Promise<MapBrowseData> {
  return projectMapBrowse(
    await getMapBrowse({
      baseUrl: 'https://d0.mapletip.com/',
      pin: fixtureRelease.pin,
      buildId,
      fetch: fileFetch(fixtureRelease.files),
    }),
  );
}
