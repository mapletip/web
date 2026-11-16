/**
 * Public surface of the Monster Detail feature.
 *
 * Keeps the SDK loader internal so UI imports never pull the data-loading graph.
 */
export { MonsterDetail, type MonsterDetailProps } from './MonsterDetail';
export {
  MonsterDetailLocations,
  type MonsterDetailLocationsProps,
} from './MonsterDetailLocations';
export {
  MonsterDetailQuests,
  type MonsterDetailQuestsProps,
} from './MonsterDetailQuests';
export {
  MonsterDetailSummonedBy,
  type MonsterDetailSummonedByProps,
} from './MonsterDetailSummonedBy';
export {
  monsterDetailBreadcrumbs,
  monsterDetailMetadata,
  type MonsterDetailMetadataOptions,
} from './metadata';
export {
  projectMonsterDetail,
  type MonsterDetailLocationMapView,
  type MonsterDetailLocationsView,
  type MonsterDetailQuestEntryView,
  type MonsterDetailQuestsView,
  type MonsterDetailSummonedByView,
  type MonsterDetailSummonedItemView,
  type MonsterDetailView,
} from './project';
