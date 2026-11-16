/**
 * Monster drop categories shared by Browse and Detail.
 *
 * Browse keeps its established labels; Detail uses the page-specific wording
 * from the Monster Detail contract.
 */
export const MONSTER_DROP_CATEGORIES = [
  {
    id: 'equipment',
    sourceValue: 'equipment',
    browseLabel: 'Equipment',
    detailLabel: 'Equipment',
  },
  {
    id: 'usable',
    sourceValue: 'consume',
    browseLabel: 'Use',
    detailLabel: 'Usable',
  },
  {
    id: 'etc',
    sourceValue: 'etc',
    browseLabel: 'ETC',
    detailLabel: 'ETC',
  },
  {
    id: 'setup',
    sourceValue: 'setup',
    browseLabel: 'Set-up',
    detailLabel: 'Setup',
  },
  {
    id: 'cash',
    sourceValue: 'cash',
    browseLabel: 'Cash Items',
    detailLabel: 'Cash',
  },
  {
    id: 'pets',
    sourceValue: 'pet',
    browseLabel: 'Pets',
    detailLabel: 'Pets',
  },
  {
    id: 'unknown',
    sourceValue: null,
    browseLabel: 'Other',
    detailLabel: 'Unknown type',
  },
] as const;

export type MonsterDropCategoryId =
  (typeof MONSTER_DROP_CATEGORIES)[number]['id'];
export type MonsterDropCategorySurface = 'browse' | 'detail';

export function getMonsterDropCategoryId(
  sourceValue: string | undefined,
): MonsterDropCategoryId {
  return (
    MONSTER_DROP_CATEGORIES.find(
      (category) => category.sourceValue === sourceValue,
    )?.id ?? 'unknown'
  );
}

export function getMonsterDropCategoryLabel(
  id: MonsterDropCategoryId,
  surface: MonsterDropCategorySurface,
): string {
  const category = MONSTER_DROP_CATEGORIES.find((entry) => entry.id === id);
  if (category === undefined) {
    return surface === 'browse' ? 'Other' : 'Unknown type';
  }
  return surface === 'browse' ? category.browseLabel : category.detailLabel;
}
