import { MantineProvider } from '@mantine/core';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BUILD_ID } from '@/config/maplekit';
import { SITE_ORIGIN } from '@/config/site';

import {
  DetailBreadcrumbs,
  RecordNotFound,
  buildCollectionPath,
  buildDetailHead,
  buildRecordDetailPath,
  canonicalBuildParam,
  formatRecordAddress,
  parseRecordAddress,
  resolveBuildIdParam,
} from '../index';

function renderWithMantine(ui: ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

async function renderWithRouter(ui: ReactElement) {
  const rootRoute = createRootRoute({
    component: () => ui,
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  render(
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>,
  );
  await router.load();
}

describe('detail address helpers', () => {
  it('parses valid {slug}-{publicId} addresses including hyphenated slugs', () => {
    expect(parseRecordAddress('shellback-36z2h01p')).toEqual({
      slug: 'shellback',
      publicId: '36z2h01p',
    });
    expect(parseRecordAddress('jr-emberlord-0a1b2c3d')).toEqual({
      slug: 'jr-emberlord',
      publicId: '0a1b2c3d',
    });
    expect(parseRecordAddress('a-b-c-12345678')).toEqual({
      slug: 'a-b-c',
      publicId: '12345678',
    });
  });

  it('rejects malformed record addresses', () => {
    const malformed = [
      '',
      'shellback',
      '36z2h01p',
      '-36z2h01p',
      'shellback--36z2h01p',
      'shellback-36z2h01',
      'shellback-36z2h01pa',
      'shellback-36Z2H01P',
      'Shellback-36z2h01p',
      'snail_36z2h01p',
      'shellback-36z2h01p/',
      'shellback-36z2h01!',
    ];

    for (const value of malformed) {
      expect(parseRecordAddress(value)).toBeNull();
    }
  });

  it('formats record addresses', () => {
    expect(formatRecordAddress('jr-emberlord', '0a1b2c3d')).toBe(
      'jr-emberlord-0a1b2c3d',
    );
  });

  it('resolves optional build params and canonical build params', () => {
    expect(resolveBuildIdParam(undefined)).toBe(DEFAULT_BUILD_ID);
    expect(resolveBuildIdParam('gms-v83')).toBe('gms-v83');
    expect(resolveBuildIdParam('cw-launch')).toBeNull();
    expect(resolveBuildIdParam('unknown')).toBeNull();
    expect(resolveBuildIdParam('')).toBeNull();

    expect(canonicalBuildParam('cw-launch')).toBeUndefined();
    expect(canonicalBuildParam('gms-v83')).toBe('gms-v83');
  });

  it('builds canonical collection and record detail paths', () => {
    expect(buildCollectionPath('monsters')).toBe('/maplestory/monsters');
    expect(buildCollectionPath('monsters', 'cw-launch')).toBe(
      '/maplestory/monsters',
    );
    expect(buildCollectionPath('monsters', 'gms-v83')).toBe(
      '/maplestory/gms-v83/monsters',
    );

    expect(buildRecordDetailPath('monsters', 'shellback', '36z2h01p')).toBe(
      '/maplestory/monsters/shellback-36z2h01p',
    );
    expect(
      buildRecordDetailPath('monsters', 'shellback', '36z2h01p', 'cw-launch'),
    ).toBe('/maplestory/monsters/shellback-36z2h01p');
    expect(
      buildRecordDetailPath('monsters', 'deepmaw', 'jp565851', 'gms-v83'),
    ).toBe('/maplestory/gms-v83/monsters/deepmaw-jp565851');
  });
});

describe('buildDetailHead', () => {
  it('builds meta, og tags, canonical link, and omits robots/scripts by default', () => {
    const head = buildDetailHead({
      title: 'Shellback – MapleStory Classic World Monsters – MapleTip',
      description: 'Stats, locations and drops for Shellback.',
      canonicalPath: '/maplestory/monsters/shellback-36z2h01p',
      ogType: 'website',
    });

    expect(head.meta).toEqual([
      { title: 'Shellback – MapleStory Classic World Monsters – MapleTip' },
      {
        name: 'description',
        content: 'Stats, locations and drops for Shellback.',
      },
      {
        property: 'og:title',
        content: 'Shellback – MapleStory Classic World Monsters – MapleTip',
      },
      {
        property: 'og:description',
        content: 'Stats, locations and drops for Shellback.',
      },
      { property: 'og:type', content: 'website' },
      {
        property: 'og:url',
        content: `${SITE_ORIGIN}/maplestory/monsters/shellback-36z2h01p`,
      },
    ]);
    expect(head.links).toEqual([
      {
        rel: 'canonical',
        href: `${SITE_ORIGIN}/maplestory/monsters/shellback-36z2h01p`,
      },
    ]);
    expect(head.scripts).toEqual([]);
  });

  it('includes robots noindex,follow when noIndex is true', () => {
    const head = buildDetailHead({
      title: 'Monster not found – MapleTip',
      description: 'Record not found.',
      canonicalPath: '/maplestory/monsters/missing-00000000',
      ogType: 'website',
      noIndex: true,
    });

    expect(head.meta).toContainEqual({
      name: 'robots',
      content: 'noindex,follow',
    });
  });

  it('includes Schema.org BreadcrumbList JSON-LD when breadcrumbs are provided', () => {
    const head = buildDetailHead({
      title: 'Shellback',
      description: 'Shellback details.',
      canonicalPath: '/maplestory/monsters/shellback-36z2h01p',
      ogType: 'website',
      breadcrumbs: [
        { label: 'Home', path: '/' },
        { label: 'Monsters', path: '/maplestory/monsters' },
        { label: 'Shellback', path: '/maplestory/monsters/shellback-36z2h01p' },
      ],
    });

    expect(head.scripts).toHaveLength(1);
    const script = head.scripts[0];
    expect(script?.type).toBe('application/ld+json');
    expect(JSON.parse(script?.children ?? '{}')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${SITE_ORIGIN}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Monsters',
          item: `${SITE_ORIGIN}/maplestory/monsters`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Shellback',
          item: `${SITE_ORIGIN}/maplestory/monsters/shellback-36z2h01p`,
        },
      ],
    });
  });
});

