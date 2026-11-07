import type { QueryFieldDefinition } from '@mapletip/component-library';

import type { ItemRelationshipKind } from './labels';
import { RELATIONSHIP_COUNT_FIELDS, type ItemRow } from './project';
import { matchSourceId } from './search';

export function getItemRelationships(
  row: ItemRow,
): readonly ItemRelationshipKind[] {
  const rels: ItemRelationshipKind[] = [];
  for (const [relKind, fieldKey] of RELATIONSHIP_COUNT_FIELDS) {
    const count = row[fieldKey];
    if (typeof count === 'number' && count > 0) {
      rels.push(relKind);
    }
  }
  return rels;
}

export const ITEM_QUERY_FIELDS: readonly QueryFieldDefinition<ItemRow>[] = [
  // 1. Common
  {
    id: 'types',
    accessor: (row) => row.types ?? [],
    getUniqueValues: (row) => row.types ?? [],
  },
  {
    id: 'functions',
    accessor: (row) => row.functions ?? [],
    getUniqueValues: (row) => row.functions ?? [],
  },
  {
    id: 'rel',
    accessor: (row) => getItemRelationships(row),
    getUniqueValues: (row) => getItemRelationships(row),
  },
  {
    id: 'sourceId',
    accessor: (row) => row.sourceId,
    searchMatch: (val, query) =>
      typeof val === 'string' ? matchSourceId(val, query) : false,
  },

  // 2. Recovery
  { id: 'hp', accessor: (row) => row.hp },
  { id: 'mp', accessor: (row) => row.mp },
  { id: 'hpPercent', accessor: (row) => row.hpPercent },
  { id: 'mpPercent', accessor: (row) => row.mpPercent },

  // 3. Upgrade Scrolls
  {
    id: 'scrollTarget',
    accessor: (row) => (row.targetLabel ? [row.targetLabel] : []),
    getUniqueValues: (row) => (row.targetLabel ? [row.targetLabel] : []),
  },
  {
    id: 'scrollStat',
    accessor: (row) => (row.stats ? Object.keys(row.stats) : []),
    getUniqueValues: (row) => (row.stats ? Object.keys(row.stats) : []),
  },
  {
    id: 'scrollSuccess',
    accessor: (row) => (row.success !== undefined ? [String(row.success)] : []),
    getUniqueValues: (row) =>
      row.success !== undefined ? [String(row.success)] : [],
  },
  {
    id: 'scrollRisk',
    accessor: (row) =>
      typeof row.cursed === 'number' && row.cursed > 0
        ? [String(row.cursed)]
        : ['none'],
    getUniqueValues: (row) =>
      typeof row.cursed === 'number' && row.cursed > 0
        ? [String(row.cursed)]
        : ['none'],
  },
  {
    id: 'scrollTier',
    accessor: (row) => (row.tier ? [row.tier] : []),
    getUniqueValues: (row) => (row.tier ? [row.tier] : []),
  },
  {
    id: 'scrollSpecial',
    accessor: (row) => row.specials ?? [],
    getUniqueValues: (row) => row.specials ?? [],
  },
  {
    id: 'scrollDirect',
    accessor: (row) =>
      typeof row.directTargetCount === 'number' && row.directTargetCount > 0
        ? ['verified']
        : [],
    getUniqueValues: (row) =>
      typeof row.directTargetCount === 'number' && row.directTargetCount > 0
        ? ['verified']
        : [],
  },

  // 4. Projectiles
  { id: 'attack', accessor: (row) => row.attack },

  // 5. Pet Food & Cash
  { id: 'closeness', accessor: (row) => row.closeness },
  { id: 'fullness', accessor: (row) => row.fullness },
  { id: 'tameness', accessor: (row) => row.tameness },
  {
    id: 'pet',
    accessor: (row) => {
      const keys: string[] = [];
      if (row.petTargets) {
        for (const target of row.petTargets) {
          keys.push(target.key);
        }
      }
      if (row.unresolvedPetTargets) {
        for (const targetId of row.unresolvedPetTargets) {
          keys.push(targetId);
        }
      }
      return keys;
    },
    getUniqueValues: (row) => {
      const keys: string[] = [];
      if (row.petTargets) {
        for (const target of row.petTargets) {
          keys.push(target.key);
        }
      }
      if (row.unresolvedPetTargets) {
        for (const targetId of row.unresolvedPetTargets) {
          keys.push(targetId);
        }
      }
      return keys;
    },
  },
  {
    id: 'kind',
    accessor: (row) => [row.itemClass],
    getUniqueValues: (row) => [row.itemClass],
  },

  // 6. Quest Items & ETC
  {
    id: 'questFlag',
    accessor: (row) => (row.questFlag === true ? ['quest-flagged'] : []),
    getUniqueValues: (row) => (row.questFlag === true ? ['quest-flagged'] : []),
  },

  // 7. Chairs & Set-up
  { id: 'seatHp', accessor: (row) => row.seatHp },
  { id: 'seatMp', accessor: (row) => row.seatMp },
];
