/**
 * Public surface of the Monster Detail feature.
 *
 * Keeps the SDK loader internal so UI imports never pull the data-loading graph.
 */
export { MonsterDetail, type MonsterDetailProps } from './MonsterDetail';
export {
  monsterDetailBreadcrumbs,
  monsterDetailMetadata,
  type MonsterDetailMetadataOptions,
} from './metadata';
export { projectMonsterDetail, type MonsterDetailView } from './project';