describe('DetailBreadcrumbs', () => {
  it('renders accessible breadcrumb navigation with fallback anchors and current page', () => {
    renderWithMantine(
      <DetailBreadcrumbs
        items={[
          { label: 'Home', path: '/' },
          { label: 'Monsters', path: '/maplestory/monsters' },
          {
            label: 'Shellback',
            path: '/maplestory/monsters/shellback-36z2h01p',
          },
        ]}
      />,
    );

    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: 'Monsters' })).toHaveAttribute(
      'href',
      '/maplestory/monsters',
    );

    const current = screen.getByText('Shellback');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(
      screen.queryByRole('link', { name: 'Shellback' }),
    ).not.toBeInTheDocument();
  });

  it('uses AnchorLink when linkProps are supplied', async () => {
    await renderWithRouter(
      <DetailBreadcrumbs
        items={[
          { label: 'Home', path: '/', linkProps: { to: '/' } },
          {
            label: 'Shellback',
            path: '/maplestory/monsters/shellback-36z2h01p',
          },
        ]}
      />,
    );

    expect(await screen.findByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByText('Shellback')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('renders breadcrumbs without a destination as plain text', () => {
    renderWithMantine(
      <DetailBreadcrumbs
        items={[
          { label: 'Home', path: '/' },
          { label: 'Maps', path: '/maplestory/maps' },
          { label: 'Western Isle' },
          { label: 'Meadowbrook' },
          {
            label: 'Meadowbrook Hunting Field I',
            path: '/maplestory/maps/map-id',
          },
        ]}
      />,
    );

    expect(
      screen.queryByRole('link', { name: 'Western Isle' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Meadowbrook' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Western Isle')).not.toHaveAttribute('href');
    expect(screen.getByText('Meadowbrook')).not.toHaveAttribute('href');
  });
});

describe('RecordNotFound', () => {
  it('renders inside the main landmark with title, default generic message, and fallback back link', () => {
    renderWithMantine(
      <RecordNotFound
        title="Monster not found"
        backLabel="Back to Monsters"
        backPath="/maplestory/monsters"
      />,
    );

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Monster not found' }),
    ).toBeVisible();
    expect(
      screen.getByText("We couldn't find the record you're looking for."),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Back to Monsters' }),
    ).toHaveAttribute('href', '/maplestory/monsters');
  });

  it('supports a custom message and renders AnchorLink when backLinkProps are supplied', async () => {
    await renderWithRouter(
      <RecordNotFound
        title="Monster not found"
        message="Missing record."
        backLabel="Back to home"
        backPath="/"
        backLinkProps={{ to: '/' }}
      />,
    );

    expect(
      await screen.findByRole('link', { name: 'Back to home' }),
    ).toHaveAttribute('href', '/');
  });
});
