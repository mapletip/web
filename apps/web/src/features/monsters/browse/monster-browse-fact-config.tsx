import type {
  FacetDefinition,
  FacetRangeBucket,
} from '@mapletip/component-library';
import {
  ArrowsLeftRight,
  Calculator,
  Crown,
  Heart,
  Heartbeat,
  Medal,
  Package,
  PersonSimpleRun,
  Shield,
  ShieldStar,
  Skull,
  Sparkle,
  Sword,
  Target,
  TrendUp,
  Wind,
} from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import type { MonsterBrowseRow, MonsterFactId } from './project';

type MonsterCardPlacement =
  | { readonly section: 'identity'; readonly factId: MonsterFactId }
  | {
      readonly section: 'training' | 'combat';
      readonly factId: MonsterFactId | 'hpRegen';
    }
  | { readonly section: 'dropAction' };

export interface MonsterBrowseFactConfig {
  readonly id: string;
  readonly label: string;
  readonly icon?: typeof Heart;
  readonly iconSize?: 14 | 15 | 16;
  readonly iconColor?: string;
  readonly showIconInCard?: boolean;
  readonly card?: MonsterCardPlacement;
  readonly facet?: {
    readonly field: string;
    readonly kind: FacetDefinition<MonsterBrowseRow>['kind'];
    readonly buckets?: readonly FacetRangeBucket[] | 'quantile';
  };
}

export type MonsterBrowseCardStatFact = MonsterBrowseFactConfig & {
  readonly card: {
    readonly section: 'training' | 'combat';
    readonly factId: MonsterFactId | 'hpRegen';
  };
};

/** One source for Monster Browse labels, icons, card placement and facets. */
export const MONSTER_BROWSE_FACT_CONFIG = {
  level: {
    id: 'level',
    label: 'Level',
    icon: Medal,
    iconSize: 16,
    showIconInCard: false,
    card: { section: 'identity', factId: 'level' },
    facet: { field: 'level', kind: 'range', buckets: 'quantile' },
  },
  hp: {
    id: 'hp',
    label: 'HP',
    icon: Heart,
    iconSize: 16,
    iconColor: '#f28f91',
    card: { section: 'training', factId: 'hp' },
    facet: { field: 'hp', kind: 'range', buckets: 'quantile' },
  },
  exp: {
    id: 'exp',
    label: 'EXP',
    icon: TrendUp,
    iconSize: 15,
    iconColor: '#f5bd56',
    card: { section: 'training', factId: 'exp' },
    facet: { field: 'exp', kind: 'range', buckets: 'quantile' },
  },
  expPer100Hp: {
    id: 'expPer100Hp',
    label: 'EXP / 100 HP',
    icon: Calculator,
    iconSize: 14,
    iconColor: '#f5bd56',
    card: { section: 'training', factId: 'expPer100Hp' },
    facet: { field: 'expPer100Hp', kind: 'range' },
  },
  boss: {
    id: 'boss',
    label: 'Boss',
    icon: Crown,
    iconSize: 16,
    facet: { field: 'boss', kind: 'boolean' },
  },
  undead: {
    id: 'undead',
    label: 'Undead',
    icon: Skull,
    iconSize: 16,
    facet: { field: 'undead', kind: 'boolean' },
  },
  dropsItem: {
    id: 'drops-item',
    label: 'Drops item',
    icon: Package,
    iconSize: 14,
    card: { section: 'dropAction' },
    facet: { field: 'dropItemKeys', kind: 'multi-select' },
  },
  physicalAttack: {
    id: 'physicalAttack',
    label: 'W. ATT',
    icon: Sword,
    iconSize: 16,
    card: { section: 'combat', factId: 'physicalAttack' },
  },
  magicAttack: {
    id: 'magicAttack',
    label: 'M. ATT',
    icon: Sparkle,
    iconSize: 16,
    card: { section: 'combat', factId: 'magicAttack' },
  },
  accuracy: {
    id: 'accuracy',
    label: 'ACC',
    icon: Target,
    iconSize: 16,
    card: { section: 'combat', factId: 'accuracy' },
  },
  physicalDefense: {
    id: 'physicalDefense',
    label: 'W. DEF',
    icon: Shield,
    iconSize: 16,
    card: { section: 'combat', factId: 'physicalDefense' },
  },
  magicDefense: {
    id: 'magicDefense',
    label: 'M. DEF',
    icon: ShieldStar,
    iconSize: 16,
    card: { section: 'combat', factId: 'magicDefense' },
  },
  avoidability: {
    id: 'avoidability',
    label: 'AVOID',
    icon: Wind,
    iconSize: 16,
    card: { section: 'combat', factId: 'avoidability' },
  },
  pushed: {
    id: 'pushed',
    label: 'Knockback',
    icon: ArrowsLeftRight,
    iconSize: 14,
    card: { section: 'combat', factId: 'pushed' },
  },
  speed: {
    id: 'speed',
    label: 'Speed',
    icon: PersonSimpleRun,
    iconSize: 14,
    card: { section: 'combat', factId: 'speed' },
  },
  hpRegen: {
    id: 'hpRegen',
    label: 'HP Regen',
    icon: Heartbeat,
    iconSize: 14,
    card: { section: 'combat', factId: 'hpRegen' },
  },
} satisfies Readonly<Record<string, MonsterBrowseFactConfig>>;

export function renderMonsterBrowseFactIcon(
  fact: MonsterBrowseFactConfig,
  {
    className,
    surface = 'facet',
  }: {
    readonly className?: string | undefined;
    readonly surface?: 'card' | 'facet';
  } = {},
): ReactElement | undefined {
  if (fact.icon === undefined) return undefined;
  if (surface === 'card' && fact.showIconInCard === false) return undefined;
  const Icon = fact.icon;
  return (
    <Icon
      aria-hidden="true"
      size={fact.iconSize ?? 16}
      color={fact.iconColor ?? 'var(--mantine-color-dimmed)'}
      className={className}
      data-monster-fact-icon={fact.id}
    />
  );
}

export function getMonsterBrowseFacetDefinition(
  fact: MonsterBrowseFactConfig,
): FacetDefinition<MonsterBrowseRow> | undefined {
  if (fact.facet === undefined) return undefined;
  const icon = renderMonsterBrowseFactIcon(fact);
  return {
    id: fact.id,
    label: fact.label,
    ...fact.facet,
    ...(icon === undefined ? {} : { icon }),
  };
}

export function getMonsterBrowseCardFacts(
  section: 'training' | 'combat',
): readonly MonsterBrowseCardStatFact[] {
  const facts: readonly MonsterBrowseFactConfig[] = Object.values(
    MONSTER_BROWSE_FACT_CONFIG,
  );
  return facts
    .filter(isMonsterBrowseCardStatFact)
    .filter((fact) => fact.card.section === section);
}

function isMonsterBrowseCardStatFact(
  fact: MonsterBrowseFactConfig,
): fact is MonsterBrowseCardStatFact {
  return fact.card?.section === 'training' || fact.card?.section === 'combat';
}
