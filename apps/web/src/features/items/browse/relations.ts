import {
  getItemRelatedEntities,
  type ItemRelatedEntityBrowsePack,
} from '@mapletip/data/items';
import { openRelease } from '@mapletip/data/release';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import {
  classifyDrop,
  resolveBrowseDropEvidence,
  type DropSource,
} from '@/features/drops';
import { resolveMonsterSpriteUrl } from '@/features/monsters/shared/sprite';

import type { CategorizedItemRow } from './project';

export type ItemDrawerRelationKind =
  'needed-for-quest' | 'quest-reward' | 'used-in-recipe' | 'monster-drop';

type RelatedEntityPackV2 = Extract<
  ItemRelatedEntityBrowsePack,
  { readonly contractVersion: '2.0' }
>;

export type ItemDrawerPack<K extends ItemDrawerRelationKind> = Extract<
  RelatedEntityPackV2,
  { readonly relationshipKind: K }
>;

type QuestTarget = ItemDrawerPack<'needed-for-quest'>['targets'][number];
type QuestRole = NonNullable<
  ItemDrawerPack<'needed-for-quest'>['records'][string]
>[number]['roles'][number]['role'];
type QuestRecurrence = Extract<
  QuestTarget['recurrence'],
  { readonly state: 'known' | 'partial' }
>['items'][number];

export const ITEM_DRAWER_QUEST_LIMIT = 5;
export const ITEM_DRAWER_RECIPE_LIMIT = 5;
export const ITEM_DRAWER_MONSTER_LIMIT = 6;

export const REQUIRED_QUEST_ROLES: ReadonlySet<QuestRole> = new Set([
  'turned-in',
  'held-to-complete',
  'held-to-start',
]);

const numberFormat = new Intl.NumberFormat('en-US');

/** One lazy relationship and description reader per mounted Items page. */
export function createItemRelationReader(buildId: BuildId) {
  const relationRequests = new Map<
    ItemDrawerRelationKind,
    Promise<RelatedEntityPackV2>
  >();
  let descriptionsRequest:
    Promise<Readonly<Record<string, string>>> | undefined;

  return {
    readRelation<K extends ItemDrawerRelationKind>(
      kind: K,
    ): Promise<ItemDrawerPack<K>> {
      const existing = relationRequests.get(kind);
      if (existing !== undefined) {
        return existing as Promise<ItemDrawerPack<K>>;
      }
      const request = getItemRelatedEntities({
        ...MAPLEKIT_RELEASE,
        buildId,
        kind,
      })
        .then((pack) => {
          if (
            pack.contractVersion !== '2.0' ||
            pack.relationshipKind !== kind
          ) {
            throw new Error(
              `Unexpected Item related-entity pack ${pack.contractVersion} for ${kind}.`,
            );
          }
          return pack;
        })
        .catch((error: unknown) => {
          if (relationRequests.get(kind) === request) {
            relationRequests.delete(kind);
          }
          throw error;
        });
      relationRequests.set(kind, request);
      return request as Promise<ItemDrawerPack<K>>;
    },
    forgetRelation(
      kind: ItemDrawerRelationKind,
      previous?: Promise<unknown>,
    ): void {
      if (previous === undefined || relationRequests.get(kind) === previous) {
        relationRequests.delete(kind);
      }
    },
    readDescriptions(): Promise<Readonly<Record<string, string>>> {
      if (descriptionsRequest !== undefined) {
        return descriptionsRequest;
      }
      const request = openRelease(MAPLEKIT_RELEASE)
        .then((release) => release.openItemBuild(buildId))
        .then((product) => product.loadDescriptions())
        .catch((error: unknown) => {
          if (descriptionsRequest === request) {
            descriptionsRequest = undefined;
          }
          throw error;
        });
      descriptionsRequest = request;
      return request;
    },
    forgetDescriptions(previous?: Promise<unknown>): void {
      if (previous === undefined || descriptionsRequest === previous) {
        descriptionsRequest = undefined;
      }
    },
  };
}

export type ItemRelationReader = ReturnType<typeof createItemRelationReader>;

