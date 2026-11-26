import { Title } from '@mantine/core';
import { FacetedBrowser, Thumbnail } from '@mapletip/component-library';
import type {
  BrowseState,
  DrawerOpenedChangeDetails,
  FacetDefinition,
  QueryFieldDefinition,
  StateChangeDetails,
  TableColumn,
} from '@mapletip/component-library';
import { useCallback, useMemo, useState, type ReactElement } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { AnchorLink } from '@/components/RouterLinks';
import { BUILDS, type BuildId } from '@/config/maplekit';
import { browseOverlayOptions } from '@/features/browse-overlay/browseOverlay';
import {
  monsterDetailLinkProps,
  MONSTER_STAT_BY_ID,
} from '@/features/monsters/shared';
import type { MonsterDetailStatId } from '@/features/monsters/shared';
import { useRouteOverlay } from '@/features/route-overlay/useRouteOverlay';

import { createMonsterLocationReader } from '../locations';
import {
  getMonsterBrowseFacetDefinition,
  MONSTER_BROWSE_FACT_CONFIG,
} from '../monster-browse-fact-config';
import classes from '../MonsterBrowse.module.css';
import {
  MonsterBrowseActions,
  type MonsterBrowseRelation,
} from '../MonsterBrowseActions';
import { MonsterBrowseCard } from '../MonsterBrowseCard';
import { MonsterBrowseDrawerTitle } from '../MonsterBrowseDrawerTitle';
import { MonsterDropListing } from '../MonsterDrops';
import { MonsterLocationListing } from '../MonsterLocationListing';
import { MONSTER_SPRITE_SIZE, MonsterSprite } from '../MonsterSprite';
import {
  formatMonsterFact,
  type MonsterDropItemOption,
  type MonsterBrowseRow,
  type MonsterFactId,
} from '../project';

export interface MonsterBrowseProps {
  readonly buildId: BuildId;
  readonly rows: readonly MonsterBrowseRow[];
  readonly dropItemOptions: readonly MonsterDropItemOption[];
}

interface StatColumnOptions {
  /** Spoken expansion when the visible title is abbreviated. */
  readonly fullLabel?: string;
  readonly firstSortDirection?: 'asc' | 'desc';
  /** Keep the header on one line for two-word or slash titles. */
  readonly nowrap?: boolean;
}

function statColumn(
  accessor: MonsterFactId,
  title: string,
  {
    fullLabel,
    firstSortDirection = 'desc',
    nowrap = false,
  }: StatColumnOptions = {},
): TableColumn<MonsterBrowseRow> {
  return {
    accessor,
    title,
    ...(fullLabel === undefined ? {} : { fullLabel }),
    ...(nowrap ? { nowrap: true } : {}),
    sortable: true,
    firstSortDirection,
    numeric: true,
    render: (record) => formatMonsterFact(record, accessor),
  };
}

function monsterStatColumn(
  id: MonsterDetailStatId,
  options?: StatColumnOptions,
): TableColumn<MonsterBrowseRow> {
  const { label, browseLabel } = MONSTER_STAT_BY_ID[id];
  return statColumn(id, browseLabel, {
    ...(label === browseLabel ? {} : { fullLabel: label }),
    ...options,
  });
}

// Column headers use MapleTip's compact browse vocabulary (`W. ATT`) so the
// comparison table fits without horizontal noise; the full stat name stays as
// the spoken expansion.
//
// Exported for the feature's own unit tests (column metadata is data), never
// through the public barrel.
const identityCellClassName = classes['identityCell'];

