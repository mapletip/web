import type { StaticMonsterPageRecord } from '@mapletip/data/monsters';

import type { BuildId } from '@/config/maplekit';
import { buildRecordDetailPath } from '@/features/detail';
import {
  projectItemRecordChip,
  type ItemRecordChipView,
} from '@/features/items/shared';
import type { MapRecordCardView } from '@/features/maps/shared';
import { mapMonsterFocusByPublicId } from '@/features/maps/shared/mapRecordDestination';
import {
  projectQuestRecordCard,
  type QuestRecordCardView,
} from '@/features/quests/shared';

import {
  formatMonsterNumber,
  getMonsterNonKnownLabel,
  MONSTER_STAT_BY_ID,
  MONSTER_STAT_DEFINITIONS,
  positiveSpriteDimension,
  resolveMonsterSpriteUrl,
  UNNAMED_MONSTER_LABEL,
} from '../shared';
import type {
  MonsterDetailStatId,
  MonsterDropCategoryId,
  UnknownFactState,
} from '../shared';
import {
  getMonsterDropCategoryId,
  getMonsterDropCategoryLabel,
  MONSTER_DROP_CATEGORIES,
} from '../shared/drop-categories';
import {
  projectMonsterLocationCards,
  type MonsterLocationMapView,
} from '../shared/location-cards';

export type { MonsterLocationMapView as MonsterDetailLocationMapView } from '../shared/location-cards';

export interface MonsterDetailStatView {
  readonly id: MonsterDetailStatId;
  readonly label: string;
  readonly explanation: string;
  readonly value: string;
  readonly known: boolean;
}

export interface MonsterElementResponseView {
  readonly code: string;
  readonly element: string;
  readonly response: string;
}

export interface MonsterDetailDropEntryView extends ItemRecordChipView {
  readonly assertionKind: 'native' | 'historical-overlay';
  readonly sourceBuild?: string;
}

export interface MonsterDetailDropGroupView {
  readonly id: MonsterDropCategoryId;
  readonly label: string;
  readonly count: number;
  readonly entries: readonly MonsterDetailDropEntryView[];
}

export interface MonsterDetailQuestEntryView extends QuestRecordCardView {
  readonly key: string;
  readonly defeatLabel: string;
  readonly sharedCountNote?: string;
}

export type MonsterDetailQuestsView =
  | {
      readonly state: 'present';
      readonly count: number;
      readonly entries: readonly MonsterDetailQuestEntryView[];
    }
  | { readonly state: 'no-quests'; readonly count: 0 }
  | { readonly state: 'unavailable'; readonly count: 'unknown' };

export interface MonsterDetailSummonedItemView extends ItemRecordChipView {
  readonly key: string;
}

export type MonsterDetailSummonedByView =
  | {
      readonly state: 'present';
      readonly count: number;
      readonly entries: readonly MonsterDetailSummonedItemView[];
    }
  | { readonly state: 'absent'; readonly count: 0 };

export type MonsterDetailLocationsView =
  | {
      readonly state: 'present';
      readonly count: number;
      readonly maps: readonly MonsterLocationMapView[];
    }
  | { readonly state: 'no-locations'; readonly count: 0 }
  | { readonly state: 'unavailable'; readonly count: 'unknown' };

export type MonsterDetailDropsView =
  | {
      readonly state: 'present';
      /** Number of entries rendered on the page, not a claim of completeness. */
      readonly count: number;
      readonly groups: readonly MonsterDetailDropGroupView[];
    }
  | { readonly state: 'no-recorded'; readonly count: 0 }
  | { readonly state: 'unavailable'; readonly count: 'unknown' };

/** Serializable, display-ready view model for the Monster Detail hero. */
export interface MonsterDetailView {
  readonly publicId: string;
  readonly slug: string;
  readonly name: string;
  readonly buildId: BuildId;
  readonly canonicalPath: string;
  readonly boss?: boolean;
  readonly undead?: boolean;
  readonly elements: readonly MonsterElementResponseView[];
  readonly stats: readonly MonsterDetailStatView[];
  readonly spriteUrl?: string;
  readonly spriteWidth?: number;
  readonly spriteHeight?: number;
  readonly locations: MonsterDetailLocationsView;
  readonly drops: MonsterDetailDropsView;
  readonly quests: MonsterDetailQuestsView;
  readonly summonedBy: MonsterDetailSummonedByView;
}

type NumericMonsterFact =
  | { readonly state: 'known'; readonly value: number }
  | { readonly state: UnknownFactState };

