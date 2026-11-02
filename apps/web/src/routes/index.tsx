import { Button, Paper, Stack, Text, Title } from '@mantine/core';
import { createFileRoute, Link } from '@tanstack/react-router';

import classes from './index.module.css';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: 'MapleTip — server-rendered reference foundation',
      },
      {
        name: 'description',
        content:
          'The MapleTip website foundation, rendered with TanStack Start.',
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className={classes['page']}>
      <Paper className={classes['panel']} p={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          <Text className={classes['eyebrow']} size="sm">
            MapleTip website foundation
          </Text>
          <Title order={1}>Reference pages that arrive ready.</Title>
          <Text c="dimmed">
            This is the local foundation for MapleTip on TanStack Start. The
            document is rendered on the server, styled with the shared Maple
            Twilight theme, and hydrated into an interactive application.
          </Text>
          <div>
            <Button component={Link} to="/demo/faceted-browser" size="md">
              Open the FacetedBrowser demo
            </Button>
          </div>
        </Stack>
      </Paper>
    </main>
  );
}
