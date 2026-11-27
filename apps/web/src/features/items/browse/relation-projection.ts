import type { ItemBrowseCoverage } from '@mapletip/data/items';

import type { BuildId } from '@/config/maplekit';
import { isAbortError, withLoadBoundary } from '@/features/detail/load-error';

import type { ItemKind } from '../kinds/types';

import type { CategorizedItemRow } from './project';
import {
  createItemRelationReader,
  REQUIRED_QUEST_ROLES,
  type ItemDrawerPack,
} from './relations';

export type ProjectedRelationKind =
  'needed-for-quest' | 'monster-drop' | 'used-in-recipe';

export interface ProjectedRelation {
  /** Quest and monster targets carry the public id their filters use; recipes need only names. */
  readonly targets: readonly {
    readonly publicId?: string;
    readonly name: string;
  }[];
  readonly byItem: Readonly<Record<string, readonly number[]>>;
  /**
   * Quest requirements only: the given items whose quest links all lack an
   * established role, so cards show neither a quest row nor "Not required".
   */
  readonly unestablished?: readonly string[];
}

export type ProjectedRelations = Partial<
  Record<ProjectedRelationKind, ProjectedRelation>
>;

function targetName(
  pack: ItemDrawerPack<ProjectedRelationKind>,
  index: number,
): { readonly publicId?: string; readonly name: string } | undefined {
  if (pack.relationshipKind === 'used-in-recipe') {
    const recipe = pack.targets[index];
    const name = recipe?.products
      .flatMap((product) =>
        product.name.state === 'known' ? [product.name.value.trim()] : [],
      )
      .filter(Boolean)
      .join(', ');
    return name ? { name } : undefined;
  }
  const target = pack.targets[index];
  const name = target?.displayName?.trim();
  return target !== undefined && name
    ? { publicId: target.publicId, name }
    : undefined;
}

/**
 * Keep only the named targets the given items refer to, and those items' references;
 * detail facts stay in the drawer. Limiting to the category's items keeps the page
 * from carrying every quest, recipe or monster name in the build.
 */
export function projectItemRelation({
  pack,
  itemKeys,
}: {
  readonly pack: ItemDrawerPack<ProjectedRelationKind>;
  readonly itemKeys: ReadonlySet<string>;
}): ProjectedRelation {
  const referencesByItem = new Map<string, readonly number[]>();
  const unestablished: string[] = [];
  for (const itemKey of itemKeys) {
    let references: readonly number[];
    if (pack.relationshipKind === 'needed-for-quest') {
      const edges = pack.records[itemKey] ?? [];
      references = edges.flatMap((edge) =>
        edge.roles.some(({ role }) => REQUIRED_QUEST_ROLES.has(role))
          ? [edge.target]
          : [],
      );
      if (edges.length > 0 && references.length === 0) {
        unestablished.push(itemKey);
      }
    } else {
      references = (pack.records[itemKey] ?? []).map((edge) => edge.target);
    }
    if (references.length > 0) referencesByItem.set(itemKey, references);
  }

  const referenced = new Set([...referencesByItem.values()].flat());
  const targets = [...referenced].flatMap((originalIndex) => {
    const target = targetName(pack, originalIndex);
    return target === undefined ? [] : [{ ...target, originalIndex }];
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
    targets: targets.map(({ publicId, name }) =>
      publicId === undefined ? { name } : { publicId, name },
    ),
    byItem,
    ...(pack.relationshipKind === 'needed-for-quest' ? { unestablished } : {}),
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
 * build does not publish; a failed read only removes
 * names and filters, since counts always come from the browse rows.
 */
export async function loadProjectedRelations({
  buildId,
  kind,
  rows,
  coverage,
  relationKinds = kind.relations ?? [],
}: {
  readonly buildId: BuildId;
  readonly kind: ItemKind;
  readonly rows: readonly CategorizedItemRow[];
  readonly coverage: ItemBrowseCoverage;
  /** Defaults to every relationship the category lists. */
  readonly relationKinds?: readonly ProjectedRelationKind[];
}): Promise<ProjectedRelations> {
  const reader = createItemRelationReader(buildId);
  const categoryRows = rows.filter((row) => row.kind === kind.id);
  const itemKeys = new Set(categoryRows.map((row) => row.key));
  const wanted = relationKinds.filter((relationKind) =>
    canReadItemRelation({ kind: relationKind, coverage }),
  );
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