const STAT_FACTS: Readonly<
  Record<
    MonsterDetailStatId,
    (record: StaticMonsterPageRecord) => NumericMonsterFact
  >
> = {
  level: (record) => record.stats.level,
  hp: (record) => record.stats.hp,
  mp: (record) => record.stats.mp,
  exp: (record) => record.stats.exp,
  physicalAttack: (record) => record.stats.paDamage,
  magicAttack: (record) => record.stats.maDamage,
  physicalDefense: (record) => record.stats.pdDamage,
  magicDefense: (record) => record.stats.mdDamage,
  accuracy: (record) => record.stats.acc,
  avoidability: (record) => record.stats.eva,
  pushed: (record) => record.stats.pushed,
  speed: (record) => record.stats.speed,
};

const ELEMENT_CODE_LABELS: Readonly<Record<string, string>> = {
  D: 'Dark',
  F: 'Fire',
  H: 'Holy',
  I: 'Ice',
  L: 'Lightning',
  P: 'Physical',
  S: 'Poison',
};

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toUpperCase());
}

function projectStat(
  record: StaticMonsterPageRecord,
  id: MonsterDetailStatId,
): MonsterDetailStatView {
  const definition = MONSTER_STAT_BY_ID[id];
  const fact = STAT_FACTS[id](record);
  return {
    id,
    label: definition.label,
    explanation: definition.explanation,
    known: fact.state === 'known',
    value:
      fact.state === 'known'
        ? formatMonsterNumber(fact.value)
        : getMonsterNonKnownLabel(fact.state),
  };
}

function projectElements(
  record: StaticMonsterPageRecord,
): readonly MonsterElementResponseView[] {
  if (
    record.elements.state !== 'known' &&
    record.elements.state !== 'partial'
  ) {
    return [];
  }

  return record.elements.items.flatMap((entry) => {
    if (entry.resistance.state !== 'known') return [];
    return [
      {
        code: entry.code,
        element:
          entry.meaning.state === 'known'
            ? titleCase(entry.meaning.value)
            : (ELEMENT_CODE_LABELS[entry.code] ?? entry.code),
        response: titleCase(entry.resistance.value),
      },
    ];
  });
}

function projectQuest(
  quest: StaticMonsterPageRecord['quests']['entries'][number],
): MonsterDetailQuestEntryView {
  const groupSize = quest.countGroupSize;
  const questCard = projectQuestRecordCard(quest);
  const sharedCountNote =
    groupSize?.state === 'known' && groupSize.value > 1
      ? `Shared with ${formatMonsterNumber(groupSize.value - 1)} other ${groupSize.value === 2 ? 'monster' : 'monsters'}`
      : undefined;

  return {
    key: quest.questKey,
    ...questCard,
    defeatLabel:
      quest.killCount.state === 'known'
        ? `Defeat ×${formatMonsterNumber(quest.killCount.value)}`
        : 'Defeat',
    ...(sharedCountNote === undefined ? {} : { sharedCountNote }),
  };
}

function projectMonsterQuests(
  record: StaticMonsterPageRecord,
): MonsterDetailQuestsView {
  if (record.quests.state === 'unknown') {
    return { state: 'unavailable', count: 'unknown' };
  }
  if (record.quests.state === 'absent' || record.quests.entries.length === 0) {
    return { state: 'no-quests', count: 0 };
  }

  return {
    state: 'present',
    count: record.quests.entries.length,
    entries: record.quests.entries.map(projectQuest),
  };
}

function projectMonsterSummonedBy(
  record: StaticMonsterPageRecord,
): MonsterDetailSummonedByView {
  if (record.summonedByItems.length === 0) {
    return { state: 'absent', count: 0 };
  }

  const entries = record.summonedByItems.map((item, index) => ({
    key: item.itemRef.key ?? `summoned-item-${index}`,
    ...projectItemRecordChip({
      ...(item.name.state === 'known' ? { name: item.name.value } : {}),
      ...(item.icon.state === 'known'
        ? { iconContentId: item.icon.value }
        : {}),
    }),
  }));
  return { state: 'present', count: entries.length, entries };
}

