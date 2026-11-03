import { Text, Title } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

import classes from './index.module.css';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: 'MapleTip — Coming soon',
      },
      {
        name: 'description',
        content: 'The MapleTip website is coming soon.',
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main id="main-content" tabIndex={-1} className={classes['page']}>
      <Title order={1}>Coming soon</Title>
      <Text c="dimmed">MapleTip is still under construction.</Text>
    </main>
  );
}
