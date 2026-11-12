import type { BuildId } from '@/config/maplekit';

import type { MonsterBrowseData } from './load';

const FLAG = '__mapletipMonsterBrowseHistoryData';
type BrowseWindow = Window & {
  [FLAG]?: { readonly buildId: BuildId; readonly data: MonsterBrowseData };
};

/** Reuse the current browse rows when the mobile filter drawer closes its own history entry. */
export function preserveMonsterBrowseForDrawerClose(
  buildId: BuildId,
  data: MonsterBrowseData,
): void {
  if (typeof window !== 'undefined') {
    (window as BrowseWindow)[FLAG] = { buildId, data };
  }
}

/** Filter-drawer history entries keep the current URL and data unchanged. */
export function loadMonsterBrowseAfterHistory(
  buildId: BuildId,
  load: () => Promise<MonsterBrowseData>,
): Promise<MonsterBrowseData> {
  if (typeof window === 'undefined') return load();
  const browseWindow = window as BrowseWindow;
  const pending = browseWindow[FLAG];
  delete browseWindow[FLAG];
  if (pending?.buildId === buildId) return Promise.resolve(pending.data);
  return load();
}
