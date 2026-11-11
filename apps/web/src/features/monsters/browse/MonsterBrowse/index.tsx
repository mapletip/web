import { Button, MultiSelect, Text, Title } from '@mantine/core';
import { FacetedBrowser } from '@mapletip/component-library';
import type {
  BrowseState,
  FacetDefinition,
  QueryFieldDefinition,
  RowExpansionControlContext,
  TableColumn,
} from '@mapletip/component-library';
import type { ReactElement } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { BUILDS, type BuildId } from '@/config/maplekit';

import {
  getMonsterBrowseFacetDefinition,
  MONSTER_BROWSE_FACT_CONFIG,
  renderMonsterBrowseFactIcon,
} from '../monster-browse-fact-config';
import classes from '../MonsterBrowse.module.css';
import { MonsterBrowseCard } from '../MonsterBrowseCard';
import { dropListingActionLabel, MonsterDropListing } from '../MonsterDrops';
import dropClasses from '../MonsterDrops/MonsterDrops.module.css';
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

// Column headers use MapleTip's compact browse vocabulary (`W. ATT`) so the
// comparison table fits without horizontal noise; the full stat name stays as
// the spoken expansion. Plain text only: Monster detail routes do not exist
// yet, so names are not links.
//
// Exported for the feature's own unit tests (column metadata is data), never
// through the public barrel.
const identityCellClassName = classes['identityCell'];

export const monsterBrowseColumns: readonly TableColumn<MonsterBrowseRow>[] = [
  {
    accessor: 'name',
    title: 'Name',
    sortable: true,
    firstSortDirection: 'asc',
    ...(identityCellClassName !== undefined
      ? { cellClassName: identityCellClassName }
      : {}),
    render: (record) => (
      <div
        className={classes['identity']}
        style={{ paddingInlineStart: MONSTER_NAME_INDENT }}
      >
        <MonsterSprite sprite={record.sprite} />
        <span className={classes['identityName']}>{record.name}</span>
      </div>
    ),
  },
  statColumn('level', 'Level', { firstSortDirection: 'asc' }),
  statColumn('hp', 'HP'),
  statColumn('mp', 'MP'),
  statColumn('exp', 'EXP'),
  statColumn('expPer100Hp', 'EXP / 100 HP', {
    fullLabel: 'Experience per 100 HP',
    nowrap: true,
  }),
  statColumn('physicalAttack', 'W. ATT', { fullLabel: 'Weapon attack' }),
  statColumn('physicalDefense', 'W. DEF', { fullLabel: 'Weapon defense' }),
  statColumn('magicAttack', 'M. ATT', { fullLabel: 'Magic attack' }),
  statColumn('magicDefense', 'M. DEF', { fullLabel: 'Magic defense' }),
  statColumn('accuracy', 'ACC', { fullLabel: 'Accuracy' }),
  statColumn('avoidability', 'AVOID', { fullLabel: 'Avoidability' }),
  statColumn('pushed', 'KB', { fullLabel: 'Knockback damage threshold' }),
  statColumn('speed', 'Speed'),
];

/** The rail already names the build; the count only needs the short noun. */
const SUMMARY_NOUN = { one: 'Monster', other: 'Monsters' } as const;
const MONSTER_NAME_INDENT = `calc(${MONSTER_SPRITE_SIZE}px + var(--mantine-spacing-xs))`;

function dropExpansionControl({
  record,
  expanded,
  controlsId,
  onToggle,
}: RowExpansionControlContext<MonsterBrowseRow>): ReactElement {
  const label = dropListingActionLabel(record, expanded);
  return (
    <Button
      type="button"
      variant={expanded ? 'light' : 'default'}
      size="compact-sm"
      radius="sm"
      px={4}
      leftSection={renderMonsterBrowseFactIcon(
        MONSTER_BROWSE_FACT_CONFIG.dropsItem,
      )}
      classNames={{
        section: dropClasses['triggerSection'],
        label: dropClasses['triggerLabel'],
      }}
      aria-expanded={expanded}
      aria-controls={controlsId}
      aria-label={label}
      title={`${record.drops.entries.length.toLocaleString('en-US')} Drops`}
      style={{ marginInlineStart: MONSTER_NAME_INDENT }}
      onKeyDown={(event) => {
        if (!expanded || event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      {record.drops.entries.length.toLocaleString('en-US')}
    </Button>
  );
}

function dropItemFacet(
  options: readonly MonsterDropItemOption[],
  definition: FacetDefinition<MonsterBrowseRow>,
): FacetDefinition<MonsterBrowseRow> {
  return {
    ...definition,
    options,
    renderControl: ({ value, onChange }) => {
      const selected = Array.isArray(value)
        ? value.filter((entry): entry is string => typeof entry === 'string')
        : [];
      if (options.length === 0) {
        return <Text size="sm">No resolved item keys are available.</Text>;
      }
      return (
        <MultiSelect
          aria-label="Drops item"
          data={options}
          value={selected}
          onChange={(next) => onChange(next.length === 0 ? undefined : next)}
          searchable
          clearable
          hidePickedOptions
          limit={15}
          maxDropdownHeight={300}
          nothingFoundMessage="No dropped items match"
          placeholder="Search dropped items"
          size="sm"
        />
      );
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
        columns={monsterBrowseColumns}
        queryFields={queryFields}
        searchFields={['name']}
        facets={browseFacets}
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
        renderCard={(record) => (
          <MonsterBrowseCard record={record} buildId={buildId} />
        )}
        rowExpansionContent={(record, { onClose }) => (
          <MonsterDropListing
            record={record}
            buildId={buildId}
            onClose={onClose}
          />
        )}
        rowExpansionControl={(context) => dropExpansionControl(context)}
        defaultState={defaultState}
      />
    </BrowsePageShell>
  );
}
