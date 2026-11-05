import { Button, Text, Title } from '@mantine/core';
import { useRouter } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import classes from './MonsterBrowseUnavailable.module.css';

/**
 * Honest unavailable state for a failed verified-release read. It says what
 * happened and offers a retry; it never renders raw SDK messages, paths, digests
 * or stacks, because those are not a visitor-facing contract.
 *
 * This is distinct from a valid zero-result filter, which the FacetedBrowser
 * renders itself.
 */
export function MonsterBrowseUnavailable(): ReactElement {
  const router = useRouter();

  return (
    <main id="main-content" tabIndex={-1} className={classes['page']}>
      <Title order={1}>Monster data is unavailable</Title>
      <Text>
        The pinned MapleKit release could not be read or verified, so this page
        cannot show monster records. Nothing has been substituted for the real
        data.
      </Text>
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
