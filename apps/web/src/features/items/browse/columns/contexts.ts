/**
 * Context sets (visible and optional columns per category) for Items Browse.
 */
import type { ColumnKey } from './configs';

export interface ContextColumnConfig {
  readonly visible: readonly ColumnKey[];
  readonly optional?: readonly ColumnKey[];
}

function context<
  const V extends readonly ColumnKey[],
  const O extends readonly Exclude<ColumnKey, V[number]>[] = readonly [],
>(visible: V, optional?: O): ContextColumnConfig {
  return { visible, ...(optional ? { optional } : {}) };
}

const RELATIONSHIP_COLUMNS = [
  'neededForQuestCount',
  'questRewardCount',
  'usedInRecipeCount',
  'madeByRecipeCount',
  'monsterDropCount',
  'foundInContainerCount',
] as const;

const GENERIC_OPTIONAL = [
  ...RELATIONSHIP_COLUMNS,
  'cashShopListingCount',
] as const;

const FEEDING_COLUMNS = [
  'closeness',
  'fullness',
  'tameness',
  'petTargets',
] as const;

const CASH_OPTIONAL = [...RELATIONSHIP_COLUMNS, ...FEEDING_COLUMNS] as const;

export const DEFAULT_CONTEXT_COLUMNS = context(
  ['name', 'itemClass', 'functions'],
  GENERIC_OPTIONAL,
);

const USE_CONTEXT = context(['name', 'functions'], GENERIC_OPTIONAL);
const PROJECTILE_CONTEXT = context(['name', 'attack', 'functions']);

const CHAIRS_CONTEXT = context(['name', 'seatHp', 'seatMp', 'functions']);

const CASH_CONTEXT = context(['name', 'cashShopListingCount'], CASH_OPTIONAL);

export const CONTEXT_COLUMNS: Readonly<Record<string, ContextColumnConfig>> = {
  all: DEFAULT_CONTEXT_COLUMNS,
  use: USE_CONTEXT,
  'use:scrolls': context(
    ['name', 'targetLabel', 'stats', 'success', 'cursed', 'tier'],
    ['specials', 'directTargetCount'],
  ),
  'use:recovery': context([
    'name',
    'hp',
    'mp',
    'hpPercent',
    'mpPercent',
    'functions',
  ]),
  'use:buffs': USE_CONTEXT,
  'use:throwing-stars': PROJECTILE_CONTEXT,
  'use:arrows': PROJECTILE_CONTEXT,
  'use:bullets': PROJECTILE_CONTEXT,
  'use:pet-food': context(['name', ...FEEDING_COLUMNS, 'functions']),
  'use:summoning-sacks': USE_CONTEXT,
  'use:boxes': USE_CONTEXT,
  'use:monster-cards': USE_CONTEXT,
  'use:mastery-books': USE_CONTEXT,
  'use:meso-pouches': USE_CONTEXT,
  etc: context(['name', 'questFlag', 'functions'], GENERIC_OPTIONAL),
  'etc:quest-items': context([
    'name',
    'neededForQuestCount',
    'questRewardCount',
    'questFlag',
    'functions',
  ]),
  'etc:ores': USE_CONTEXT,
  'etc:gems': USE_CONTEXT,
  'etc:refined-ores': USE_CONTEXT,
  'etc:monster-drops': USE_CONTEXT,
  setup: CHAIRS_CONTEXT,
  'setup:chairs': CHAIRS_CONTEXT,
  'setup:event-items': context(['name', 'functions'], GENERIC_OPTIONAL),
  'setup:furniture': context(['name', 'functions'], GENERIC_OPTIONAL),
  'setup:crafting-stations': context(['name', 'functions'], GENERIC_OPTIONAL),
  cash: CASH_CONTEXT,
  'cash:cash-items': CASH_CONTEXT,
  'cash:pets': CASH_CONTEXT,
};
