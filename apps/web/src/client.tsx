import { StartClient } from '@tanstack/react-start/client';
import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';

if (import.meta.env.API_MODE === 'msw') {
  const { enableMocking } = await import('./mocks');
  await enableMocking();
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});
