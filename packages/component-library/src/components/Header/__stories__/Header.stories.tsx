import { Button } from '@mantine/core';
import {
  BookOpen,
  FolderOpen,
  MapTrifold,
  SquaresFour,
} from '@phosphor-icons/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import { Header } from '@/components/Header';
import type { HeaderLink } from '@/components/Header';

const defaultNavigation = [
  { id: 'overview', label: 'Overview', href: '/overview' },
  { id: 'field-guide', label: 'Field guide', href: '/field-guide' },
  {
    id: 'collections',
    label: 'Collections',
    children: [
      { id: 'maps', label: 'Maps', href: '/collections/maps' },
      { id: 'specimens', label: 'Specimens', href: '/collections/specimens' },
      { id: 'archive', label: 'Archive', href: '/collections/archive' },
    ],
  },
  { id: 'journal', label: 'Journal', href: '/journal' },
] satisfies readonly HeaderLink[];

const activeNavigation = [
  { id: 'overview', label: 'Overview', href: '/overview' },
  { id: 'field-guide', label: 'Field guide', href: '/field-guide' },
  {
    id: 'collections',
    label: 'Collections',
    active: true,
    children: [
      {
        id: 'maps',
        label: 'Maps',
        href: '/collections/maps',
        active: true,
        current: true,
      },
      { id: 'specimens', label: 'Specimens', href: '/collections/specimens' },
      { id: 'archive', label: 'Archive', href: '/collections/archive' },
    ],
  },
  { id: 'journal', label: 'Journal', href: '/journal' },
] satisfies readonly HeaderLink[];

const detailedNavigation = [
  { id: 'overview', label: 'Overview', href: '/overview' },
  {
    id: 'library',
    label: 'Library',
    description: 'Browse reference materials',
    children: [
      {
        id: 'all-materials',
        label: 'All materials',
        description: 'Browse every reference item',
        icon: <SquaresFour />,
        href: '/library',
      },
      {
        id: 'field-guides',
        label: 'Field guides',
        description: 'Regional reference volumes',
        icon: <BookOpen />,
        href: '/library/field-guides',
      },
      {
        id: 'maps',
        label: 'Maps',
        description: 'Geographic overview',
        icon: <MapTrifold />,
        href: '/library/maps',
      },
      {
        id: 'archives',
        label: 'Archives',
        description: 'Historical records',
        icon: <FolderOpen />,
        href: '/library/archives',
      },
    ],
  },
  { id: 'journal', label: 'Journal', href: '/journal' },
] satisfies readonly HeaderLink[];

const partialNavigation = [
  {
    id: 'library',
    label: 'Library',
    description: 'Browse reference materials',
    children: [
      { id: 'all-materials', label: 'All materials', href: '/library' },
      {
        id: 'field-guides',
        label: 'Field guides',
        description: 'Regional reference volumes',
        href: '/library/field-guides',
      },
      {
        id: 'maps',
        label: 'Maps',
        icon: <MapTrifold />,
        href: '/library/maps',
      },
    ],
  },
] satisfies readonly HeaderLink[];

const detailedLongNavigation = [
  {
    id: 'library',
    label: 'Library and special collections',
    description:
      'Browse field guides, maps, archives, and supporting reference materials for regional study',
    children: [
      {
        id: 'field-guides',
        label: 'Field guides and regional reference volumes',
        description:
          'Browse every long-form field guide and regional reference volume in the collection',
        icon: <BookOpen />,
        href: '/library/field-guides',
      },
      {
        id: 'maps',
        label: 'Maps and geographic reference material',
        description:
          'Review geographic overviews and detailed regional reference material',
        icon: <MapTrifold />,
        href: '/library/maps',
      },
    ],
  },
] satisfies readonly HeaderLink[];

const longNavigation = [
  {
    id: 'regional-field-guide',
    label: 'Regional field guide and seasonal observations',
    href: '/regional-field-guide',
  },
  {
    id: 'collections',
    label: 'Collections and long-term archive',
    children: [
      {
        id: 'maps',
        label: 'Maps and geographic reference material',
        href: '/collections/maps',
      },
      {
        id: 'specimens',
        label: 'Specimen notes and collection records',
        href: '/collections/specimens',
      },
    ],
  },
  {
    id: 'research',
    label: 'Long-term research notes and publications',
    href: '/research',
  },
] satisfies readonly HeaderLink[];

