import { Alert, Box, Button, Text, Title } from '@mantine/core';
import { Sparkle } from '@phosphor-icons/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import { DrillDownNav } from '@/components/DrillDownNav';
import type { DrillDownNode } from '@/components/DrillDownNav';
import { FacetedBrowser } from '@/components/FacetedBrowser';
import type {
  BrowseSortOption,
  FacetDefinition,
  FacetedBrowserNavigation,
  BrowseState,
  PageLinkRenderOptions,
  PageLinkRenderer,
  QueryFieldDefinition,
} from '@/components/FacetedBrowser';
import { FacetedBrowserRecordCard } from '@/components/FacetedBrowser/__stories__/FacetedBrowserRecordCard';
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
  decorators: [
    (Story) => (
      <Box
        p={{ base: 'md', md: 'xl' }}
        style={{
          height: '100dvh',
          maxWidth: 1440,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <Story />
      </Box>
    ),
  ],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

type Variant = 'loading' | 'error' | 'unavailable' | 'noMatches' | 'drawerOpen';

const demoSortOptions: readonly BrowseSortOption[] = [
  {
    label: 'Name (A–Z)',
    field: 'name',
    direction: 'asc',
  },
  {
    label: 'Name (Z–A)',
    field: 'name',
    direction: 'desc',
  },
  {
    label: 'Value 1 (Highest)',
    field: 'value1',
    direction: 'desc',
  },
  {
    label: 'Value 1 (Lowest)',
    field: 'value1',
    direction: 'asc',
  },
];

function categoryGroup(index: number): string {
  return index < 2 ? 'Common categories' : 'Other categories';
}

function BrowserExample({
  variant,
  state,
  onStateChange,
  fillHeight = true,
  groupedCategories = false,
  navigation,
  sortOptions,
  renderPageLink,
}: {
  readonly variant?: Variant;
  readonly state?: BrowseState;
  readonly onStateChange?: (nextState: BrowseState) => void;
  readonly fillHeight?: boolean;
  readonly groupedCategories?: boolean;
  readonly navigation?: FacetedBrowserNavigation;
  readonly sortOptions?: readonly BrowseSortOption[];
  readonly renderPageLink?: PageLinkRenderer;
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
        options: demoGroupFacetOptions.map(({ value, label }, index) => ({
          value,
          label,
          ...(groupedCategories ? { group: categoryGroup(index) } : {}),
        })),
      },
      {
        id: 'region',
        field: 'region',
        label: 'Region',
        kind: 'multi-select',
        options: demoRegionFacetOptions,
      },
      {
        id: 'image-availability',
        field: 'hasImage',
        label: 'Image available',
        kind: 'boolean',
      },
    ],
    [groupedCategories],
  );
  const [drawerOpened, setDrawerOpened] = useState(variant === 'drawerOpen');
  const defaultState: BrowseState = {
    search: variant === 'noMatches' ? 'No matching records' : '',
    filters: {},
    sort: { field: 'value1', direction: 'desc' },
    page: 1,
    pageSize: 50,
    hiddenColumns: [],
  };
  const [internalState, setInternalState] = useState<BrowseState>(
    state ?? defaultState,
  );
  const effectiveState = state ?? internalState;
  const handleStateChange = onStateChange ?? setInternalState;
  const stateProps = {
    state: effectiveState,
    onStateChange: handleStateChange,
  };

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
      {...(navigation ? { navigation } : {})}
      {...(sortOptions ? { sortOptions } : {})}
      {...(renderPageLink ? { renderPageLink } : {})}
      {...(fillHeight ? { fillHeight: true } : { tableMaxHeight: 560 })}
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
  render: () => <BrowserExample sortOptions={demoSortOptions} />,
};

export const GroupedOptions: Story = {
  name: 'Grouped facet options',
  render: () => <BrowserExample groupedCategories />,
};

export const Active: Story = {
  name: 'Active filters and sort',
  render: () => (
    <BrowserExample
      state={{
        search: '',
        filters: { group: ['Beta'], region: ['South'] },
        sort: { field: 'value1', direction: 'desc' },
        page: 1,
        pageSize: 50,
        hiddenColumns: [],
      }}
    />
  ),
};

export const KeyboardFocus: Story = {
  name: 'Keyboard focus',
  render: () => <BrowserExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox', { name: /^Alpha \(/u });
    checkbox.focus({ focusVisible: true });
    await expect(checkbox).toHaveFocus();
  },
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
  render: () => <BrowserExample sortOptions={demoSortOptions} />,
  globals: { viewport: { value: 'mobileBreakpoint', isRotated: false } },
};

