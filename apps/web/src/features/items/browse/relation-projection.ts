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

interface ProjectedItemData {
  readonly relations: ProjectedRelations;
  readonly descriptions?: Readonly<Record<string, string>>;
}

export function projectItemDescriptions({
  descriptions,
  items,
}: {
  readonly descriptions: Readonly<Record<string, string>>;
  readonly items: readonly {
    readonly key: string;
    readonly sourceId: string;
  }[];
}): Readonly<Record<string, string>> {
  return Object.fromEntries(
    items.flatMap(({ key, sourceId }) => {
      const description = descriptions[key]?.trim();
      return description ? [[sourceId, description]] : [];
    }),
  );
}

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
  items,
}: {
  readonly pack: ItemDrawerPack<ProjectedRelationKind>;
  readonly items: readonly {
    readonly key: string;
    readonly sourceId: string;
  }[];
}): ProjectedRelation {
  const referencesByItem = new Map<string, readonly number[]>();
  const unestablished: string[] = [];
  for (const { key, sourceId } of items) {
    let references: readonly number[];
    if (pack.relationshipKind === 'needed-for-quest') {
      const edges = pack.records[key] ?? [];
      references = edges.flatMap((edge) =>
        edge.roles.some(({ role }) => REQUIRED_QUEST_ROLES.has(role))
          ? [edge.target]
          : [],
      );
      if (edges.length > 0 && references.length === 0) {
        unestablished.push(sourceId);
      }
    } else {
      references = (pack.records[key] ?? []).map((edge) => edge.target);
    }
    if (references.length > 0) referencesByItem.set(sourceId, references);
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
  for (const [sourceId, references] of referencesByItem) {
    const indices = [
      ...new Set(
        references.flatMap((reference) => {
          const index = byOriginalIndex.get(reference);
          return index === undefined ? [] : [index];
        }),
      ),
    ];
    if (indices.length > 0) byItem[sourceId] = indices;
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
export async function loadProjectedItemData({
  buildId,
  kind,
  rows,
  coverage,
  relationKinds = kind?.relations ?? [],
}: {
  readonly buildId: BuildId;
  /** Omit to project every browse row, as for cross-category pages. */
  readonly kind?: ItemKind | undefined;
  readonly rows: readonly CategorizedItemRow[];
  readonly coverage: ItemBrowseCoverage;
  /** Defaults to every relationship the category lists. */
  readonly relationKinds?: readonly ProjectedRelationKind[];
}): Promise<ProjectedItemData> {
  const reader = createItemRelationReader(buildId);
  const items = rows
    .filter((row) => kind === undefined || row.kind === kind.id)
    .map(({ key, sourceId }) => ({ key, sourceId }));
  const wanted = relationKinds.filter((relationKind) =>
    canReadItemRelation({ kind: relationKind, coverage }),
  );
  const loadedRelations = Promise.all(
    wanted.map(async (relationKind) => {
      try {
        const pack = await withLoadBoundary({
          failureMessage: 'Item relationships could not be loaded.',
          logMessage: 'Items Browse relationship load failed.',
          load: () => reader.readRelation(relationKind),
        });
        return [relationKind, projectItemRelation({ pack, items })] as const;
      } catch (error) {
        if (isAbortError(error)) throw error;
        return undefined;
      }
    }),
  );
  const loadedDescriptions: Promise<
    Readonly<Record<string, string>> | undefined
  > =
    kind?.descriptions !== true || items.length === 0
      ? Promise.resolve(undefined)
      : (async () => {
          try {
            return await withLoadBoundary({
              failureMessage: 'Item descriptions could not be loaded.',
              logMessage: 'Items Browse description load failed.',
              load: () => reader.readDescriptions(),
            });
          } catch (error) {
            if (isAbortError(error)) throw error;
            return undefined;
          }
        })();
  const [relations, descriptions] = await Promise.all([
    loadedRelations,
    loadedDescriptions,
  ]);
  return {
    relations: Object.fromEntries(
      relations.filter((entry) => entry !== undefined),
    ),
    ...(descriptions === undefined
      ? {}
      : { descriptions: projectItemDescriptions({ descriptions, items }) }),
  };
}

/** Load only the relationship projections used by landing-page lookups. */
export async function loadProjectedRelations(
  options: Parameters<typeof loadProjectedItemData>[0],
): Promise<ProjectedRelations> {
  return (await loadProjectedItemData(options)).relations;
}
