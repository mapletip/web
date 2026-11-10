/** Per-scope and per-child facet selection, keyed by the category registry. */
import { ITEM_SCOPES, type ItemScopeSlug } from './categories';
import type { ItemFacetField } from './facet-config';

const SHARED_FACETS = ['quests', 'crafting', 'sources'] as const;
const RECOVERY_FACETS = [
  ...SHARED_FACETS,
  'recoveryRestores',
  'hp',
  'mp',
  'percentageRecovery',
] as const;
const SCROLL_FACETS = [
  ...SHARED_FACETS,
  'scrollTarget',
  'scrollStat',
  'scrollSuccess',
  'scrollDestructionChance',
] as const;
const PROJECTILE_FACETS = [...SHARED_FACETS, 'attack'] as const;
const ETC_FACETS = [...SHARED_FACETS, 'noRecordedQuestOrRecipeUse'] as const;
const CHAIR_FACETS = [
  ...SHARED_FACETS,
  'chairRestores',
  'seatHp',
  'seatMp',
] as const;
const CASH_FACETS = [...SHARED_FACETS, 'cashShop'] as const;

type ScopeChildSlugs = {
  readonly [
    Slug in keyof typeof ITEM_SCOPES
  ]: (typeof ITEM_SCOPES)[Slug]['children'][number]['slug'];
};

type ItemFacetContexts = {
  readonly [Slug in keyof typeof ITEM_SCOPES]: {
    readonly default: readonly ItemFacetField[];
    readonly children?: Readonly<
      Partial<Record<ScopeChildSlugs[Slug], readonly ItemFacetField[]>>
    >;
  };
};

export const ITEM_FACET_CONTEXTS = {
  all: { default: SHARED_FACETS },
  use: {
    default: SHARED_FACETS,
    children: {
      recovery: RECOVERY_FACETS,
      scrolls: SCROLL_FACETS,
      'throwing-stars': PROJECTILE_FACETS,
      arrows: PROJECTILE_FACETS,
      bullets: PROJECTILE_FACETS,
    },
  },
  etc: { default: ETC_FACETS },
  setup: {
    default: SHARED_FACETS,
    children: { chairs: CHAIR_FACETS },
  },
  cash: {
    default: CASH_FACETS,
    children: { pets: SHARED_FACETS, 'cash-items': CASH_FACETS },
  },
} satisfies ItemFacetContexts;

const contexts: Readonly<
  Record<
    ItemScopeSlug,
    {
      readonly default: readonly ItemFacetField[];
      readonly children?: Readonly<
        Partial<Record<string, readonly ItemFacetField[]>>
      >;
    }
  >
> = ITEM_FACET_CONTEXTS;

interface GetItemFacetFieldsOptions {
  readonly scope: ItemScopeSlug;
  readonly childSlug?: string | undefined;
}

/** Returns the configured child facets or the explicit scope default. */
export function getItemFacetFields({
  scope,
  childSlug,
}: GetItemFacetFieldsOptions): readonly ItemFacetField[] {
  return (
    (childSlug === undefined
      ? undefined
      : contexts[scope].children?.[childSlug]) ?? contexts[scope].default
  );
}