export interface ItemDrawerQuestEntry {
  readonly key: string;
  readonly name: string;
  readonly amountText?: string;
  readonly levelText?: string;
  readonly startNpc?: string;
  readonly recurrenceText?: string;
}

interface ItemDrawerRecipeEntry {
  readonly key: string;
  readonly productName: string;
  readonly amountText?: string;
}

interface ItemDrawerMonsterEntry {
  readonly key: string;
  readonly name: string;
  readonly levelText?: string;
  readonly spriteUrl?: string;
  readonly sources: readonly DropSource[];
}

export interface ItemDrawerRelations {
  readonly description?: string;
  readonly requiredQuests: readonly ItemDrawerQuestEntry[];
  readonly rewardQuests: readonly ItemDrawerQuestEntry[];
  readonly recipes: readonly ItemDrawerRecipeEntry[];
  readonly monsters: readonly ItemDrawerMonsterEntry[];
}

function everyUnit({
  count,
  unit,
}: {
  readonly count: number;
  readonly unit: 'hour' | 'minute';
}): string {
  return count === 1
    ? `Every ${unit}`
    : `Every ${numberFormat.format(count)} ${unit}s`;
}

function formatRecurrenceItem(item: QuestRecurrence): string {
  switch (item.kind) {
    case 'day-by-day':
      return 'Daily';
    case 'weekly-repeat':
      return 'Weekly';
    case 'day-of-week':
      return item.day ? `Every ${item.day}` : 'Weekly';
    case 'interval':
      if (item.minutes === 1440) return 'Daily';
      if (item.minutes > 0 && item.minutes % 60 === 0) {
        return everyUnit({ count: item.minutes / 60, unit: 'hour' });
      }
      if (item.minutes > 0) {
        return everyUnit({ count: item.minutes, unit: 'minute' });
      }
      return 'Repeatable';
  }
}

function formatQuestRecurrence(
  recurrence: QuestTarget['recurrence'],
): string | undefined {
  if (recurrence.state !== 'known' && recurrence.state !== 'partial') {
    return undefined;
  }
  const labels = [...new Set(recurrence.items.map(formatRecurrenceItem))];
  return labels.length > 0 ? labels.join(', ') : undefined;
}

function projectQuestEntry({
  quest,
  amount,
}: {
  readonly quest: QuestTarget;
  readonly amount?: number | null | undefined;
}): ItemDrawerQuestEntry | undefined {
  const name = quest.displayName?.trim();
  if (!name) return undefined;
  const levelText =
    quest.startLevel.state === 'known'
      ? `Level ${numberFormat.format(quest.startLevel.value)}`
      : undefined;
  const startNpc =
    quest.startNpc.state === 'known' &&
    quest.startNpc.value.name.state === 'known' &&
    quest.startNpc.value.name.value.trim().length > 0
      ? quest.startNpc.value.name.value.trim()
      : undefined;
  const recurrenceText = formatQuestRecurrence(quest.recurrence);
  const amountText =
    amount != null ? `${numberFormat.format(amount)} needed` : undefined;
  return {
    key: quest.key,
    name,
    ...(amountText === undefined ? {} : { amountText }),
    ...(levelText === undefined ? {} : { levelText }),
    ...(startNpc === undefined ? {} : { startNpc }),
    ...(recurrenceText === undefined ? {} : { recurrenceText }),
  };
}

export function requiredRelationKindsForItem({
  record,
}: {
  readonly record: CategorizedItemRow;
}): readonly ItemDrawerRelationKind[] {
  const kinds: ItemDrawerRelationKind[] = [];
  if ((record.neededForQuestCount ?? 0) > 0) kinds.push('needed-for-quest');
  if ((record.questRewardCount ?? 0) > 0) kinds.push('quest-reward');
  if ((record.usedInRecipeCount ?? 0) > 0) kinds.push('used-in-recipe');
  if ((record.monsterDropCount ?? 0) > 0) kinds.push('monster-drop');
  return kinds;
}

