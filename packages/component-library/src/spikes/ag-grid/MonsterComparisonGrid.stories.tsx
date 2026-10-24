import {
  Button,
  Checkbox,
  Code,
  Group,
  NavLink,
  Pagination,
  Popover,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState, type ReactElement } from 'react';

import {
  createSpikeMonsters,
  sortSpikeMonsters,
  type SpikeMonsterNumericField,
  type SpikeSort,
} from './fixtures';
import { MonsterComparisonGrid, numericColumns } from './MonsterComparisonGrid';
import { ResponsiveResultsProbe } from './ResponsiveResultsProbe';

const records = createSpikeMonsters(100);

function serializeQuery(sort: SpikeSort | null, page: number): string {
  const params = new URLSearchParams();
  if (sort) params.set('sort', `${sort.field}-${sort.direction}`);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * Throwaway page harness: sticky header, persistent rail, results toolbar,
 * grid, link pagination and trailing content to exercise page scrolling.
 * Not a proposed layout component.
 */
function SpikePage({
  layout,
  count = 100,
  initialSort = { field: 'exp', direction: 'desc' },
}: {
  readonly layout: 'fixed' | 'auto' | 'bounded';
  readonly count?: number;
  readonly initialSort?: SpikeSort | null;
}): ReactElement {
  const [sort, setSort] = useState<SpikeSort | null>(initialSort);
  const [page, setPage] = useState(1);
  const [hidden, setHidden] = useState<SpikeMonsterNumericField[]>([]);
  // Stand-in for the domain query layer returning one sorted page.
  const rows = useMemo(
    () => sortSpikeMonsters(records.slice(0, count), sort),
    [count, sort],
  );

  return (
    <div style={{ ['--spike-header-height' as string]: '56px' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          paddingInline: 16,
          borderBottom: '1px solid var(--mantine-color-default-border)',
          background: 'var(--mantine-color-body)',
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
          <Stack gap="xs">
            <Text size="xs" fw={650} tt="uppercase">
              Training
            </Text>
            <Checkbox label="Level 1–30" />
            <Checkbox label="Level 31–60" />
            <NavLink label="Victoria Island" href="#" childrenOffset={12}>
              <NavLink label="Henesys" href="#" />
            </NavLink>
          </Stack>
        </aside>
        <main style={{ minWidth: 0, paddingBlock: 12, paddingInlineEnd: 16 }}>
          <Stack gap="xs">
            <Title order={1} size="h3">
              Monsters
            </Title>
            <Group justify="space-between">
              <TextInput
                aria-label="Search monsters"
                placeholder="Search monsters"
                w={280}
              />
              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  URL:{' '}
                  <Code data-testid="query">
                    {serializeQuery(sort, page) || '(none)'}
                  </Code>
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
                      value={numericColumns
                        .map(({ field }) => field)
                        .filter((field) => !hidden.includes(field))}
                      onChange={(visible) =>
                        setHidden(
                          numericColumns
                            .map(({ field }) => field)
                            .filter((field) => !visible.includes(field)),
                        )
                      }
                    >
                      <Stack gap={4} mt="xs">
                        {numericColumns.map(
                          ({ field, headerName, headerTooltip }) => (
                            <Checkbox
                              key={field}
                              value={field}
                              label={headerTooltip ?? headerName}
                            />
                          ),
                        )}
                      </Stack>
                    </Checkbox.Group>
                  </Popover.Dropdown>
                </Popover>
              </Group>
            </Group>
            <MonsterComparisonGrid
              rows={rows}
              sort={sort}
              onSortChange={(next) => {
                setSort(next);
                setPage(1);
              }}
              hiddenColumns={hidden}
              layout={layout}
            />
            <Pagination
              total={13}
              value={page}
              onChange={setPage}
              getItemProps={(item) => ({
                component: 'a',
                href: serializeQuery(sort, item) || '?',
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
  title: 'Spikes/AG Grid/Monster comparison',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** Fixed-height grid: sticky header and pinned column scroll inside the grid. */
export const FixedHeight: Story = {
  render: () => <SpikePage layout="fixed" />,
};

/** Auto-height grid: the page scrolls; rows are not virtualised; header is not sticky. */
export const AutoHeight: Story = {
  render: () => <SpikePage layout="auto" />,
};

/** Bounded auto height (`autoHeightMaxBodyHeight`), long results: grows to the cap, then scrolls internally. */
export const BoundedLong: Story = {
  render: () => <SpikePage layout="bounded" />,
};

/** Bounded auto height, short results: the grid fits its rows with no empty space. */
export const BoundedShort: Story = {
  render: () => <SpikePage layout="bounded" count={8} />,
};

/** Fixed height with the same short results, for comparison: empty space below the rows. */
export const FixedShort: Story = {
  render: () => <SpikePage layout="fixed" count={8} />,
};

/** D2/D4 probe: cards in server HTML (hidden from md); grid lazily mounted from md. Resize to compare. */
export const ResponsiveProbe: Story = {
  render: () => <ResponsiveResultsProbe records={records} />,
};

export const Unsorted: Story = {
  render: () => <SpikePage layout="fixed" initialSort={null} />,
};

export const Dark: Story = {
  globals: { colorScheme: 'dark' },
  render: () => <SpikePage layout="fixed" />,
};
