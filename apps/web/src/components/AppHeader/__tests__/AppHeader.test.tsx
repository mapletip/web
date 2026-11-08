import { MantineProvider } from '@mantine/core';
import { itemIconUrl } from '@mapletip/data/items';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';

import { AppHeader } from '../AppHeader';
import { ALL_ITEMS_COLLECTION_ICONS } from '../ItemCollectionIcon';

async function renderAppHeader() {
  const rootRoute = createRootRoute({ component: Outlet });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: AppHeader,
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

  await screen.findByRole('banner');
}

describe('AppHeader', () => {
  it('renders All Items entry with four iconic collection sprites in the Items dropdown', async () => {
    const user = userEvent.setup();
    await renderAppHeader();

    const itemsButton = screen.getByRole('button', { name: 'Items' });
    await user.click(itemsButton);

    await waitFor(() => {
      expect(
        document.querySelector('a[href="/maplestory/items"]'),
      ).not.toBeNull();
    });

    const allItemsLink = document.querySelector<HTMLAnchorElement>(
      'a[href="/maplestory/items"]',
    )!;
    expect(allItemsLink.textContent).toContain('All Items');
    expect(allItemsLink.textContent).toContain(
      'Browse every non-equipment item',
    );

    const images = Array.from(allItemsLink.querySelectorAll('img'));
    expect(images).toHaveLength(4);

    images.forEach((img, index) => {
      const config = ALL_ITEMS_COLLECTION_ICONS[index];
      expect(config).toBeDefined();
      expect(img.getAttribute('src')).toBe(
        itemIconUrl(MAPLEKIT_RELEASE.baseUrl, config?.contentId ?? ''),
      );
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('width')).toBe('15');
      expect(img.getAttribute('height')).toBe('15');
    });

    const useItemsLink = document.querySelector<HTMLAnchorElement>(
      'a[href="/maplestory/items/use"]',
    )!;
    const [useImg] = Array.from(useItemsLink.querySelectorAll('img'));
    expect(useImg).toBeDefined();
    expect(useImg?.getAttribute('width')).toBe('22');
    expect(useImg?.getAttribute('height')).toBe('22');
  });

  it('renders All Items collection icon in the mobile navigation drawer', async () => {
    const user = userEvent.setup();
    await renderAppHeader();

    const burger = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(burger);

    const drawer = await screen.findByRole('dialog', { name: 'Navigation' });
    const itemsGroupButton = within(drawer).getByRole('button', {
      name: 'Items',
    });
    await user.click(itemsGroupButton);

    await waitFor(() => {
      expect(
        drawer.querySelector('a[href="/maplestory/items"]'),
      ).not.toBeNull();
    });

    const allItemsLink = drawer.querySelector<HTMLAnchorElement>(
      'a[href="/maplestory/items"]',
    )!;
    const images = Array.from(allItemsLink.querySelectorAll('img'));
    expect(images).toHaveLength(4);

    images.forEach((img, index) => {
      const config = ALL_ITEMS_COLLECTION_ICONS[index];
      expect(config).toBeDefined();
      expect(img.getAttribute('src')).toBe(
        itemIconUrl(MAPLEKIT_RELEASE.baseUrl, config?.contentId ?? ''),
      );
    });
  });
});
