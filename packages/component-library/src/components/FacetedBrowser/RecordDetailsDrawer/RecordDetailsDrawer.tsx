import { Drawer } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import classes from '@/components/FacetedBrowser/FacetedBrowser.module.css';

export interface RecordDetailsDrawerProps {
  readonly opened: boolean;
  /** Host content, or the record identity when the host gives no title. */
  readonly title: ReactNode;
  readonly closeLabel: string;
  readonly onClose: () => void;
  readonly children?: ReactNode;
}

/**
 * The mobile half of the comparison record-details contract. Mantine owns the
 * overlay, focus trap, Escape handling and focus return; this wrapper only
 * carries the shared presentation (bottom sheet, fixed header, scrolling body).
 */
export function RecordDetailsDrawer({
  opened,
  title,
  closeLabel,
  onClose,
  children,
}: RecordDetailsDrawerProps): ReactElement {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="50vh"
      radius="md"
      title={title}
      closeButtonProps={{ 'aria-label': closeLabel }}
      overlayProps={{ backgroundOpacity: 0.6, blur: 1 }}
      classNames={{
        content: classes['detailsDrawerContent'],
        header: classes['detailsDrawerHeader'],
        body: classes['detailsDrawerBody'],
      }}
    >
      {children}
    </Drawer>
  );
}
