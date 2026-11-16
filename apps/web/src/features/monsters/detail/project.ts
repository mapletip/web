import { itemIconUrl } from '@mapletip/data/items';
import type { MonsterPageRecordV1 } from '@mapletip/data/monsters';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import { buildRecordDetailPath } from '@/features/detail';

import {
  formatMonsterNumber,
  getMonsterNonKnownLabel,
  MONSTER_STAT_BY_ID,
  MONSTER_STAT_DEFINITIONS,
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

export interface MonsterDetailDropEntryView {
  readonly name: string;
  readonly iconUrl?: string;
  readonly assertionKind: 'native' | 'historical-overlay';
  readonly sourceBuild?: string;
}

export interface MonsterDetailDropGroupView {
  readonly id: MonsterDropCategoryId;
  readonly label: string;
  readonly count: number;
  readonly entries: readonly MonsterDetailDropEntryView[];
}

export interface MonsterDetailLocationMapView {
  /** Stable Map product key; names are not unique. */
  readonly key: string;
  readonly name: string;
  readonly geographyLine?: string;
  readonly minimapUrl?: string;
  readonly placementCount: number;
  readonly placementLabel: string;
}

export interface MonsterDetailQuestEntryView {
  readonly key: string;
  readonly name: string;
  readonly minimumLevelLabel: string;
  readonly jobRequirementLabel: string;
  readonly defeatLabel: string;
  readonly repeatable: boolean;
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

export interface MonsterDetailSummonedItemView {
  readonly key: string;
  readonly name: string;
  readonly iconUrl?: string;
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
      readonly maps: readonly MonsterDetailLocationMapView[];
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
    (record: MonsterPageRecordV1) => NumericMonsterFact
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
  record: MonsterPageRecordV1,
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
  record: MonsterPageRecordV1,
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

function positiveDimension(
  value: number | null | undefined,
): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function nonBlank(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}

function mapMinimapUrl(contentId: string): string {
  const prefix = contentId.slice(0, 2);
  return new URL(
    `media/images/${prefix}/${contentId}.png`,
    MAPLEKIT_RELEASE.baseUrl,
  ).toString();
}

/**
 * The local Quest consumer has authoritative labels for job class-base codes.
 * Advancement codes need the Jobs catalog, which this detail read does not expose.
 */
const JOB_FAMILY_LABELS: Readonly<Record<number, string>> = {
  0: 'Beginner',
  100: 'Warrior',
  200: 'Magician',
  300: 'Bowman',
  400: 'Thief',
  500: 'Pirate',
  1000: 'Cygnus Knights',
  2000: 'Aran',
  2001: 'Evan',
};

function projectQuestJobRequirement(
  jobCodes: MonsterPageRecordV1['quests']['entries'][number]['jobCodes'],
): string {
  if (jobCodes.state === 'absent') return 'All jobs';
  if (jobCodes.state !== 'known' && jobCodes.state !== 'partial') {
    return 'Job requirement unavailable';
  }

  const labels = new Set<string>();
  let unresolved = 0;
  for (const code of jobCodes.items) {
    const label = JOB_FAMILY_LABELS[code];
    if (label === undefined) unresolved += 1;
    else labels.add(label);
  }

  const requirement = [...labels].join(', ');
  const incomplete = jobCodes.state === 'partial' || unresolved > 0;
  if (requirement.length === 0) return 'Job requirement unavailable';
  return incomplete
    ? `${requirement} · Some job requirements unavailable`
    : requirement;
}

function projectQuestMinimumLevel(
  minLevel: MonsterPageRecordV1['quests']['entries'][number]['minLevel'],
): string {
  if (minLevel.state === 'known') {
    return `Minimum level: ${formatMonsterNumber(minLevel.value)}`;
  }
  if (minLevel.state === 'absent') return 'No minimum level';
  return 'Minimum level unavailable';
}

function projectQuest(
  quest: MonsterPageRecordV1['quests']['entries'][number],
): MonsterDetailQuestEntryView {
  const groupSize = quest.countGroupSize;
  const sharedCountNote =
    groupSize?.state === 'known' && groupSize.value > 1
      ? `Count shared with ${formatMonsterNumber(groupSize.value - 1)} other ${groupSize.value === 2 ? 'monster' : 'monsters'}`
      : undefined;

  return {
    key: quest.questKey,
    name:
      quest.name.state === 'known'
        ? quest.name.value
        : 'Quest name unavailable',
    minimumLevelLabel: projectQuestMinimumLevel(quest.minLevel),
    jobRequirementLabel: projectQuestJobRequirement(quest.jobCodes),
    defeatLabel:
      quest.killCount.state === 'known'
        ? `Defeat ×${formatMonsterNumber(quest.killCount.value)}`
        : 'Defeat',
    repeatable: quest.repeatable.state === 'known' && quest.repeatable.value,
    ...(sharedCountNote === undefined ? {} : { sharedCountNote }),
  };
}

function projectMonsterQuests(
  record: MonsterPageRecordV1,
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
  record: MonsterPageRecordV1,
): MonsterDetailSummonedByView {
  if (record.summonedByItems.length === 0) {
    return { state: 'absent', count: 0 };
  }

  const entries = record.summonedByItems.map((item, index) => ({
    key: item.itemRef.key ?? `summoned-item-${index}`,
    name:
      item.name.state === 'known' ? item.name.value : 'Item name unavailable',
    ...(item.icon.state === 'known'
      ? { iconUrl: itemIconUrl(MAPLEKIT_RELEASE.baseUrl, item.icon.value) }
      : {}),
  }));
  return { state: 'present', count: entries.length, entries };
}

function projectMonsterLocations(
  record: MonsterPageRecordV1,
): MonsterDetailLocationsView {
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

  const regionIds = new Set(
    locations.entries.flatMap((entry) => {
      const key = nonBlank(entry.geography?.regionKey);
      const label = nonBlank(entry.geography?.regionLabel);
      return key === undefined && label === undefined ? [] : [key ?? label!];
    }),
  );
  const showRegion = regionIds.size > 1;
  const maps = locations.entries
    .map((entry) => {
      const street = nonBlank(entry.streetName);
      const region = showRegion
        ? nonBlank(entry.geography?.regionLabel)
        : undefined;
      const minimapUrl =
        entry.minimap.state === 'known'
          ? mapMinimapUrl(entry.minimap.value)
          : undefined;
      const name =
        nonBlank(entry.name.state === 'known' ? entry.name.value : undefined) ??
        'Map name unavailable';

      return {
        key: entry.mapKey,
        name,
        ...(street === undefined && region === undefined
          ? {}
          : { geographyLine: [street, region].filter(Boolean).join(' · ') }),
        ...(minimapUrl === undefined ? {} : { minimapUrl }),
        placementCount: entry.placementCount,
        placementLabel:
          entry.placementCount === 1
            ? '1 spawn'
            : `${formatMonsterNumber(entry.placementCount)} spawns`,
      } satisfies MonsterDetailLocationMapView;
    })
    .sort(
      (left, right) =>
        right.placementCount - left.placementCount ||
        left.name.localeCompare(right.name, 'en', { sensitivity: 'base' }) ||
        left.key.localeCompare(right.key),
    );

  return { state: 'present', count: locations.summary.mapCount, maps };
}

function projectMonsterDrops(
  record: MonsterPageRecordV1,
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
      name:
        entry.name.state === 'known'
          ? entry.name.value
          : 'Item name unavailable',
      ...(entry.icon.state === 'known'
        ? {
            iconUrl: itemIconUrl(MAPLEKIT_RELEASE.baseUrl, entry.icon.value),
          }
        : {}),
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
  record: MonsterPageRecordV1,
  buildId: BuildId,
): MonsterDetailView {
  const name =
    record.name.state === 'known' ? record.name.value : UNNAMED_MONSTER_LABEL;
  const spriteUrl =
    record.sprite.contentId.state === 'known'
      ? resolveMonsterSpriteUrl(record.sprite.contentId.value)
      : undefined;
  const spriteWidth = positiveDimension(record.sprite.width);
  const spriteHeight = positiveDimension(record.sprite.height);

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
    locations: projectMonsterLocations(record),
    drops: projectMonsterDrops(record),
    quests: projectMonsterQuests(record),
    summonedBy: projectMonsterSummonedBy(record),
    ...(spriteUrl === undefined ? {} : { spriteUrl }),
    ...(spriteWidth === undefined ? {} : { spriteWidth }),
    ...(spriteHeight === undefined ? {} : { spriteHeight }),
  };
}
