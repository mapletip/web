import { Drawer } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import classes from '@/components/FacetedBrowser/FilterDrawer/FilterDrawer.module.css';

export interface NavigationDrawerProps {
  readonly opened: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

/**
 * Mobile bottom sheet drawer for responsive navigation.
 * Shares sheet styling with FilterDrawer while omitting Apply/Cancel actions
 * since navigation is immediate.
 */
export function NavigationDrawer({
  opened,
  title,
  onClose,
  children,
}: NavigationDrawerProps): ReactElement {
  return (
    <Drawer.Root
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="100%"
      classNames={{
        content: classes['content'] ?? '',
        body: classes['body'] ?? '',
        header: classes['header'] ?? '',
        inner: classes['inner'] ?? '',
      }}
    >
      <Drawer.Overlay />
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title className={classes['title']}>{title}</Drawer.Title>
          <Drawer.CloseButton
            className={classes['headerAction']}
            aria-label={`Close ${title}`}
          />
        </Drawer.Header>
        <Drawer.Body>
          <div className={classes['scroll']}>{children}</div>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
