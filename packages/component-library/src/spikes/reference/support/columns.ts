import type { SampleMonsterNumericField, SampleSortField } from './fixtures';

/**
 * Column metadata shared by the reference implementation. Domain-owned and
 * engine-neutral: each candidate maps it onto its own column API.
 */
export interface SampleColumnMeta {
  readonly id: SampleSortField;
  /** Visible header text. */
  readonly header: string;
  /** Full name, used for the header tooltip and column menu. */
  readonly label: string;
  readonly width: number;
  readonly numeric: boolean;
  /** First click sorts descending (stats) or ascending (name, level). */
  readonly descFirst: boolean;
}

export const identityColumn: SampleColumnMeta = {
  id: 'name',
  header: 'Monster',
  label: 'Monster',
  width: 240,
  numeric: false,
  descFirst: false,
};

const stat = (
  id: SampleMonsterNumericField,
  header: string,
  label: string,
  extra: Partial<SampleColumnMeta> = {},
): SampleColumnMeta => ({
  id,
  header,
  label,
  width: 84,
  numeric: true,
  descFirst: true,
  ...extra,
});

export const statColumns: readonly SampleColumnMeta[] = [
  stat('level', 'Lv', 'Level', { descFirst: false }),
  stat('hp', 'HP', 'HP'),
  stat('exp', 'EXP', 'EXP'),
  stat('expPer100Hp', 'EXP/100 HP', 'EXP per 100 HP', { width: 104 }),
  stat('weaponAttack', 'W.ATT', 'Weapon attack'),
  stat('magicAttack', 'M.ATT', 'Magic attack'),
  stat('weaponDefense', 'W.DEF', 'Weapon defense'),
  stat('magicDefense', 'M.DEF', 'Magic defense'),
  stat('accuracy', 'ACC', 'Accuracy'),
  stat('avoidability', 'AVOID', 'Avoidability'),
];

export const allColumns: readonly SampleColumnMeta[] = [
  identityColumn,
  ...statColumns,
];

export const totalWidth = (columns: readonly SampleColumnMeta[]): number =>
  columns.reduce((sum, column) => sum + column.width, 0);
