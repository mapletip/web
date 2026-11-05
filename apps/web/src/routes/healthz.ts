import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/healthz')({
  server: {
    handlers: {
      GET: () =>
        new Response('ok', {
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'text/plain; charset=utf-8',
          },
        }),
    },
  },
});
