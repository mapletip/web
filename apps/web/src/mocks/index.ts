// The MSW Vite plugin supplies this virtual module only in mock-mode builds.
// eslint-disable-next-line import-x/no-unresolved
import { network } from 'virtual:msw';

import { failingOriginHandlers, handlers } from './handlers';

export async function enableMocking(): Promise<void> {
  network.configure({ handlers, onUnhandledFrame: 'bypass' });
  await network.enable();
  if (import.meta.env.SSR && process.env['MOCK_ORIGIN'] === 'failing') {
    network.use(...failingOriginHandlers);
  }
}
