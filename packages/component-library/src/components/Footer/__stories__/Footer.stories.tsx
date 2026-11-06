import type { Meta, StoryObj } from '@storybook/react-vite';

import { Footer } from '@/components/Footer';
import type { FooterGroup } from '@/components/Footer';

const defaultGroups = [
  {
    id: 'explore',
    title: 'Explore',
    links: [
      { id: 'collections', label: 'Collections', href: '/collections' },
      { id: 'maps', label: 'Maps', href: '/maps' },
      { id: 'guides', label: 'Guides', href: '/guides' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    links: [
      {
        id: 'documentation',
        label: 'Documentation',
        href: '/documentation',
      },
      { id: 'contact', label: 'Contact', href: '/contact' },
    ],
  },
] satisfies readonly FooterGroup[];

const navigationHeavyGroups = [
  {
    id: 'explore',
    title: 'Explore',
    links: [
      { id: 'collections', label: 'Collections', href: '/collections' },
      { id: 'maps', label: 'Maps', href: '/maps' },
      { id: 'guides', label: 'Guides', href: '/guides' },
      { id: 'expeditions', label: 'Expeditions', href: '/expeditions' },
      { id: 'journal', label: 'Journal', href: '/journal' },
    ],
  },
  {
    id: 'collections',
    title: 'Collections',
    links: [
      { id: 'atlases', label: 'Atlases', href: '/collections/atlases' },
      { id: 'archives', label: 'Archives', href: '/collections/archives' },
      {
        id: 'field-notes',
        label: 'Field notes',
        href: '/collections/field-notes',
      },
      {
        id: 'photographs',
        label: 'Photographs',
        href: '/collections/photographs',
      },
      { id: 'specimens', label: 'Specimens', href: '/collections/specimens' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    links: [
      {
        id: 'documentation',
        label: 'Documentation',
        href: '/documentation',
      },
      { id: 'glossary', label: 'Glossary', href: '/glossary' },
      { id: 'bibliography', label: 'Bibliography', href: '/bibliography' },
      { id: 'contact', label: 'Contact', href: '/contact' },
    ],
  },
  {
    id: 'about',
    title: 'About',
    links: [
      { id: 'mission', label: 'Mission', href: '/about/mission' },
      { id: 'team', label: 'Team', href: '/about/team' },
      { id: 'careers', label: 'Careers', href: '/about/careers' },
      { id: 'press', label: 'Press', href: '/about/press' },
    ],
  },
] satisfies readonly FooterGroup[];

const longContentGroups = [
  {
    id: 'research-collections',
    title: 'Research collections and archival material',
    links: [
      {
        id: 'regional-field-notes',
        label: 'Regional field notes and seasonal observations',
        href: '/collections/field-notes',
      },
      {
        id: 'historical-cartography',
        label: 'Historical cartography and geographic reference sheets',
        href: '/collections/cartography',
      },
    ],
  },
  {
    id: 'institutional-resources',
    title: 'Institutional resources and reference services',
    links: [
      {
        id: 'researcher-documentation',
        label: 'Researcher documentation and citation guidance',
        href: '/documentation',
      },
      {
        id: 'archival-access',
        label: 'Archival access requests and reproduction policies',
        href: '/documentation/access',
      },
    ],
  },
] satisfies readonly FooterGroup[];

const defaultLegal = (
  <p>
    Reference Atlas is a fictional demonstration of the shared Footer component.
    Content and destinations are illustrative.
  </p>
);

const legalWithLinks = (
  <>
    <p>
      Reference Atlas is an independent, fictional reference surface. Content,
      names and destinations are illustrative and do not describe a real
      organisation. Read the{' '}
      <a href="https://example.com/editorial-guidelines">
        editorial guidelines
      </a>{' '}
      and the <a href="https://example.com/privacy">privacy notice</a>.
    </p>
    <p>
      External reference:{' '}
      <a href="https://example.com/archive">public archive catalogue</a>.
    </p>
  </>
);

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

const defaultDescription =
  'A neutral reference surface for field notes, collections and maps.';

const meta = {
  title: 'Components/Footer',
  component: Footer,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    brand: <ReferenceBrand />,
    description: defaultDescription,
    groups: defaultGroups,
    legal: defaultLegal,
  },
};

export const Minimal: Story = {
  args: {
    brand: <ReferenceBrand />,
  },
};

export const NoLegal: Story = {
  name: 'No legal',
  args: {
    brand: <ReferenceBrand />,
    description: defaultDescription,
    groups: defaultGroups,
  },
};

export const NavigationHeavy: Story = {
  name: 'Navigation heavy',
  args: {
    brand: <ReferenceBrand />,
    description: defaultDescription,
    groups: navigationHeavyGroups,
    legal: defaultLegal,
  },
};

export const LongContent: Story = {
  name: 'Long content',
  args: {
    brand: <ReferenceBrand name="Reference Atlas for Regional Field Studies" />,
    description:
      'A neutral reference surface for extended field notes, regional collections, historical maps and archival research materials.',
    groups: longContentGroups,
    legal: (
      <p>
        Reference Atlas is a fictional demonstration of the shared Footer
        component. Names, collections and destinations are illustrative and do
        not describe a real organisation or archive.
      </p>
    ),
  },
};

export const LegalAndExternalLinks: Story = {
  name: 'Legal and external links',
  args: {
    brand: <ReferenceBrand />,
    description: defaultDescription,
    groups: defaultGroups,
    legal: legalWithLinks,
  },
};

export const NoBrand: Story = {
  name: 'No brand',
  args: {
    groups: defaultGroups,
    legal: defaultLegal,
  },
};
