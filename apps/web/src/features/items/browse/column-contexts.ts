/**
 * Context sets (visible and optional columns per category) for Items Browse.
 */
import type { ColumnKey } from './column-configs';

interface ContextColumnConfig {
  readonly visible: readonly ColumnKey[];
  readonly optional?: readonly ColumnKey[];
}

function context<
  const V extends readonly ColumnKey[],
  const O extends readonly Exclude<ColumnKey, V[number]>[] = readonly [],
>(visible: V, optional?: O): ContextColumnConfig {
  return { visible, ...(optional ? { optional } : {}) };
}

const GENERIC_OPTIONAL = [
  'neededForQuestCount',
  'questRewardCount',
  'usedInRecipeCount',
  'madeByRecipeCount',
  'monsterDropCount',
  'foundInContainerCount',
  'cashShopListingCount',
  'family',
] as const;

const FEEDING_COLUMNS = [
  'closeness',
  'fullness',
  'tameness',
  'petTargets',
] as const;

const CASH_OPTIONAL = [
  'types',
  'functions',
  ...FEEDING_COLUMNS,
  'neededForQuestCount',
  'questRewardCount',
  'usedInRecipeCount',
  'madeByRecipeCount',
  'monsterDropCount',
  'foundInContainerCount',
  'family',
] as const;

export const DEFAULT_CONTEXT_COLUMNS = context(
  ['name', 'itemClass', 'types', 'functions'],
  GENERIC_OPTIONAL,
);

const PROJECTILE_CONTEXT = context(['name', 'attack', 'types', 'functions']);

const CHAIRS_CONTEXT = context([
  'name',
  'seatHp',
  'seatMp',
  'types',
  'functions',
]);

const CASH_CONTEXT = context(['name', 'cashShopListingCount'], CASH_OPTIONAL);

export const CONTEXT_COLUMNS: Readonly<Record<string, ContextColumnConfig>> = {
  all: DEFAULT_CONTEXT_COLUMNS,
  use: DEFAULT_CONTEXT_COLUMNS,
  'use:upgrade-scrolls': context(
    ['name', 'targetLabel', 'stats', 'success', 'cursed', 'tier'],
    ['specials', 'directTargetCount'],
  ),
  'use:recovery': context([
    'name',
    'hp',
    'mp',
    'hpPercent',
    'mpPercent',
    'types',
    'functions',
  ]),
  'use:throwing-stars': PROJECTILE_CONTEXT,
  'use:arrows': PROJECTILE_CONTEXT,
  'use:bullets': PROJECTILE_CONTEXT,
  'use:pet-food': context(['name', ...FEEDING_COLUMNS, 'types', 'functions']),
  etc: context(['name', 'questFlag', 'types', 'functions'], GENERIC_OPTIONAL),
  'etc:quest-items': context([
    'name',
    'neededForQuestCount',
    'questRewardCount',
    'questFlag',
    'types',
    'functions',
  ]),
  'etc:crafting': context([
    'name',
    'usedInRecipeCount',
    'madeByRecipeCount',
    'types',
    'functions',
  ]),
  setup: context(
    ['name', 'seatHp', 'seatMp', 'types', 'functions'],
    GENERIC_OPTIONAL,
  ),
  'setup:chairs': CHAIRS_CONTEXT,
  cash: context(['name', 'kind', 'cashShopListingCount'], CASH_OPTIONAL),
  'cash:cash-items': CASH_CONTEXT,
  'cash:pets': CASH_CONTEXT,
};
