/**
 * Public surface of the Items Browse feature.
 *
 * Routes import the page and its props from here; everything else in the feature
 * — the loader, projection, category registry, labels and components — stays
 * internal, so a route cannot depend on internal contracts. The loader is
 * deliberately *not* re-exported: a UI import must not pull the SDK loading graph with it.
 */
export { ItemBrowse } from './ItemBrowse';
export type { ItemBrowseProps } from './ItemBrowse';
