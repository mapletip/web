import { MantineProvider } from '@mantine/core';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppFooter } from '../AppFooter';

const expectedNavigation = [
  ['Monsters', '/maplestory/monsters'],
  ['Maps', '/maplestory/maps'],
  ['Quests', '/maplestory/quests'],
  ['NPCs', '/maplestory/npcs'],
  ['MapleStory Music', '/maplestory/music'],
  ['Forums', 'https://forums.mapletip.com'],
  ['Equipment', '/maplestory/equipment'],
  ['All Items', '/maplestory/items'],
  ['Use Items', '/maplestory/items/use'],
  ['ETC Items', '/maplestory/items/etc'],
  ['Set-up Items', '/maplestory/items/setup'],
  ['Cash Items & Pets', '/maplestory/items/cash'],
  ['Privacy Policy', '/privacy'],
] as const;

async function renderAppFooter() {
  const rootRoute = createRootRoute({ component: Outlet });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: AppFooter,
  });
  const privacyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/privacy',
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, privacyRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  render(
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>,
  );

  await screen.findByRole('contentinfo');
}

function officialLinks() {
  return screen
    .getAllByRole('link')
    .filter((link) => link.getAttribute('target') === '_blank');
}

describe('AppFooter', () => {
  it('renders one Footer with the MapleTip brand and tagline', async () => {
    await renderAppFooter();

    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);

    const brand = screen.getByRole('link', { name: 'MapleTip' });
    expect(brand).toHaveAttribute('href', '/');
    expect(brand.querySelector('img')).toHaveAttribute(
      'src',
      '/brand/mapletip-mark.svg',
    );
    expect(brand.querySelector('img')).toHaveAttribute('alt', '');
    expect(
      screen.getByText('Your destination for MapleStory guides and help.'),
    ).toBeVisible();
  });

  it('renders the approved Explore and Items inventory in order', async () => {
    await renderAppFooter();

    const navigation = screen.getByRole('navigation', {
      name: 'Footer navigation',
    });

    expect(
      within(navigation)
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['Explore', 'Items', 'About']);

    const links = within(navigation).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(
      expectedNavigation.map(([label]) => label),
    );
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      expectedNavigation.map(([, href]) => href),
    );
  });

  it('uses safe, disclosed new-tab links for the two official sources', async () => {
    await renderAppFooter();

    const links = officialLinks();
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://www.nexon.com/maplestory/',
      'https://www.nexon.com/main/en',
    ]);
    expect(
      screen.queryByRole('link', { name: /YouTube/u }),
    ).not.toBeInTheDocument();

    for (const link of links) {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAccessibleName(/\(opens in a new tab\)/u);
    }

    expect(
      screen.getByRole('link', { name: 'MapleStory (opens in a new tab)' }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'NEXON (opens in a new tab)' }),
    ).toBeVisible();
  });

  it('links to the implemented privacy route', async () => {
    await renderAppFooter();

    expect(
      screen.getByRole('link', { name: 'Privacy Policy' }),
    ).toHaveAttribute('href', '/privacy');
  });
});
