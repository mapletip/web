/** Per-scope and per-child facet selection, keyed by the category registry. */
import { ITEM_SCOPES, type ItemScopeSlug } from './categories';
import type { ItemFacetField } from './facet-config';

const DEFAULT_FACETS = ['types', 'functions', 'rel'] as const;
const SCROLL_FACETS = [
  'scrollTarget',
  'scrollStat',
  'scrollSuccess',
  'scrollRisk',
  'scrollTier',
  'scrollSpecial',
  'scrollDirect',
  'rel',
] as const;
const PET_FEEDING_FACETS = [
  'pet',
  'closeness',
  'fullness',
  'tameness',
  ...DEFAULT_FACETS,
] as const;
const ETC_FACETS = ['questFlag', ...DEFAULT_FACETS] as const;
const CASH_FACETS = ['kind', ...PET_FEEDING_FACETS] as const;

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
  all: { default: DEFAULT_FACETS },
  use: {
    default: DEFAULT_FACETS,
    children: {
      recovery: ['hp', 'mp', 'hpPercent', 'mpPercent', ...DEFAULT_FACETS],
      scrolls: SCROLL_FACETS,
      // MapleKit gap: item browse rows do not expose individual buff effects.
      buffs: ['buffType', 'rel'],
      'throwing-stars': ['attack', ...DEFAULT_FACETS],
      arrows: ['attack', ...DEFAULT_FACETS],
      bullets: ['attack', ...DEFAULT_FACETS],
      'pet-food': PET_FEEDING_FACETS,
    },
  },
  etc: {
    default: ETC_FACETS,
    children: { 'quest-items': ETC_FACETS },
  },
  setup: {
    default: DEFAULT_FACETS,
    children: { chairs: ['seatHp', 'seatMp', ...DEFAULT_FACETS] },
  },
  cash: {
    default: CASH_FACETS,
    children: {
      pets: DEFAULT_FACETS,
      'cash-items': PET_FEEDING_FACETS,
    },
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
