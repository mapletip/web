import { SimpleGrid, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { Fragment, type ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';
import { canonicalBuildParam } from '@/features/detail';

import { ITEM_KINDS } from '../kinds';
import type { ItemKind } from '../kinds/types';

import { itemCardColumns, renderItemCard } from './item-card';
import classes from './ItemsGroupPage.module.css';
import { ITEM_GROUP_ROUTES, type ItemGroup } from './page';
import type { CategorizedItemRow } from './project';
import { itemBrowseSearch, ITEM_SORT_OPTIONS } from './search-params';

export interface GroupCategoryShelf {
  readonly kind: ItemKind;
  readonly totalCount: number;
  readonly previewRows: readonly CategorizedItemRow[];
}

interface ItemsGroupShelvesProps {
  readonly buildId: BuildId;
  readonly group: ItemGroup;
  readonly records: readonly CategorizedItemRow[];
  readonly selectedRecordId?: string | undefined;
  readonly openDetails: (recordId: string) => void;
}

const numberFormat = new Intl.NumberFormat('en-US');
const collator = new Intl.Collator('en-US', {
  numeric: true,
  sensitivity: 'base',
});

function sortKeyString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function sortByDefaultOrder(
  rows: readonly CategorizedItemRow[],
): readonly CategorizedItemRow[] {
  const defaultSort =
    itemBrowseSearch.defaultState.sort ?? ITEM_SORT_OPTIONS[0];
  const direction = defaultSort.direction === 'desc' ? -1 : 1;
  const field = defaultSort.field as keyof CategorizedItemRow;
  return [...rows].sort(
    (left, right) =>
      collator.compare(
        sortKeyString(left[field]),
        sortKeyString(right[field]),
      ) * direction,
  );
}

/** Build one preview shelf per non-empty category of the group in rail order. */
export function buildGroupShelves({
  group,
  rows,
}: {
  readonly group: ItemGroup;
  readonly rows: readonly CategorizedItemRow[];
}): readonly GroupCategoryShelf[] {
  const rowsByKind = new Map<string, CategorizedItemRow[]>();
  for (const row of rows) {
    if (row.kindPath[1] !== group) continue;
    const bucket = rowsByKind.get(row.kind);
    if (bucket === undefined) rowsByKind.set(row.kind, [row]);
    else bucket.push(row);
  }

  const shelves: GroupCategoryShelf[] = [];
  for (const kind of ITEM_KINDS) {
    if (kind.group !== group) continue;
    const kindRows = rowsByKind.get(kind.id);
    if (kindRows === undefined || kindRows.length === 0) continue;
    shelves.push({
      kind,
      totalCount: kindRows.length,
      previewRows: sortByDefaultOrder(kindRows).slice(
        0,
        itemCardColumns({ kind }).lg,
      ),
    });
  }
  return shelves;
}

/** Category shelves rendered in the shared FacetedBrowser results area. */
export function ItemsGroupShelves({
  buildId,
  group,
  records,
  selectedRecordId,
  openDetails,
}: ItemsGroupShelvesProps): ReactElement {
  const shelves = buildGroupShelves({ group, rows: records });
  return (
    <div className={classes['shelves']}>
      {shelves.map((shelf) => {
        const headingId = `items-shelf-${shelf.kind.id}`;
        const formattedCount = numberFormat.format(shelf.totalCount);
        return (
          <section
            key={shelf.kind.id}
            className={classes['shelf']}
            aria-labelledby={headingId}
          >
            <div className={classes['shelfHeader']}>
              <Title
                order={2}
                size="h3"
                id={headingId}
                className={classes['shelfTitle']}
              >
                {shelf.kind.label}
              </Title>
              <Link
                to={ITEM_GROUP_ROUTES[group]}
                params={{
                  buildId: canonicalBuildParam(buildId),
                  kind: shelf.kind.slug,
                }}
                search={itemBrowseSearch.defaultSearch}
                className={classes['seeAllLink']}
                aria-label={`See all ${formattedCount} ${shelf.kind.label}`}
              >
                See all {formattedCount}
              </Link>
            </div>
            <SimpleGrid
              cols={itemCardColumns({ kind: shelf.kind })}
              spacing="sm"
              className={classes['shelfGrid']}
            >
              {shelf.previewRows.map((row) => (
                <Fragment key={row.sourceId}>
                  {renderItemCard({
                    record: row,
                    openDetails: () => openDetails(row.sourceId),
                    isDetailsOpen: selectedRecordId === row.sourceId,
                  })}
                </Fragment>
              ))}
            </SimpleGrid>
          </section>
        );
      })}
    </div>
  );
}
