import { MantineProvider } from '@mantine/core';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SITE_ORIGIN } from '@/config/site';
import { loadMonsterBrowse } from '@/features/monsters/browse/load';
import { routeTree } from '@/routeTree.gen';

import { loadMonsterDetail } from '../load';
import { projectMonsterDetail } from '../project';

import { monsterPageFixture } from './monsterPageFixture';

vi.mock('@/features/monsters/browse/load', () => ({
  loadMonsterBrowse: vi.fn().mockResolvedValue({
    rows: [],
    dropItemOptions: [],
  }),
}));

vi.mock('../load', () => ({
  loadMonsterDetail: vi.fn(),
}));

const mockedLoadMonsterDetail = vi.mocked(loadMonsterDetail);

describe('Monster Browse & Detail route integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matches Monster Browse for default and alternate builds', async () => {
    for (const url of [
      '/maplestory/monsters',
      '/maplestory/gms-v83/monsters',
    ]) {
      const history = createMemoryHistory({ initialEntries: [url] });
      const router = createRouter({ routeTree, history });
      await router.load();

      const match = router.state.matches.find(
        (m) => m.routeId === '/maplestory/{-$buildId}/monsters/',
      );
      expect(match).toBeDefined();
      expect(mockedLoadMonsterDetail).not.toHaveBeenCalled();
    }
    expect(loadMonsterBrowse).toHaveBeenCalledTimes(2);
  });

  it('loads Monster Detail without invoking Monster Browse loader', async () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        publicId: 'jp565851',
        slug: 'deepmaw',
        name: { state: 'known', value: 'Deepmaw' },
      }),
      'gms-v83',
    );
    mockedLoadMonsterDetail.mockResolvedValue({ status: 'found', view });

    const history = createMemoryHistory({
      initialEntries: ['/maplestory/gms-v83/monsters/deepmaw-jp565851'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    expect(loadMonsterBrowse).not.toHaveBeenCalled();
    expect(mockedLoadMonsterDetail).toHaveBeenCalledTimes(1);
    const loadCall = mockedLoadMonsterDetail.mock.calls[0]?.[0];
    expect(loadCall?.buildId).toBe('gms-v83');
    expect(loadCall?.publicId).toBe('jp565851');
    expect(loadCall?.signal).toBeInstanceOf(AbortSignal);
    expect(loadCall?.signal).toBeInstanceOf(AbortSignal);

    const detailMatch = router.state.matches.find(
      (m) => m.routeId === '/maplestory/{-$buildId}/monsters/$slugId',
    );
    expect(detailMatch).toBeDefined();
    expect(detailMatch?.loaderData).toEqual(view);

    const headScripts = detailMatch?.headScripts ?? [];
    const headLinks = detailMatch?.links ?? [];
    expect(headLinks).toContainEqual({
      rel: 'canonical',
      href: `${SITE_ORIGIN}/maplestory/gms-v83/monsters/deepmaw-jp565851`,
    });
    expect(headScripts).toHaveLength(1);
    expect(headScripts[0]?.children).toContain('BreadcrumbList');
  });

  it('redirects with 301 when the request slug differs from the canonical slug', async () => {
    const view = projectMonsterDetail(
      monsterPageFixture({
        publicId: '36z2h01p',
        slug: 'sentinel-shellback',
        name: { state: 'known', value: 'Sentinel Shellback' },
      }),
      'cw-launch',
    );
    mockedLoadMonsterDetail.mockResolvedValue({ status: 'found', view });

    const history = createMemoryHistory({
      initialEntries: ['/maplestory/monsters/old-slug-36z2h01p'],
    });
    const router = createRouter({ routeTree, history });
    await router.load();

    expect(history.location.pathname).toBe(
      '/maplestory/monsters/sentinel-shellback-36z2h01p',
    );
  });

  const invalidAddresses = [
    '/maplestory/cw-launch/monsters',
    '/maplestory/unknown-build/monsters',
    '/maplestory/cw-launch/monsters/shellback-36z2h01p',
    '/maplestory/unknown-build/monsters/shellback-36z2h01p',
    '/maplestory/monsters/shellback',
    '/maplestory/monsters/shellback-short',
    '/maplestory/monsters/Shellback-36z2h01p',
  ];

  for (const url of invalidAddresses) {
    it(`triggers notFound before any loader for ${url}`, async () => {
      const history = createMemoryHistory({ initialEntries: [url] });
      const router = createRouter({ routeTree, history });
      await router.load();

      const hasNotFound = router.state.matches.some(
        (match) =>
          match.status === 'notFound' ||
          Boolean((match as { _notFound?: boolean })._notFound),
      );
      expect(hasNotFound).toBe(true);
      expect(mockedLoadMonsterDetail).not.toHaveBeenCalled();
      expect(loadMonsterBrowse).not.toHaveBeenCalled();
    });
  }

  it('renders RecordNotFound linking back to browse for malformed $slugId without loading data', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/maplestory/monsters/shellback'],
    });
    const router = createRouter({ routeTree, history });

    render(
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Monster not found' }),
      ).toBeInTheDocument();
    });

    expect(mockedLoadMonsterDetail).not.toHaveBeenCalled();
    expect(
      screen.getByRole('link', { name: 'Browse Classic World Monsters' }),
    ).toHaveAttribute('href', '/maplestory/monsters');
  });

  it('renders RecordNotFound linking back to the build browse page when missing', async () => {
    mockedLoadMonsterDetail.mockResolvedValue({ status: 'not-found' });

    const history = createMemoryHistory({
      initialEntries: ['/maplestory/gms-v83/monsters/missing-00000000'],
    });
    const router = createRouter({ routeTree, history });

    render(
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Monster not found' }),
      ).toBeInTheDocument();
    });

    const browseLink = screen.getByRole('link', {
      name: 'Browse GMS v83 Monsters',
    });
    expect(browseLink).toHaveAttribute('href', '/maplestory/gms-v83/monsters');
  });
});
