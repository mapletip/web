import { Button, Text, Title } from '@mantine/core';
import { useRouter } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import classes from './BrowseUnavailable.module.css';

/**
 * Generic user-facing error state for browse routes. It offers a retry and never
 * renders raw SDK messages, paths, digests or stacks, because those are not a
 * visitor-facing contract.
 */
export function BrowseUnavailable(): ReactElement {
  const router = useRouter();

  return (
    <main id="main-content" tabIndex={-1} className={classes['page']}>
      <Title order={1}>Something went wrong</Title>
      <Text>Sorry, something went wrong while loading this page.</Text>
      <Button
        className={classes['retry']}
        onClick={() => {
          void router.invalidate();
        }}
      >
        Try again
      </Button>
    </main>
  );
}