function ReferenceBrand({ name = 'Reference Atlas' }: { name?: string }) {
  return (
    <a
      href="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        minWidth: 0,
        color: 'var(--mapletip-color-ink)',
        fontWeight: 800,
        textDecoration: 'none',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'grid',
          placeItems: 'center',
          flex: '0 0 auto',
          width: 32,
          height: 32,
          color: 'var(--mapletip-color-brand-text)',
          fontSize: 12,
          letterSpacing: '0.04em',
          background: 'var(--mapletip-color-selection)',
          border: '1px solid var(--mapletip-color-selection-edge)',
          borderRadius: 8,
        }}
      >
        RA
      </span>
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{name}</span>
    </a>
  );
}

function ReferenceUtility() {
  return (
    <Button variant="default" size="compact-sm">
      Account
    </Button>
  );
}

const meta = {
  title: 'Components/Header',
  component: Header,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    brand: <ReferenceBrand />,
    navigation: defaultNavigation,
    utility: <ReferenceUtility />,
  },
};

export const ActiveDestination: Story = {
  name: 'Active destination',
  args: {
    brand: <ReferenceBrand />,
    navigation: activeNavigation,
    utility: <ReferenceUtility />,
  },
};

export const GroupedNavigationOpen: Story = {
  name: 'Grouped navigation open',
  args: {
    brand: <ReferenceBrand />,
    navigation: defaultNavigation,
    utility: <ReferenceUtility />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Collections' }));
    await waitFor(async () => {
      await expect(canvas.getByRole('link', { name: 'Maps' })).toBeVisible();
    });
  },
};

export const DetailedNavigationOpen: Story = {
  name: 'Detailed navigation open',
  args: {
    brand: <ReferenceBrand />,
    navigation: detailedNavigation,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Library' }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('heading', { name: 'Library' }),
      ).toBeVisible();
    });
  },
};

export const DetailedPartialMetadata: Story = {
  name: 'Detailed partial metadata',
  args: {
    brand: <ReferenceBrand />,
    navigation: partialNavigation,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Library' }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('link', { name: /Field guides/ }),
      ).toBeVisible();
    });
  },
};

export const DetailedLongLabels: Story = {
  name: 'Detailed long labels',
  args: {
    brand: <ReferenceBrand />,
    navigation: detailedLongNavigation,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Library and special collections' }),
    );
    await waitFor(async () => {
      await expect(
        canvas.getByRole('link', { name: /Field guides and regional/ }),
      ).toBeVisible();
    });
  },
};

export const DetailedMobileNavigationOpen: Story = {
  name: 'Detailed mobile navigation open',
  args: {
    brand: <ReferenceBrand />,
    navigation: detailedNavigation,
  },
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Navigation' });
    await waitFor(async () => {
      await expect(dialog).toBeVisible();
      await expect(
        within(dialog).getByRole('link', { name: 'Field guides' }),
      ).toBeVisible();
    });
  },
};

export const NoUtility: Story = {
  name: 'No utility',
  args: {
    brand: <ReferenceBrand />,
    navigation: defaultNavigation,
  },
};

export const LongLabels: Story = {
  name: 'Long labels',
  args: {
    brand: <ReferenceBrand name="Reference Atlas for Regional Field Studies" />,
    navigation: longNavigation,
    utility: <ReferenceUtility />,
  },
};

export const Minimal: Story = {
  args: {
    brand: <ReferenceBrand />,
  },
};

export const UtilityOnly: Story = {
  name: 'Utility only',
  args: {
    brand: <ReferenceBrand />,
    utility: <ReferenceUtility />,
  },
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Menu' });
    await waitFor(async () => {
      await expect(dialog).toBeVisible();
      await expect(within(dialog).getByText('Account')).toBeVisible();
    });
  },
};

export const MobileNavigationOpen: Story = {
  name: 'Mobile navigation open',
  args: {
    brand: <ReferenceBrand />,
    navigation: defaultNavigation,
    utility: <ReferenceUtility />,
  },
  globals: { viewport: { value: 'phone', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open navigation' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Navigation' });
    await waitFor(async () => {
      await expect(dialog).toBeVisible();
      await expect(
        within(dialog).getByRole('link', { name: 'Field guide' }),
      ).toBeVisible();
      await expect(within(dialog).getByText('Account')).toBeVisible();
    });
  },
};
