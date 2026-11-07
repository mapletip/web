/**
 * Context sets (visible and optional columns per category) for Items Browse.
 */
import type { ColumnKey } from './column-configs';

export interface ContextColumnConfig {
  readonly visible: readonly ColumnKey[];
  readonly optional?: readonly ColumnKey[];
}

const GENERIC_OPTIONAL: readonly ColumnKey[] = [
  'neededForQuestCount',
  'questRewardCount',
  'usedInRecipeCount',
  'madeByRecipeCount',
  'monsterDropCount',
  'foundInContainerCount',
  'cashShopListingCount',
  'family',
];

const FEEDING_COLUMNS: readonly ColumnKey[] = [
  'closeness',
  'fullness',
  'tameness',
  'petTargets',
];

const CASH_OPTIONAL: readonly ColumnKey[] = [
  'types',
  'functions',
  ...FEEDING_COLUMNS,
  ...GENERIC_OPTIONAL,
];

export const DEFAULT_CONTEXT_COLUMNS: ContextColumnConfig = {
  visible: ['name', 'itemClass', 'types', 'functions'],
  optional: GENERIC_OPTIONAL,
};

const PROJECTILE_CONTEXT: ContextColumnConfig = {
  visible: ['name', 'attack', 'types', 'functions'],
};

const CHAIRS_CONTEXT: ContextColumnConfig = {
  visible: ['name', 'seatHp', 'seatMp', 'types', 'functions'],
};

const CASH_CONTEXT: ContextColumnConfig = {
  visible: ['name', 'cashShopListingCount'],
  optional: CASH_OPTIONAL,
};

export const CONTEXT_COLUMNS: Readonly<Record<string, ContextColumnConfig>> = {
  all: DEFAULT_CONTEXT_COLUMNS,
  use: DEFAULT_CONTEXT_COLUMNS,
  'use:upgrade-scrolls': {
    visible: [
      'name',
      'targetLabel',
      'stats',
      'success',
      'cursed',
      'tier',
      'specials',
      'directTargetCount',
    ],
  },
  'use:recovery': {
    visible: [
      'name',
      'hp',
      'mp',
      'hpPercent',
      'mpPercent',
      'types',
      'functions',
    ],
  },
  'use:throwing-stars': PROJECTILE_CONTEXT,
  'use:arrows': PROJECTILE_CONTEXT,
  'use:bullets': PROJECTILE_CONTEXT,
  'use:pet-food': {
    visible: ['name', ...FEEDING_COLUMNS, 'types', 'functions'],
  },
  etc: {
    visible: ['name', 'questFlag', 'types', 'functions'],
    optional: GENERIC_OPTIONAL,
  },
  'etc:quest-items': {
    visible: [
      'name',
      'neededForQuestCount',
      'questRewardCount',
      'questFlag',
      'types',
      'functions',
    ],
  },
  'etc:crafting': {
    visible: [
      'name',
      'usedInRecipeCount',
      'madeByRecipeCount',
      'types',
      'functions',
    ],
  },
  setup: { ...CHAIRS_CONTEXT, optional: GENERIC_OPTIONAL },
  'setup:chairs': CHAIRS_CONTEXT,
  cash: {
    visible: ['name', 'kind', 'cashShopListingCount'],
    optional: CASH_OPTIONAL,
  },
  'cash:cash-items': CASH_CONTEXT,
  'cash:pets': CASH_CONTEXT,
};
