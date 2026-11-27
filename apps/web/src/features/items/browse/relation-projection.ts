import type { ItemBrowseCoverage } from '@mapletip/data/items';

import type { BuildId } from '@/config/maplekit';
import { isAbortError, withLoadBoundary } from '@/features/detail/load-error';

import type { ItemKind } from '../kinds/types';

import { RELATIONSHIP_COUNT_FIELDS, type CategorizedItemRow } from './project';
import {
  createItemRelationReader,
  REQUIRED_QUEST_ROLES,
  type ItemDrawerPack,
} from './relations';

export type ProjectedRelationKind = 'needed-for-quest' | 'monster-drop';

export interface ProjectedRelation {
  readonly targets: readonly {
    readonly publicId: string;
    readonly name: string;
  }[];
  readonly byItem: Readonly<Record<string, readonly number[]>>;
}

export type ProjectedRelations = Partial<
  Record<ProjectedRelationKind, ProjectedRelation>
>;

/**
 * Keep only the named targets the given items refer to, and those items' references;
 * detail facts stay in the drawer. Limiting to the category's items keeps the page
 * from carrying every quest or monster name in the build.
 */
export function projectItemRelation({
  pack,
  itemKeys,
}: {
  readonly pack: ItemDrawerPack<ProjectedRelationKind>;
  readonly itemKeys: ReadonlySet<string>;
}): ProjectedRelation {
  const referencesByItem = new Map<string, readonly number[]>();
  for (const itemKey of itemKeys) {
    const references =
      pack.relationshipKind === 'needed-for-quest'
        ? (pack.records[itemKey] ?? []).flatMap((edge) =>
            edge.roles.some(({ role }) => REQUIRED_QUEST_ROLES.has(role))
              ? [edge.target]
              : [],
          )
        : (pack.records[itemKey] ?? []).map((edge) => edge.target);
    if (references.length > 0) referencesByItem.set(itemKey, references);
  }

  const referenced = new Set([...referencesByItem.values()].flat());
  const targets = [...referenced].flatMap((originalIndex) => {
    const target = pack.targets[originalIndex];
    const name = target?.displayName?.trim();
    return target !== undefined && name
      ? [{ publicId: target.publicId, name, originalIndex }]
      : [];
  });
  targets.sort((left, right) => left.name.localeCompare(right.name, 'en-US'));
  const byOriginalIndex = new Map(
    targets.map((target, index) => [target.originalIndex, index]),
  );

  const byItem: Record<string, readonly number[]> = {};
  for (const [itemKey, references] of referencesByItem) {
    const indices = [
      ...new Set(
        references.flatMap((reference) => {
          const index = byOriginalIndex.get(reference);
          return index === undefined ? [] : [index];
        }),
      ),
    ];
    if (indices.length > 0) byItem[itemKey] = indices;
  }
  return {
    targets: targets.map(({ publicId, name }) => ({ publicId, name })),
    byItem,
  };
}

export function canReadItemRelation({
  kind,
  coverage,
}: {
  readonly kind: ProjectedRelationKind;
  readonly coverage: ItemBrowseCoverage;
}): boolean {
  return coverage.relationships[kind] !== 'unsupported';
}

/**
 * Read and project the rosters a category lists (design D7). Skips relationships the
 * build does not publish or no item of the category has; a failed read only removes
 * names and filters, since counts always come from the browse rows.
 */
export async function loadProjectedRelations({
  buildId,
  kind,
  rows,
  coverage,
}: {
  readonly buildId: BuildId;
  readonly kind: ItemKind;
  readonly rows: readonly CategorizedItemRow[];
  readonly coverage: ItemBrowseCoverage;
}): Promise<ProjectedRelations> {
  const reader = createItemRelationReader(buildId);
  const categoryRows = rows.filter((row) => row.kind === kind.id);
  const itemKeys = new Set(categoryRows.map((row) => row.key));
  const wanted = (kind.relations ?? []).filter((relationKind) => {
    if (!canReadItemRelation({ kind: relationKind, coverage })) return false;
    const countField = RELATIONSHIP_COUNT_FIELDS.find(
      ([name]) => name === relationKind,
    )?.[1];
    return (
      countField !== undefined &&
      categoryRows.some((row) => (Number(row[countField]) || 0) > 0)
    );
  });
  const loaded = await Promise.all(
    wanted.map(async (relationKind) => {
      try {
        const pack = await withLoadBoundary({
          failureMessage: 'Item relationships could not be loaded.',
          logMessage: 'Items Browse relationship load failed.',
          load: () => reader.readRelation(relationKind),
        });
        return [relationKind, projectItemRelation({ pack, itemKeys })] as const;
      } catch (error) {
        if (isAbortError(error)) throw error;
        return undefined;
      }
    }),
  );
  return Object.fromEntries(loaded.filter((entry) => entry !== undefined));
}
