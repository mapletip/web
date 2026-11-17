import { MantineProvider } from '@mantine/core';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SITE_ORIGIN } from '@/config/site';
import { routeTree } from '@/routeTree.gen';

import { loadMapDetail } from '../load';
import { projectMapDetail } from '../project';

import { mapPageRecordFixture } from './mapPageFixture';

vi.mock('../load', () => ({ loadMapDetail: vi.fn() }));

const mockedLoadMapDetail = vi.mocked(loadMapDetail);

describe('Map Detail route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads a map and adds canonical and breadcrumb metadata', async () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    mockedLoadMapDetail.mockResolvedValue({ status: 'found', view });

    const history = createMemoryHistory({
      initialEntries: [view.canonicalPath],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    expect(mockedLoadMapDetail).toHaveBeenCalledTimes(1);
    const loadOptions = mockedLoadMapDetail.mock.calls[0]?.[0];
    expect(loadOptions).toMatchObject({
      buildId: 'cw-launch',
      publicId: record.publicId,
    });
    expect(loadOptions?.signal).toBeInstanceOf(AbortSignal);
    const detailMatch = router.state.matches.find(
      (match) => match.routeId === '/maplestory/{-$buildId}/maps/$slugId',
    );
    expect(detailMatch?.loaderData).toEqual(view);
    expect(detailMatch?.links).toContainEqual({
      rel: 'canonical',
      href: `${SITE_ORIGIN}${view.canonicalPath}`,
    });
    const breadcrumbScript = detailMatch?.headScripts?.[0]?.children;
    expect(typeof breadcrumbScript).toBe('string');
    if (typeof breadcrumbScript !== 'string') {
      throw new Error('Expected breadcrumb JSON-LD script content.');
    }
    expect(breadcrumbScript).toContain('BreadcrumbList');
  });

  it('redirects a valid public id with a stale slug to the canonical address', async () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    mockedLoadMapDetail.mockResolvedValue({ status: 'found', view });

    const history = createMemoryHistory({
      initialEntries: [`/maplestory/maps/old-slug-${record.publicId}`],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    expect(history.location.pathname).toBe(view.canonicalPath);
  });

  it('returns not-found for an unknown id and links to Maps', async () => {
    mockedLoadMapDetail.mockResolvedValue({ status: 'not-found' });
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/gms-v83/maps/missing-00000000'],
    });
    const router = createRouter({ routeTree, history });

    render(
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Map not found' }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', { name: 'Browse GMS v83 Maps' }),
    ).toHaveAttribute('href', '/maplestory/gms-v83/maps');
  });

  it.each([
    '/maplestory/maps/not-a-map-address',
    '/maplestory/unknown-build/maps/map-00000000',
  ])('returns not-found before reading %s', async (url) => {
    const history = createMemoryHistory({ initialEntries: [url] });
    const router = createRouter({ routeTree, history });
    await router.load();

    expect(
      router.state.matches.some(
        (match) =>
          match.status === 'notFound' ||
          Boolean((match as { _notFound?: boolean })._notFound),
      ),
    ).toBe(true);
    expect(mockedLoadMapDetail).not.toHaveBeenCalled();
  });

  it('renders the not-found view for an unsupported explicit default build', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/cw-launch/maps/map-00000000'],
    });
    const router = createRouter({ routeTree, history });

    render(
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Map not found' }),
    ).toBeVisible();
    expect(mockedLoadMapDetail).not.toHaveBeenCalled();
  });

  it('renders BrowseUnavailable when the map read fails', async () => {
    mockedLoadMapDetail.mockRejectedValue(
      new Error('Map details could not be loaded.'),
    );
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/maps/practice-grove-00000000'],
    });
    const router = createRouter({ routeTree, history });

    render(
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
