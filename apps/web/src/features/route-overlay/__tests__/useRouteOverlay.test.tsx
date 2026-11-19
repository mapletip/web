import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useLocation,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

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
  const state = useLocation({ select: (location) => location.state });
  const preserved =
    state !== null && typeof state === 'object' && 'preserved' in state
      ? String(state['preserved'])
      : 'missing';
  return (
    <>
      <button onClick={() => overlay.open({ type: 'test' })}>Open</button>
      {overlay.overlay?.type === 'test' ? (
        <div role="dialog" aria-label="Test overlay">
          Test overlay open
        </div>
      ) : null}
      <button onClick={() => void overlay.release('test')}>Release</button>
      <output aria-label="Preserved state">{preserved}</output>
    </>
  );
}

describe('useRouteOverlay', () => {
  it('releases the visible overlay in place and preserves the URL and other state', async () => {
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
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();
    expect(await screen.findByLabelText('Preserved state')).toHaveTextContent(
      'yes',
    );
    await user.click(await screen.findByRole('button', { name: 'Open' }));
    expect(
      await screen.findByRole('dialog', { name: 'Test overlay' }),
    ).toBeVisible();
    const openedHref = router.state.location.href;

    await user.click(screen.getByRole('button', { name: 'Release' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Test overlay' }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Preserved state')).toHaveTextContent('yes');
    expect(router.state.location.href).toBe(openedHref);
  });
});
