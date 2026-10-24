import {
  Button,
  Checkbox,
  Code,
  Group,
  Pagination,
  Popover,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  useMemo,
  useState,
  type ComponentType,
  type ReactElement,
} from 'react';

import {
  createSpikeMonsters,
  sortSpikeMonsters,
  type SpikeMonsterNumericField,
  type SpikeSort,
} from '../ag-grid/fixtures';

import { statColumns } from './columns';
import { MonsterDataTable } from './MonsterDataTable';
import { MonsterMantineTable } from './MonsterMantineTable';
import { MonsterTanStackTable } from './MonsterTanStackTable';
import type { MonsterTableProps } from './types';

const records = createSpikeMonsters(100);

function query(sort: SpikeSort | null, page: number): string {
  const params = new URLSearchParams();
  if (sort) params.set('sort', `${sort.field}-${sort.direction}`);
  if (page > 1) params.set('page', String(page));
  const text = params.toString();
  return text ? `?${text}` : '?';
}

/**
 * Throwaway harness (same shape as the AG Grid spike's): sticky app header,
 * 240 px rail, column menu, URL state display, link pagination, trailing
 * content for page scrolling. Not a proposed layout component.
 */
function Page({
  Table,
  count = 100,
}: {
  readonly Table: ComponentType<MonsterTableProps>;
  readonly count?: number;
}): ReactElement {
  const [sort, setSort] = useState<SpikeSort | null>({
    field: 'exp',
    direction: 'desc',
  });
  const [page, setPage] = useState(1);
  const [hidden, setHidden] = useState<SpikeMonsterNumericField[]>([]);
  const rows = useMemo(
    () => sortSpikeMonsters(records.slice(0, count), sort),
    [count, sort],
  );
  const visible = statColumns
    .map((column) => column.id)
    .filter((id) => !hidden.includes(id as never));

  return (
    <div style={{ ['--spike-header-height' as string]: '56px' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          height: 56,
          paddingInline: 16,
          background: 'var(--mantine-color-body)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Text fw={700}>MapleTip spike</Text>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(0, 1fr)',
          gap: 16,
        }}
      >
        <aside
          aria-label="Monster filters"
          style={{
            padding: 12,
            borderRight: '1px solid var(--mantine-color-default-border)',
          }}
        >
          <Text size="xs" fw={650} tt="uppercase">
            Training
          </Text>
          <Checkbox mt="xs" label="Level 1–30" />
          <Checkbox mt="xs" label="Level 31–60" />
        </aside>
        <main style={{ minWidth: 0, paddingBlock: 12, paddingInlineEnd: 16 }}>
          <Stack gap="xs">
            <Title order={1} size="h3">
              Monsters
            </Title>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                URL: <Code data-testid="query">{query(sort, page)}</Code>
              </Text>
              <Popover position="bottom-end" shadow="sm">
                <Popover.Target>
                  <Button variant="default" size="compact-sm">
                    Columns
                  </Button>
                </Popover.Target>
                <Popover.Dropdown>
                  <Checkbox.Group
                    label="Visible columns"
                    value={visible}
                    onChange={(next) =>
                      setHidden(
                        statColumns
                          .map((column) => column.id)
                          .filter(
                            (id) => !next.includes(id),
                          ) as SpikeMonsterNumericField[],
                      )
                    }
                  >
                    <Stack gap={4} mt="xs">
                      {statColumns.map((column) => (
                        <Checkbox
                          key={column.id}
                          value={column.id}
                          label={column.label}
                        />
                      ))}
                    </Stack>
                  </Checkbox.Group>
                </Popover.Dropdown>
              </Popover>
            </Group>
            <Table
              rows={rows}
              caption={`Monsters, sorted by ${sort?.field ?? 'default'}`}
              sort={sort}
              onSortChange={(next) => {
                setSort(next);
                setPage(1);
              }}
              hiddenColumns={hidden}
            />
            <Pagination
              total={13}
              value={page}
              onChange={setPage}
              getItemProps={(item) => ({
                component: 'a',
                href: query(sort, item),
              })}
              aria-label="Monster result pages"
            />
            <Text c="dimmed" size="sm" style={{ minHeight: 600 }}>
              Trailing page content to test long-page scrolling.
            </Text>
          </Stack>
        </main>
      </div>
    </div>
  );
}

const meta = {
  title: 'Spikes/Semantic table/Monster comparison',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** Mantine Table + TanStack Table (sorting state and column visibility only). */
export const TanStackMantine: Story = {
  render: () => <Page Table={MonsterTanStackTable} />,
};

export const TanStackMantineDark: Story = {
  globals: { colorScheme: 'dark' },
  render: () => <Page Table={MonsterTanStackTable} />,
};

export const TanStackMantineShort: Story = {
  render: () => <Page Table={MonsterTanStackTable} count={8} />,
};

/** First-party Mantine Table only (no table engine). */
export const MantineTableOnly: Story = {
  render: () => <Page Table={MonsterMantineTable} />,
};

/** Mantine DataTable with the shared CSS-only column highlight attached via its public class hooks. */
export const DataTableWithColumnHighlight: Story = {
  render: () => (
    <Page Table={(props) => <MonsterDataTable {...props} columnHighlight />} />
  ),
};

/** Mantine DataTable out of the box (minimal comparison, no column menu support in the harness). */
export const DataTableMinimal: Story = {
  render: () => <Page Table={MonsterDataTable} />,
};