function projectMonsterLocations({
  record,
  buildId,
  minimapSprite,
}: {
  readonly record: StaticMonsterPageRecord;
  readonly buildId: BuildId;
  readonly minimapSprite?: MapRecordCardView['minimapSprite'];
}): MonsterDetailLocationsView {
  const locations = record.locations;
  if (locations.summary.state === 'absent') {
    return { state: 'no-locations', count: 0 };
  }
  if (locations.summary.state === 'unresolved') {
    return { state: 'unavailable', count: 'unknown' };
  }
  if (locations.summary.mapCount === 0) {
    return { state: 'no-locations', count: 0 };
  }

  const maps = projectMonsterLocationCards(
    locations.entries,
    buildId,
    minimapSprite,
  ).map((map) => {
    if (map.destination === undefined) return map;
    const focus = mapMonsterFocusByPublicId(record.publicId);
    return {
      ...map,
      destination: { href: `${map.destination.href}?focus=${focus}` },
    };
  });

  return { state: 'present', count: locations.summary.mapCount, maps };
}

function projectMonsterDrops(
  record: StaticMonsterPageRecord,
): MonsterDetailDropsView {
  const groupedEntries = new Map<
    MonsterDropCategoryId,
    MonsterDetailDropEntryView[]
  >();

  for (const entry of record.drops.entries) {
    let sourceCategory: string | undefined;
    if (entry.category.kind === 'equip-slot') {
      sourceCategory = 'equipment';
    } else if (entry.category.kind === 'item-class') {
      sourceCategory = entry.category.value;
    }
    const category = getMonsterDropCategoryId(sourceCategory);
    const group = groupedEntries.get(category) ?? [];
    group.push({
      ...projectItemRecordChip({
        ...(entry.name.state === 'known' ? { name: entry.name.value } : {}),
        ...(entry.icon.state === 'known'
          ? { iconContentId: entry.icon.value }
          : {}),
      }),
      assertionKind: entry.assertion.kind,
      ...(entry.assertion.kind === 'historical-overlay'
        ? { sourceBuild: entry.assertion.sourceBuild }
        : {}),
    });
    groupedEntries.set(category, group);
  }

  const count = record.drops.entries.length;
  if (count === 0) {
    const { native, historical } = record.drops.summary;
    const nativeHasNoEntries =
      native.state === 'absent' ||
      (native.state === 'known' && native.count === 0);
    const historicalHasNoEntries =
      historical == null || historical.state === 'absent';

    return nativeHasNoEntries && historicalHasNoEntries
      ? { state: 'no-recorded', count: 0 }
      : { state: 'unavailable', count: 'unknown' };
  }

  return {
    state: 'present',
    count,
    groups: MONSTER_DROP_CATEGORIES.flatMap(({ id }) => {
      const entries = groupedEntries.get(id);
      return entries === undefined
        ? []
        : [
            {
              id,
              label: getMonsterDropCategoryLabel(id, 'detail'),
              count: entries.length,
              entries,
            },
          ];
    }),
  };
}

/**
 * Project a verified MapleKit Monster page record into the serializable hero
 * view. Non-known facts keep the same wording as Monster Browse.
 */
export function projectMonsterDetail(
  record: StaticMonsterPageRecord,
  buildId: BuildId,
): MonsterDetailView {
  const name =
    record.name.state === 'known' ? record.name.value : UNNAMED_MONSTER_LABEL;
  const spriteUrl =
    record.sprite.contentId.state === 'known'
      ? resolveMonsterSpriteUrl(record.sprite.contentId.value)
      : undefined;
  const spriteWidth = positiveSpriteDimension(record.sprite.width);
  const spriteHeight = positiveSpriteDimension(record.sprite.height);
  const minimapSprite =
    spriteUrl === undefined ||
    spriteWidth === undefined ||
    spriteHeight === undefined
      ? undefined
      : { url: spriteUrl, width: spriteWidth, height: spriteHeight };

  return {
    publicId: record.publicId,
    slug: record.slug,
    name,
    buildId,
    canonicalPath: buildRecordDetailPath(
      'monsters',
      record.slug,
      record.publicId,
      buildId,
    ),
    ...(record.boss.state === 'known' ? { boss: record.boss.value } : {}),
    ...(record.undead.state === 'known' ? { undead: record.undead.value } : {}),
    elements: projectElements(record),
    stats: MONSTER_STAT_DEFINITIONS.map(({ id }) => projectStat(record, id)),
    locations: projectMonsterLocations({
      record,
      buildId,
      ...(minimapSprite === undefined ? {} : { minimapSprite }),
    }),
    drops: projectMonsterDrops(record),
    quests: projectMonsterQuests(record),
    summonedBy: projectMonsterSummonedBy(record),
    ...(spriteUrl === undefined ? {} : { spriteUrl }),
    ...(spriteWidth === undefined ? {} : { spriteWidth }),
    ...(spriteHeight === undefined ? {} : { spriteHeight }),
  };
}
