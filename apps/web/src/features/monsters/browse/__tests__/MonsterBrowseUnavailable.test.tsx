import { MantineProvider } from '@mantine/core';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MonsterBrowseUnavailable } from '../MonsterBrowseUnavailable';

/**
 * The route error boundary is a real UI contract: a generic user-facing message,
 * no leaked diagnostics, and a working retry. It reads the router context, so it
 * is exercised through a real router whose loader fails rather than being called
 * as a plain component.
 */
async function renderFailedRoute(error: unknown) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const failingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/monsters',
    loader: () => {
      throw error;
    },
    errorComponent: MonsterBrowseUnavailable,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([failingRoute]),
    history: createMemoryHistory({ initialEntries: ['/monsters'] }),
  });

  render(
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>,
  );
  await screen.findByRole('heading', { name: 'Something went wrong' });
  return router;
}

describe('MonsterBrowseUnavailable', () => {
  it('shows a generic user-facing message with a retry', async () => {
    await renderFailedRoute(
      Object.assign(new Error('internal detail'), {
        code: 'INTEGRITY_ERROR',
      }),
    );

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeVisible();
    expect(
      screen.getByText(/something went wrong while loading this page/u),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  it('never renders SDK diagnostics', async () => {
    await renderFailedRoute(
      Object.assign(new Error('/var/home/agent/release.json sha256 abc123'), {
        code: 'SOMETHING_INTERNAL',
      }),
    );

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeVisible();
    expect(screen.queryByText(/release\.json/u)).not.toBeInTheDocument();
    expect(screen.queryByText(/sha256/u)).not.toBeInTheDocument();
  });

  it('retries through the router instead of reloading the document', async () => {
    const router = await renderFailedRoute(
      Object.assign(new Error('failed'), { code: 'REQUEST_ERROR' }),
    );
    const invalidate = vi
      .spyOn(router, 'invalidate')
      .mockResolvedValue(undefined);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
  });
});
