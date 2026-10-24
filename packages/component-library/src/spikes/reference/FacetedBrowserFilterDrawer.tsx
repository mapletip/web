import { Button, Drawer } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import classes from './faceted-browser-filter-drawer.module.css';

export interface FacetedBrowserFilterDrawerProps {
  readonly opened: boolean;
  readonly title: string;
  readonly applyLabel: string;
  readonly applyDisabled?: boolean;
  readonly onApply: () => void;
  readonly onCancel: () => void;
  readonly onReset: () => void;
  readonly children: ReactNode;
}

export function FacetedBrowserFilterDrawer({
  opened,
  title,
  applyLabel,
  applyDisabled = false,
  onApply,
  onCancel,
  onReset,
  children,
}: FacetedBrowserFilterDrawerProps): ReactElement {
  return (
    <Drawer
      opened={opened}
      onClose={onCancel}
      title={title}
      position="bottom"
      size="100%"
      radius={0}
      trapFocus
      returnFocus
      lockScroll
      closeOnEscape
      classNames={{
        content: classes['content'] ?? '',
        body: classes['body'] ?? '',
      }}
    >
      <div className={classes['scroll']}>{children}</div>
      <div className={classes['footer']}>
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="subtle" onClick={onReset}>
          Reset
        </Button>
        <Button disabled={applyDisabled} onClick={onApply}>
          {applyLabel}
        </Button>
      </div>
    </Drawer>
  );
}
