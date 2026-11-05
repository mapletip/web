/**
 * Public surface of the Monster Browse feature.
 *
 * Routes import the page and its route error component from here; everything
 * else in the folder — the loader, the projection, range presets and the browse
 * card — stays internal, so a route cannot depend on how a single record is
 * projected or rendered. The loader is deliberately *not* re-exported: a UI
 * import must not pull the SDK loading graph with it.
 */
export { MonsterBrowse } from './MonsterBrowse';
export type { MonsterBrowseProps } from './MonsterBrowse';
export { MonsterBrowseUnavailable } from './MonsterBrowseUnavailable';