export function createMonsterBrowseColumns(
  buildId: BuildId,
): readonly TableColumn<MonsterBrowseRow>[] {
  return [
    {
      accessor: 'name',
      title: 'Name',
      sortable: true,
      firstSortDirection: 'asc',
      ...(identityCellClassName !== undefined
        ? { cellClassName: identityCellClassName }
        : {}),
      render: (record) => {
        const linkProps = monsterDetailLinkProps(record, buildId);
        return (
          <div
            className={classes['identity']}
            style={{ paddingInlineStart: MONSTER_NAME_INDENT }}
          >
            <MonsterSprite sprite={record.sprite} />
            {linkProps === undefined ? (
              <span className={classes['identityName']}>{record.name}</span>
            ) : (
              <AnchorLink className={classes['identityName']} {...linkProps}>
                {record.name}
              </AnchorLink>
            )}
          </div>
        );
      },
    },
    monsterStatColumn('level', { firstSortDirection: 'asc' }),
    monsterStatColumn('hp'),
    monsterStatColumn('mp'),
    statColumn('hpRecovery', 'HP REC', { fullLabel: 'HP recovery value' }),
    statColumn('mpRecovery', 'MP REC', { fullLabel: 'MP recovery value' }),
    monsterStatColumn('exp'),
    statColumn('expPer100Hp', 'EXP / 100 HP', {
      fullLabel: 'Experience per 100 HP',
      nowrap: true,
    }),
    monsterStatColumn('physicalAttack'),
    monsterStatColumn('physicalDefense'),
    monsterStatColumn('magicAttack'),
    monsterStatColumn('magicDefense'),
    monsterStatColumn('accuracy'),
    monsterStatColumn('avoidability'),
    statColumn('pushed', 'KB', { fullLabel: 'Knockback damage threshold' }),
    monsterStatColumn('speed'),
  ];
}

/** The rail already names the build; the count only needs the short noun. */
const SUMMARY_NOUN = { one: 'Monster', other: 'Monsters' } as const;
const MONSTER_NAME_INDENT = `calc(${MONSTER_SPRITE_SIZE}px + var(--mantine-spacing-xs))`;

function dropItemFacet(
  options: readonly MonsterDropItemOption[],
  definition: FacetDefinition<MonsterBrowseRow>,
): FacetDefinition<MonsterBrowseRow> {
  return {
    ...definition,
    options: options.map(({ value, label, iconUrl }) => ({
      value,
      label,
      ...(iconUrl === undefined
        ? {}
        : { icon: <Thumbnail src={iconUrl} size={16} alt="" /> }),
    })),
    picker: {
      placeholder: 'Search dropped items',
      nothingFound: 'No dropped items match',
    },
  };
}

const defaultState: BrowseState = {
  search: '',
  filters: {},
  sort: { field: 'level', direction: 'asc' },
  page: 1,
  pageSize: 25,
  hiddenColumns: [],
};

