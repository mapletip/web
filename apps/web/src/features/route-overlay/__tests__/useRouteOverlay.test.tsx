import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useRouteOverlay, type RouteOverlayOptions } from '../useRouteOverlay';

interface TestOverlay {
  readonly type: 'test';
}

const testOverlayOptions: RouteOverlayOptions<TestOverlay> = {
  stateKey: 'testOverlay',
  parse: (value) =>
    value !== null &&
    typeof value === 'object' &&
    (value as { readonly type?: unknown }).type === 'test'
      ? { type: 'test' }
      : undefined,
  same: (left, right) => left?.type === right.type,
};

function OverlayControls() {
  const overlay = useRouteOverlay(testOverlayOptions);
  return (
    <>
      <button onClick={() => overlay.open({ type: 'test' })}>Open</button>
      <button onClick={() => void overlay.release('test')}>Release</button>
    </>
  );
}

describe('useRouteOverlay', () => {
  it('releases the overlay in place and preserves the URL and other state', async () => {
    const rootRoute = createRootRoute({ component: OverlayControls });
    const mapsRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/maps',
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([mapsRoute]),
      history: createMemoryHistory({
        initialEntries: ['/maps?focus=plain#stage'],
      }),
    });
    await router.load();
    await router.navigate({
      to: '/maps',
      search: { focus: 'monsters' },
      hash: 'stage',
      state: { preserved: 'yes' },
    } as never);
    const navigate = vi.spyOn(router, 'navigate');

    render(<RouterProvider router={router} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Open' }));
    await waitFor(() =>
      expect(router.state.location.state).toMatchObject({
        testOverlay: { type: 'test' },
      }),
    );
    const openedHref = router.state.location.href;

    await user.click(screen.getByRole('button', { name: 'Release' }));
    await waitFor(() =>
      expect(router.state.location.state).toMatchObject({ preserved: 'yes' }),
    );
    expect(router.state.location.state).not.toHaveProperty('testOverlay');
    expect(router.state.location.href).toBe(openedHref);
    expect(navigate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: '.',
        search: true,
        hash: true,
        replace: true,
        resetScroll: false,
        hashScrollIntoView: false,
      }),
    );
  });
});
