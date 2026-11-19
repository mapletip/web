import { MantineProvider } from '@mantine/core';
import {
  RouterContextProvider,
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SITE_ORIGIN } from '@/config/site';
import { Route as MapDetailRoute } from '@/routes/maplestory/{-$buildId}/maps/$slugId';
import { routeTree } from '@/routeTree.gen';

import { loadMapDetail } from '../load';
import { projectMapDetail } from '../project';

import { mapPageRecordFixture } from './mapPageFixture';

vi.mock('../load', () => ({ loadMapDetail: vi.fn() }));

const mockedLoadMapDetail = vi.mocked(loadMapDetail);

function matchDesktopBreakpoint(): void {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('62'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

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

  it('keeps focus out of the canonical link and does not reload on focus changes', async () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    mockedLoadMapDetail.mockResolvedValue({ status: 'found', view });

    const history = createMemoryHistory({
      initialEntries: [`${view.canonicalPath}?focus=monsters`],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    const detailMatch = router.state.matches.find(
      (match) => match.routeId === '/maplestory/{-$buildId}/maps/$slugId',
    );
    expect(detailMatch?.links).toContainEqual({
      rel: 'canonical',
      href: `${SITE_ORIGIN}${view.canonicalPath}`,
    });

    await router.navigate({
      to: '/maplestory/{-$buildId}/maps/$slugId',
      params: { slugId: `${view.slug}-${view.publicId}` },
      search: { focus: 'npcs' },
      replace: true,
      resetScroll: false,
    });

    expect(mockedLoadMapDetail).toHaveBeenCalledTimes(1);
    expect(history.location.search).toBe('?focus=npcs');
  });

  it('preserves location state when a marker changes focus', async () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    mockedLoadMapDetail.mockResolvedValue({ status: 'found', view });

    const history = createMemoryHistory({
      initialEntries: [view.canonicalPath],
    });
    const router = createRouter({ routeTree, history });
    await router.load();
    await router.navigate({
      to: '/maplestory/{-$buildId}/maps/$slugId',
      params: { slugId: `${view.slug}-${view.publicId}` },
      state: (previous) => ({
        ...previous,
        browseOverlay: { type: 'navigation' },
      }),
      replace: true,
    });

    matchDesktopBreakpoint();
    const RouteComponent = MapDetailRoute.options.component;
    if (RouteComponent === undefined) {
      throw new Error('Expected the Map Detail route component.');
    }
    render(
      <MantineProvider>
        <RouterContextProvider router={router}>
          <RouteComponent />
        </RouterContextProvider>
      </MantineProvider>,
    );

    const marker = screen.getByRole('button', {
      name: 'Twin Sprout, Monster, 2 of 2',
    });
    fireEvent.click(marker);

    await waitFor(() => {
      expect(history.location.search).toMatch(/focus=monster-[a-z0-9]{8}/u);
    });
    expect(history.location.state).toMatchObject({
      browseOverlay: { type: 'navigation' },
    });
  });

  it('redirects a valid public id with a stale slug to the canonical address', async () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const view = projectMapDetail({ record, buildId: 'cw-launch' });
    mockedLoadMapDetail.mockResolvedValue({ status: 'found', view });

    const history = createMemoryHistory({
      initialEntries: [
        `/maplestory/maps/old-slug-${record.publicId}?focus=monsters`,
      ],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    expect(history.location.pathname).toBe(view.canonicalPath);
    expect(history.location.search).toBe('?focus=monsters');
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