export function MonsterBrowse({
  buildId,
  rows,
  dropItemOptions,
}: MonsterBrowseProps): ReactElement {
  const columns = useMemo(() => createMonsterBrowseColumns(buildId), [buildId]);
  const [browseState, setBrowseState] = useState<BrowseState>(defaultState);
  const browseOverlay = useRouteOverlay(browseOverlayOptions);
  const filterDrawerOpened = browseOverlay.overlay?.type === 'filters';
  const [locationReader] = useState(() => createMonsterLocationReader(buildId));
  const details =
    browseOverlay.overlay?.type === 'record-details'
      ? browseOverlay.overlay
      : undefined;
  const drawerRelation = details?.relation ?? 'drops';
  function openDetails(
    record: MonsterBrowseRow,
    relation: MonsterBrowseRelation,
  ) {
    browseOverlay.open({
      type: 'record-details',
      recordId: record.key,
      ...(relation === 'locations' ? { relation } : {}),
    });
  }
  const onFilterDrawerOpenedChange = useCallback(
    (opened: boolean, details?: DrawerOpenedChangeDetails) => {
      if (opened) {
        browseOverlay.open({ type: 'filters' });
        return;
      }
      if (details?.reason === 'invalidate') {
        void browseOverlay.invalidate('filters');
        return;
      }
      if (details?.reason === 'apply') {
        return;
      }
      browseOverlay.dismiss('filters');
    },
    [browseOverlay],
  );

  const onStateChange = useCallback(
    (nextState: BrowseState, details?: StateChangeDetails) => {
      if (details?.reason === 'apply') {
        void browseOverlay.apply('filters', () => setBrowseState(nextState));
        return;
      }
      setBrowseState(nextState);
    },
    [browseOverlay],
  );

  const label = BUILDS[buildId].label;
  const queryFields: readonly QueryFieldDefinition<MonsterBrowseRow>[] = [
    // Boolean facets remain registered as query fields even though their
    // comparison-table columns are intentionally omitted.
    'boss',
    'undead',
    {
      id: 'dropItemKeys',
      accessor: (record) => record.drops.itemKeys,
      sortable: false,
    },
  ];
  const browseFacets = Object.values(MONSTER_BROWSE_FACT_CONFIG).flatMap(
    (fact) => {
      const definition = getMonsterBrowseFacetDefinition(fact);
      if (definition === undefined) return [];
      return definition.id === 'drops-item'
        ? [dropItemFacet(dropItemOptions, definition)]
        : [definition];
    },
  );

  return (
    <BrowsePageShell>
      <FacetedBrowser
        title={<Title order={1}>{`MapleStory ${label} Monsters`}</Title>}
        records={rows}
        idAccessor="key"
        identityField="name"
        columns={columns}
        queryFields={queryFields}
        searchFields={['name']}
        facets={browseFacets}
        filterDrawerApplyLabel="Apply"
        recordNoun={`${label} monsters`}
        summaryMode="total"
        summaryNoun={SUMMARY_NOUN}
        pageSizeOptions={[25, 50, 100]}
        presentation="comparison"
        tableVerticalSpacing={4}
        // No `tableMaxHeight`: the table fills the height this page hands it, so its own
        // scroll region is the page's vertical scroll region on desktop.
        fillHeight
        tableStorageKey={`mapletip:web:monsters:${buildId}:v1`}
        renderCard={(record, { isDetailsOpen }) => (
          <MonsterBrowseCard
            record={record}
            buildId={buildId}
            onActivate={(relation) => openDetails(record, relation)}
            activeRelation={isDetailsOpen === true ? drawerRelation : undefined}
          />
        )}
        rowExpansionContent={(record, { onClose }) => (
          <MonsterDropListing record={record} onClose={onClose} />
        )}
        recordDetailsContent={(record, { onClose, surface }) =>
          drawerRelation === 'locations' ? (
            <MonsterLocationListing
              key={record.key}
              record={record}
              buildId={buildId}
              reader={locationReader}
            />
          ) : (
            <MonsterDropListing
              record={record}
              onClose={onClose}
              surface={surface}
            />
          )
        }
        recordDetailsSideOnDesktop
        recordDetailsBottomSize={
          drawerRelation === 'locations' ? '80dvh' : undefined
        }
        recordDetailsTitle={(record) => (
          <MonsterBrowseDrawerTitle record={record} relation={drawerRelation} />
        )}
        recordDetails={{
          selectedId: details?.recordId ?? null,
          onSelectedIdChange: (_selectedId, reason) => {
            if (reason === 'invalidate') {
              void browseOverlay.invalidate('record-details');
            } else if (reason === 'dismiss') {
              browseOverlay.dismiss('record-details');
            }
          },
        }}
        rowExpansionControl={({ record, controlsId, expanded, onToggle }) => (
          <div style={{ paddingInlineStart: MONSTER_NAME_INDENT }}>
            <MonsterBrowseActions
              record={record}
              activeRelation={
                details?.recordId === record.key &&
                drawerRelation === 'locations'
                  ? 'locations'
                  : undefined
              }
              controlsId={controlsId}
              inlineDropsExpanded={expanded}
              onActivate={(relation) => {
                if (relation === 'drops') {
                  onToggle();
                } else {
                  openDetails(record, relation);
                }
              }}
            />
          </div>
        )}
        state={browseState}
        onStateChange={onStateChange}
        drawerOpened={filterDrawerOpened}
        onDrawerOpenedChange={onFilterDrawerOpenedChange}
      />
    </BrowsePageShell>
  );
}
