import { SimpleGrid, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { Fragment, useMemo, type ReactElement } from 'react';

import type { BuildId } from '@/config/maplekit';
import { canonicalBuildParam } from '@/features/detail';

import { ITEM_KINDS } from '../kinds';
import { kindSortValue } from '../kinds/sort-value';
import type { ItemKind, ItemCardContext } from '../kinds/types';

import { isPictureLayout, itemCardColumns, renderItemCard } from './item-card';
import classes from './ItemsGroupPage.module.css';
import { numberFormat } from './number-format';
import { ITEM_GROUP_ROUTES, type ItemGroup } from './page';
import type { CategorizedItemRow } from './project';
import { itemBrowseSearch } from './search-params';

interface GroupCategoryShelf {
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
  readonly context: ItemCardContext;
}

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
  kind: ItemKind,
): readonly CategorizedItemRow[] {
  const defaultSort = kind.card?.defaultSort ?? {
    field: 'name',
    direction: 'asc',
  };
  const direction = defaultSort.direction === 'desc' ? -1 : 1;
  const value = kindSortValue({ kind, field: defaultSort.field });
  return [...rows].sort((left, right) => {
    const leftValue = value(left);
    const rightValue = value(right);
    const order =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : collator.compare(sortKeyString(leftValue), sortKeyString(rightValue));
    return order * direction;
  });
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
      previewRows: sortByDefaultOrder(
        [...kindRows].sort((left, right) =>
          collator.compare(left.name, right.name),
        ),
        kind,
      ).slice(0, itemCardColumns({ kind }).lg),
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
  context,
}: ItemsGroupShelvesProps): ReactElement {
  const shelves = useMemo(
    () => buildGroupShelves({ group, rows: records }),
    [group, records],
  );
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
              data-card-columns={
                isPictureLayout(shelf.kind) ? 'picture' : 'aside'
              }
            >
              {shelf.previewRows.map((row) => (
                <Fragment key={row.sourceId}>
                  {renderItemCard({
                    record: row,
                    context,
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
