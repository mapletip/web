import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';
import { createServerEntry } from '@tanstack/react-start/server-entry';

if (import.meta.env.API_MODE === 'msw') {
  const { enableMocking } = await import('./mocks');
  await enableMocking();
}

export default createServerEntry({
  fetch: createStartHandler(defaultStreamHandler),
});
