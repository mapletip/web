import {
  Accordion,
  Button,
  Checkbox,
  NumberInput,
  Pagination,
  Text,
  Title,
} from '@mantine/core';
import { DataTable, type DataTableColumn } from 'mantine-datatable';
import { useId, useMemo, useState, type ReactElement } from 'react';

import 'mantine-datatable/styles.css';

import {
  comparisonTableClasses,
  comparisonTableMaxHeight,
} from '../comparison-table';
import { ComparisonSortHeader } from '../ComparisonSortHeader';
import { FacetedBrowser } from '../FacetedBrowser';
import { FacetedBrowserFilterDrawer } from '../FacetedBrowserFilterDrawer';

import { Identity, StatValue, valueOf } from './cells';
import { allColumns, type SampleColumnMeta } from './columns';
import {
  createSampleMonsters,
  sortSampleMonsters,
  type SampleMonster,
  type SampleSort,
} from './fixtures';

const records = createSampleMonsters(100);

export function MonsterPage({
  onApplyCommit,
}: {
  readonly onApplyCommit?: (draft: {
    min: number | '';
    max: number | '';
  }) => void;
}): ReactElement {
  const headingId = useId();
  const [sort, setSort] = useState<SampleSort>({
    field: 'exp',
    direction: 'desc',
  });
  const [committed, setCommitted] = useState({
    min: '' as number | '',
    max: '' as number | '',
  });
  const [draft, setDraft] = useState(committed);
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      sortSampleMonsters(
        records.filter(
          (r) =>
            (committed.min === '' || r.level >= committed.min) &&
            (committed.max === '' || r.level <= committed.max),
        ),
        sort,
      ),
    [committed, sort],
  );
  const invalid = draft.min !== '' && draft.max !== '' && draft.min > draft.max;

  const columns: DataTableColumn<SampleMonster>[] = allColumns.map(
    (c: SampleColumnMeta) => {
      const current = sort.field === c.id ? sort.direction : null;
      const next = current
        ? current === 'asc'
          ? 'desc'
          : 'asc'
        : c.descFirst
          ? 'desc'
          : 'asc';
      return {
        accessor: c.id,
        width: c.width,
        textAlign: c.numeric ? 'right' : 'left',
        title: (
          <ComparisonSortHeader
            label={c.header}
            {...(c.label !== c.header ? { fullLabel: c.label } : {})}
            {...(current
              ? {
                  direction:
                    current === 'asc'
                      ? ('ascending' as const)
                      : ('descending' as const),
                }
              : {})}
            align={c.numeric ? 'end' : 'start'}
            onSort={() => setSort({ field: c.id, direction: next })}
          />
        ),
        titleClassName: comparisonTableClasses.headerCell,
        ...(c.numeric
          ? {
              cellsClassName: `${comparisonTableClasses.numericCell} ${current ? comparisonTableClasses.sortedCell : ''}`,
            }
          : {}),
        render: (r: SampleMonster) =>
          c.numeric ? (
            <StatValue value={valueOf(r, c.id)} />
          ) : (
            <Identity record={r} />
          ),
      };
    },
  );

  const openDrawer = (target: string | null) => {
    setDraft(committed);
    setSection(target);
    setOpen(true);
  };

  return (
    <>
      <FacetedBrowser
        title={
          <Title order={1} id={headingId}>
            {`Monsters, sorted by ${sort.field} ${sort.direction === 'asc' ? 'ascending' : 'descending'}`}
          </Title>
        }
        rail={<Checkbox label="Level 1–60" />}
        railLabel="Monster filters"
        quickFacets={
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            <Button variant="default" onClick={() => openDrawer(null)}>
              Filters
            </Button>
            <Button
              variant="default"
              aria-label="Level. Open Level filters"
              onClick={() => openDrawer('level')}
            >
              Level
            </Button>
          </div>
        }
        summary={
          <Text size="sm" aria-live="polite">
            {`1–${rows.length} of ${rows.length} monsters`}
          </Text>
        }
        resultsLabel="Monster results"
        table={
          <DataTable<SampleMonster>
            records={rows}
            idAccessor="id"
            aria-labelledby={headingId}
            columns={columns}
            pinFirstColumn
            highlightOnHover
            withTableBorder
            withColumnBorders={false}
            horizontalSpacing={10}
            verticalSpacing={6}
            maxHeight={comparisonTableMaxHeight}
            classNames={{ table: comparisonTableClasses.table }}
          />
        }
        cards={
          <ul aria-label="Monster cards">
            {rows.map((r) => (
              <li key={r.id}>
                <a href={r.href}>{r.name}</a>
                <span> Lv {r.level}</span>
              </li>
            ))}
          </ul>
        }
        pagination={
          <Pagination
            total={13}
            value={1}
            getItemProps={(page) => ({ component: 'a', href: `?page=${page}` })}
            aria-label="Monster result pages"
          />
        }
      />
      <FacetedBrowserFilterDrawer
        opened={open}
        title="Filter monsters"
        applyLabel="Show results"
        applyDisabled={invalid}
        onApply={() => {
          setCommitted(draft);
          onApplyCommit?.(draft);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
        onReset={() => setDraft({ min: '', max: '' })}
      >
        <Accordion value={section} onChange={setSection}>
          <Accordion.Item value="level">
            <Accordion.Control data-autofocus>Level</Accordion.Control>
            <Accordion.Panel>
              <NumberInput
                label="Minimum level"
                value={draft.min}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, min: v === '' ? '' : Number(v) }))
                }
                {...(invalid
                  ? { error: 'Minimum must not exceed maximum' }
                  : {})}
              />
              <NumberInput
                label="Maximum level"
                value={draft.max}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, max: v === '' ? '' : Number(v) }))
                }
              />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </FacetedBrowserFilterDrawer>
    </>
  );
}