export const RecordDetails: Story = {
  name: 'Record details',
  render: () => (
    <FacetedBrowser
      title={<Title order={1}>Browse records</Title>}
      records={demoRecords.slice(0, 12)}
      idAccessor="id"
      identityField="name"
      columns={makeDemoColumns()}
      presentation="comparison"
      renderCard={(record, { openDetails, isDetailsOpen }) => (
        <div style={{ display: 'grid', gap: 8 }}>
          <FacetedBrowserRecordCard record={record} />
          <Button
            type="button"
            variant={isDetailsOpen === true ? 'light' : 'default'}
            aria-haspopup="dialog"
            aria-expanded={isDetailsOpen}
            onClick={openDetails}
          >
            Details for {record.name}
          </Button>
        </div>
      )}
      recordDetailsTitle={(record) => `Details: ${record.name}`}
      rowExpansionContent={(record, { surface }) => (
        <Text size="sm">
          {surface === 'table' ? 'Inline details' : 'Drawer details'} for{' '}
          <a href={record.href}>{record.name}</a>.
        </Text>
      )}
      defaultState={{
        search: '',
        filters: {},
        sort: { field: 'value1', direction: 'desc' },
        page: 1,
        pageSize: 12,
        hiddenColumns: [],
      }}
    />
  ),
  globals: { viewport: { value: 'mobileBreakpoint', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', {
      name: 'Details for Record 001',
    });
    await userEvent.click(trigger);
    const drawer = await screen.findByRole('dialog', {
      name: 'Details: Record 001',
    });
    await expect(drawer).toBeInTheDocument();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
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
  render: () => (
    <BrowserExample variant="drawerOpen" sortOptions={demoSortOptions} />
  ),
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
        <BrowserExample
          state={state}
          onStateChange={setState}
          fillHeight={false}
        />
      </>
    );
  },
};

const demoNavTree: DrillDownNode = {
  id: 'all',
  label: 'All Categories',
  href: '#all',
  count: 24,
  children: [
    {
      id: 'featured',
      label: 'Featured',
      href: '#featured',
      icon: <Sparkle size={20} aria-hidden="true" />,
      count: 8,
      children: [
        { id: 'spotlight', label: 'Spotlight', href: '#spotlight', count: 3 },
      ],
    },
    {
      id: 'archive',
      label: 'Archive',
      href: '#archive',
      count: 16,
    },
  ],
};

export const RailNavigationSlot: Story = {
  name: 'Rail navigation',
  render: () => (
    <BrowserExample
      navigation={{
        label: 'Categories',
        currentLabel: 'Featured',
        currentId: 'featured',
        currentCount: 8,
        apply: () => {},
        currentIcon: <Sparkle size={20} aria-hidden="true" />,
        render: (context) => (
          <DrillDownNav
            root={demoNavTree}
            currentId="featured"
            label="Categories"
            {...(context.mode === 'rail' && context.onNavigate
              ? { onNavigate: context.onNavigate }
              : {})}
          />
        ),
      }}
    />
  ),
};

function DrawerNavigationExample() {
  const [currentId, setCurrentId] = useState('all');

  const currentNode = useMemo(() => {
    function find(node: DrillDownNode): DrillDownNode | undefined {
      if (node.id === currentId) return node;
      if (node.children) {
        for (const child of node.children) {
          const res = find(child);
          if (res) return res;
        }
      }
      return undefined;
    }
    return find(demoNavTree) ?? demoNavTree;
  }, [currentId]);

  return (
    <BrowserExample
      navigation={{
        label: 'Categories',
        currentLabel: currentNode.label,
        currentId,
        currentCount: currentNode.count,
        apply: (id) => {
          setCurrentId(id);
        },
        currentIcon: <Sparkle size={20} aria-hidden="true" />,
        render: (context) => {
          if (context.mode === 'drawer') {
            return (
              <DrillDownNav
                root={demoNavTree}
                currentId={context.selectedId}
                label="Categories"
                onSelect={context.onSelect}
              />
            );
          }
          return (
            <DrillDownNav
              root={demoNavTree}
              currentId={currentId}
              label="Categories"
              {...(context.onNavigate
                ? { onNavigate: context.onNavigate }
                : {})}
            />
          );
        },
      }}
    />
  );
}

export const NavigationDrawerDrillAndApply: Story = {
  name: 'Navigation drawer drill and apply',
  render: () => <DrawerNavigationExample />,
  globals: { viewport: { value: 'mobileBreakpoint', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. Open the navigation drawer from the mobile chip
    const chip = canvas.getByRole('button', {
      name: /Categories: All Categories/i,
    });
    await userEvent.click(chip);

    // 2. Wait for the navigation drawer dialog to mount in document.body
    await waitFor(async () => {
      await expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = within(screen.getByRole('dialog'));

    // 3. Drill into "Featured" (non-leaf row)
    const featuredBtn = dialog.getByRole('button', { name: /^Featured/i });
    await userEvent.click(featuredBtn);

    // 4. Verify drill-down shape: Featured highlighted, back row to All Categories, Spotlight child visible
    await waitFor(async () => {
      const activeBtn = dialog.getByRole('button', { name: /^Featured/i });
      await expect(activeBtn).toHaveAttribute('aria-current', 'true');
    });
    await expect(
      dialog.getByRole('button', { name: /All Categories/i }),
    ).toBeInTheDocument();
    const spotlightBtn = dialog.getByRole('button', { name: /Spotlight/i });
    await expect(spotlightBtn).toBeInTheDocument();

    // 5. Tap leaf row "Spotlight" -> applies immediately and closes
    await userEvent.click(spotlightBtn);

    // 6. Verify drawer is closed and chip updated to Spotlight
    await waitFor(async () => {
      await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await expect(
      canvas.getByRole('button', { name: /Categories: Spotlight/i }),
    ).toBeInTheDocument();
  },
};

export const HostPageLinkRenderer: StoryObj<{
  renderPageLink?: PageLinkRenderer;
}> = {
  name: 'Host page link renderer',
  args: {
    renderPageLink: ({
      page: targetPage,
      props: linkProps,
    }: PageLinkRenderOptions) => (
      <a href={`?page=${targetPage}`} {...linkProps}>
        {linkProps.children}
      </a>
    ),
  },
  render: (args) => <BrowserExample {...args} />,
};
