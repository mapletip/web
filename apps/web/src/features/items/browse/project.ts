/**
 * App-owned projection of SDK Item browse records into flat, sortable,
 * JSON-serializable browse rows.
 *
 * Absent values are omitted (undefined means "no value"; never coerce to 0).
 */
import type { ItemBrowseRow } from '@mapletip/data/items';

import {
  SCROLL_STAT_PRIORITY,
  type ItemBrowseScrollDeltas,
  type ItemRelationshipKind,
  type ItemRow,
} from './types';

export * from './types';

function computeStatRank(
  deltas?: ItemBrowseScrollDeltas | null,
): number | undefined {
  if (!deltas) return undefined;
  const keys = Object.keys(deltas);
  if (keys.length === 0) return undefined;

  for (const [i, statKey] of SCROLL_STAT_PRIORITY.entries()) {
    const val = deltas[statKey];
    if (typeof val === 'number') {
      return (i + 1) * 10000 - val;
    }
  }

  return 999999;
}

export function projectItemBrowseRows(
  records: readonly ItemBrowseRow[],
): readonly ItemRow[] {
  const namesByKey = new Map<string, string>();
  for (const record of records) {
    if (record.name.state === 'known') {
      namesByKey.set(record.key, record.name.value);
    }
  }

  return records.map((record) => {
    const name =
      record.name.state === 'known' ? record.name.value : undefined;
    const nameState = record.name.state;
    const icon =
      record.icon.state === 'known' ? record.icon.value : undefined;

    const relKinds: ItemRelationshipKind[] = [];
    const rels = record.relationships;
    if (rels) {
      if ((rels['cash-shop-listing'] ?? 0) > 0) relKinds.push('cash-shop-listing');
      if ((rels['found-in-container'] ?? 0) > 0) relKinds.push('found-in-container');
      if ((rels['made-by-recipe'] ?? 0) > 0) relKinds.push('made-by-recipe');
      if ((rels['monster-drop'] ?? 0) > 0) relKinds.push('monster-drop');
      if ((rels['needed-for-quest'] ?? 0) > 0) relKinds.push('needed-for-quest');
      if ((rels['quest-reward'] ?? 0) > 0) relKinds.push('quest-reward');
      if ((rels['used-in-recipe'] ?? 0) > 0) relKinds.push('used-in-recipe');
    }

    let resolvedPetTargets: string[] | undefined;
    if (record.petFood?.targets && record.petFood.targets.length > 0) {
      const resolved: string[] = [];
      for (const targetKey of record.petFood.targets) {
        const petName = namesByKey.get(targetKey);
        if (petName) resolved.push(petName);
      }
      if (resolved.length > 0) {
        resolvedPetTargets = Array.from(new Set(resolved));
      }
    }

    const deltas = record.scroll?.deltas;
    const statKeys = deltas ? Object.keys(deltas) : undefined;
    const statRank = computeStatRank(deltas);

    return {
      key: record.key,
      sourceId: record.sourceId,
      ...(name !== undefined ? { name } : {}),
      nameState,
      ...(icon !== undefined ? { icon } : {}),
      itemClass: record.itemClass,
      ...(record.types && record.types.length > 0
        ? { types: record.types }
        : {}),
      ...(record.functions && record.functions.length > 0
        ? { functions: record.functions }
        : {}),
      ...(relKinds.length > 0 ? { rel: relKinds } : {}),
      ...(typeof rels?.['cash-shop-listing'] === 'number'
        ? { cashShopListingCount: rels['cash-shop-listing'] }
        : {}),
      ...(typeof rels?.['found-in-container'] === 'number'
        ? { foundInContainerCount: rels['found-in-container'] }
        : {}),
      ...(typeof rels?.['made-by-recipe'] === 'number'
        ? { madeByRecipeCount: rels['made-by-recipe'] }
        : {}),
      ...(typeof rels?.['monster-drop'] === 'number'
        ? { monsterDropCount: rels['monster-drop'] }
        : {}),
      ...(typeof rels?.['needed-for-quest'] === 'number'
        ? { neededForQuestCount: rels['needed-for-quest'] }
        : {}),
      ...(typeof rels?.['quest-reward'] === 'number'
        ? { questRewardCount: rels['quest-reward'] }
        : {}),
      ...(typeof rels?.['used-in-recipe'] === 'number'
        ? { usedInRecipeCount: rels['used-in-recipe'] }
        : {}),
      ...(record.questFlag === true ? { questFlag: true } : {}),
      ...(typeof record.family === 'string' && record.family.length > 0
        ? { family: record.family }
        : {}),
      ...(typeof record.recovery?.hp === 'number'
        ? { hp: record.recovery.hp }
        : {}),
      ...(typeof record.recovery?.mp === 'number'
        ? { mp: record.recovery.mp }
        : {}),
      ...(typeof record.recovery?.hpPercent === 'number'
        ? { hpPercent: record.recovery.hpPercent }
        : {}),
      ...(typeof record.recovery?.mpPercent === 'number'
        ? { mpPercent: record.recovery.mpPercent }
        : {}),
      ...(typeof record.projectileAttack === 'number'
        ? { attack: record.projectileAttack }
        : {}),
      ...(typeof record.petFood?.closeness === 'number'
        ? { closeness: record.petFood.closeness }
        : {}),
      ...(typeof record.petFood?.fullness === 'number'
        ? { fullness: record.petFood.fullness }
        : {}),
      ...(typeof record.petFood?.tameness === 'number'
        ? { tameness: record.petFood.tameness }
        : {}),
      ...(resolvedPetTargets !== undefined
        ? { petTargets: resolvedPetTargets }
        : {}),
      ...(record.petFood?.unresolvedTargets &&
      record.petFood.unresolvedTargets.length > 0
        ? { unresolvedPetTargets: record.petFood.unresolvedTargets }
        : {}),
      ...(typeof record.seatingRecovery?.hp === 'number'
        ? { seatHp: record.seatingRecovery.hp }
        : {}),
      ...(typeof record.seatingRecovery?.mp === 'number'
        ? { seatMp: record.seatingRecovery.mp }
        : {}),
      ...(typeof record.scroll?.success === 'number'
        ? { success: record.scroll.success }
        : {}),
      ...(typeof record.scroll?.cursed === 'number'
        ? { cursed: record.scroll.cursed }
        : {}),
      ...(record.scroll?.targetLabel !== undefined &&
      record.scroll?.targetLabel !== null
        ? { targetLabel: record.scroll.targetLabel }
        : {}),
      ...(record.scroll?.tier !== undefined && record.scroll?.tier !== null
        ? { tier: record.scroll.tier }
        : {}),
      ...(record.scroll?.specials && record.scroll.specials.length > 0
        ? { specials: record.scroll.specials }
        : {}),
      ...(deltas && statKeys && statKeys.length > 0 ? { stats: deltas } : {}),
      ...(statKeys && statKeys.length > 0 ? { statKeys } : {}),
      ...(statRank !== undefined ? { statRank } : {}),
      ...(record.scroll?.targets !== undefined &&
      record.scroll.targets !== null
        ? { directTargetCount: record.scroll.targets.length }
        : {}),
    };
  });
}
