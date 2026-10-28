import { Alert, Button, Text, Title } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import { FacetedBrowserRecordCard } from '@/components/FacetedBrowser/__stories__/FacetedBrowserRecordCard';
import { FacetedBrowser } from '@/components/FacetedBrowser/FacetedBrowser';
import type { FacetDefinition } from '@/components/FacetedBrowser/FacetedBrowser';
import type {
  BrowseState,
  QueryFieldDefinition,
} from '@/components/FacetedBrowser/hooks/useFacetedBrowser';
import {
  demoGroupFacetOptions,
  demoRegionFacetOptions,
} from '@/fixtures/facetOptions';
import {
  demoRecords,
  formatDemoNumber,
  makeDemoColumns,
} from '@/fixtures/records';
import type { DemoRecord } from '@/fixtures/records';

const meta = {
  title: 'Components/FacetedBrowser',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

type Variant = 'loading' | 'error' | 'unavailable' | 'noMatches' | 'drawerOpen';

function BrowserExample({
  variant,
  state,
  onStateChange,
}: {
  readonly variant?: Variant;
  readonly state?: BrowseState;
  readonly onStateChange?: (nextState: BrowseState) => void;
}) {
  const records = demoRecords;
  const columns = useMemo(
    () => [
      ...makeDemoColumns(),
      { accessor: 'region', title: 'Region' },
      { accessor: 'status', title: 'Status' },
      {
        accessor: 'value10',
        title: 'Value 10',
        numeric: true,
        render: (record: DemoRecord) =>
          record.value10 === null ? '—' : formatDemoNumber(record.value10),
      },
      {
        accessor: 'href',
        title: 'Record URL',
        render: (record: DemoRecord) => <a href={record.href}>{record.href}</a>,
      },
    ],
    [],
  );
  const queryFields = useMemo<readonly QueryFieldDefinition<DemoRecord>[]>(
    () => [
      { id: 'region', accessor: 'region', sortable: false },
      { id: 'status', accessor: 'status', sortable: false },
      {
        id: 'hasImage',
        accessor: (record: DemoRecord) => record.image !== null,
        sortable: false,
      },
    ],
    [],
  );
  const facets = useMemo<readonly FacetDefinition<DemoRecord>[]>(
    () => [
      {
        id: 'category',
        field: 'group',
        label: 'Category',
        kind: 'multi-select',
        quick: true,
        options: demoGroupFacetOptions.map(({ value, label }) => ({
          value,
          label,
        })),
      },
      {
        id: 'region',
        field: 'region',
        label: 'Region',
        kind: 'multi-select',
        quick: true,
        options: demoRegionFacetOptions,
      },
      {
        id: 'image-availability',
        field: 'hasImage',
        label: 'Image available',
        kind: 'boolean',
      },
    ],
    [],
  );
  const [drawerOpened, setDrawerOpened] = useState(variant === 'drawerOpen');
  const defaultState: BrowseState = {
    search: '',
    filters:
      variant === 'noMatches' ? { group: ['Category with no matches'] } : {},
    sort: { field: 'value1', direction: 'desc' },
    page: 1,
    pageSize: 50,
    hiddenColumns: [],
  };
  const stateProps = state
    ? { state, onStateChange: onStateChange! }
    : { defaultState };

  return (
    <FacetedBrowser
      title={<Title order={1}>Browse records</Title>}
      records={records}
      idAccessor="id"
      identityField="name"
      columns={columns}
      queryFields={queryFields}
      facets={facets}
      presentation="comparison"
      tableMaxHeight={560}
      renderCard={(record) => <FacetedBrowserRecordCard record={record} />}
      {...stateProps}
      drawerOpened={drawerOpened}
      onDrawerOpenedChange={setDrawerOpened}
      drawerContent={
        <Text size="sm">
          <a href="/records/region/north">Browse the North region</a>
        </Text>
      }
      {...(variant === 'loading' ? { loading: true } : {})}
      {...(variant === 'error'
        ? {
            error: 'The records could not be loaded.',
            onRetry: () => undefined,
          }
        : {})}
      {...(variant === 'unavailable'
        ? { unavailable: 'There are no records for this build.' }
        : {})}
    />
  );
}

export const Default: Story = {
  render: () => <BrowserExample />,
};

export const CrossFacetFiltering: Story = {
  name: 'Cross-facet filters',
  render: () => <BrowserExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const matchingCount = demoRecords.filter(
      (record) => record.group === 'Beta' && record.region === 'South',
    ).length;
    await userEvent.click(canvas.getByRole('checkbox', { name: /^Beta \(/u }));
    await userEvent.click(canvas.getByRole('checkbox', { name: /^South \(/u }));
    await waitFor(async () => {
      await expect(
        canvas.getAllByText(`1–${matchingCount} of ${matchingCount} records`)
          .length,
      ).toBeGreaterThan(0);
      await expect(
        canvas.queryByText('No records match'),
      ).not.toBeInTheDocument();
    });
  },
};

export const MobileCards: Story = {
  name: 'Mobile cards',
  render: () => <BrowserExample />,
  globals: { viewport: { value: 'mobileBreakpoint', isRotated: false } },
};

export const CustomResults: Story = {
  name: 'Custom results',
  render: () => (
    <FacetedBrowser
      title={<Title order={1}>Browse records</Title>}
      records={demoRecords}
      idAccessor="id"
      presentation="custom"
      renderResults={({ records }) => (
        <div
          role="list"
          aria-label="Record cards"
          style={{ display: 'grid', gap: 12 }}
        >
          {records.map((record) => (
            <div role="listitem" key={record.id}>
              <FacetedBrowserRecordCard record={record} />
            </div>
          ))}
        </div>
      )}
      facets={[]}
      defaultState={{
        search: '',
        filters: {},
        page: 1,
        pageSize: 12,
        hiddenColumns: [],
      }}
    />
  ),
};

export const DrawerOpen: Story = {
  render: () => <BrowserExample variant="drawerOpen" />,
  globals: { viewport: { value: 'tablet', isRotated: false } },
};

export const FacetShortcutOpensDrawer: Story = {
  name: 'Quick facet',
  render: () => <BrowserExample />,
  globals: { viewport: { value: 'mobileBreakpoint', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Category. Open Category filters' }),
    );
    await waitFor(async () => {
      await expect(
        await screen.findByRole('button', { name: 'Back to all filters' }),
      ).toBeVisible();
    });
  },
};

export const Empty: Story = {
  render: () => (
    <FacetedBrowser
      title={<Title order={1}>Browse records</Title>}
      records={[]}
      idAccessor="id"
      presentation="cards"
      renderCard={(record) => <FacetedBrowserRecordCard record={record} />}
      facets={[]}
      defaultState={{
        search: '',
        filters: {},
        page: 1,
        pageSize: 50,
        hiddenColumns: [],
      }}
    />
  ),
};

export const Loading: Story = {
  render: () => <BrowserExample variant="loading" />,
};

export const Error: Story = {
  render: () => <BrowserExample variant="error" />,
};

export const Unavailable: Story = {
  render: () => <BrowserExample variant="unavailable" />,
};

export const NoMatches: Story = {
  render: () => <BrowserExample variant="noMatches" />,
};

export const Controlled: Story = {
  name: 'Controlled',
  render: function ControlledExample() {
    const [state, setState] = useState<BrowseState>({
      search: '',
      filters: {},
      sort: { field: 'value1', direction: 'desc' },
      page: 1,
      pageSize: 25,
      hiddenColumns: [],
    });
    return (
      <>
        <Alert title="Serialized browse state" mb="md">
          <Text size="xs" style={{ overflowWrap: 'anywhere' }}>
            {JSON.stringify(state)}
          </Text>
          <Button
            type="button"
            variant="default"
            size="compact-sm"
            mt="xs"
            onClick={() =>
              setState({
                ...state,
                search: 'Record 001',
                page: 1,
              })
            }
          >
            Restore URL state
          </Button>
        </Alert>
        <BrowserExample state={state} onStateChange={setState} />
      </>
    );
  },
};