/** Project one item's description and named relationships for the item drawer. */
export function projectItemDrawerRelations({
  record,
  descriptions,
  neededForQuest,
  questReward,
  usedInRecipe,
  monsterDrop,
}: {
  readonly record: CategorizedItemRow;
  readonly descriptions?: Readonly<Record<string, string>> | undefined;
  readonly neededForQuest?: ItemDrawerPack<'needed-for-quest'> | undefined;
  readonly questReward?: ItemDrawerPack<'quest-reward'> | undefined;
  readonly usedInRecipe?: ItemDrawerPack<'used-in-recipe'> | undefined;
  readonly monsterDrop?: ItemDrawerPack<'monster-drop'> | undefined;
}): ItemDrawerRelations {
  const rawDescription = descriptions?.[record.key]?.trim();
  const description = rawDescription ? rawDescription : undefined;

  const requiredQuests: ItemDrawerQuestEntry[] = [];
  const seenRequired = new Set<string>();
  for (const edge of neededForQuest?.records[record.key] ?? []) {
    const matchingRoles = edge.roles.filter(({ role }) =>
      REQUIRED_QUEST_ROLES.has(role),
    );
    if (matchingRoles.length === 0) continue;
    const quest = neededForQuest?.targets[edge.target];
    if (quest === undefined || seenRequired.has(quest.key)) continue;
    const amount = matchingRoles.find((role) => role.amount != null)?.amount;
    const entry = projectQuestEntry({ quest, amount });
    if (entry === undefined) continue;
    seenRequired.add(quest.key);
    requiredQuests.push(entry);
  }

  const rewardQuests: ItemDrawerQuestEntry[] = [];
  const seenReward = new Set<string>();
  for (const targetIndex of questReward?.records[record.key] ?? []) {
    const quest = questReward?.targets[targetIndex];
    if (quest === undefined || seenReward.has(quest.key)) continue;
    const entry = projectQuestEntry({ quest });
    if (entry === undefined) continue;
    seenReward.add(quest.key);
    rewardQuests.push(entry);
  }

  const recipes: ItemDrawerRecipeEntry[] = [];
  const seenRecipes = new Set<string>();
  for (const edge of usedInRecipe?.records[record.key] ?? []) {
    const recipe = usedInRecipe?.targets[edge.target];
    if (recipe === undefined || seenRecipes.has(recipe.key)) continue;
    const productNames = recipe.products.flatMap((product) =>
      product.name.state === 'known' && product.name.value.trim().length > 0
        ? [product.name.value.trim()]
        : [],
    );
    if (productNames.length === 0) continue;
    seenRecipes.add(recipe.key);
    const amountText =
      edge.amount != null
        ? `${numberFormat.format(edge.amount)} needed`
        : undefined;
    recipes.push({
      key: recipe.key,
      productName: productNames.join(', '),
      ...(amountText === undefined ? {} : { amountText }),
    });
  }

  const monsters: ItemDrawerMonsterEntry[] = [];
  const seenMonsters = new Set<string>();
  if (monsterDrop !== undefined) {
    for (const edge of monsterDrop.records[record.key] ?? []) {
      const monster = monsterDrop.targets[edge.target];
      const name = monster?.displayName?.trim();
      if (monster === undefined || !name || seenMonsters.has(monster.key)) {
        continue;
      }
      seenMonsters.add(monster.key);
      const levelText =
        monster.level.state === 'known'
          ? `Level ${numberFormat.format(monster.level.value)}`
          : undefined;
      const spriteUrl =
        monster.sprite.state === 'known'
          ? resolveMonsterSpriteUrl(monster.sprite.value)
          : undefined;
      const { sources } = classifyDrop(
        edge.evidence.map((entry) =>
          resolveBrowseDropEvidence({
            pack: monsterDrop.evidence,
            evidence: entry,
          }),
        ),
      );
      monsters.push({
        key: monster.key,
        name,
        ...(levelText === undefined ? {} : { levelText }),
        ...(spriteUrl === undefined ? {} : { spriteUrl }),
        sources,
      });
    }
  }

  return {
    ...(description === undefined ? {} : { description }),
    requiredQuests,
    rewardQuests,
    recipes,
    monsters,
  };
}
