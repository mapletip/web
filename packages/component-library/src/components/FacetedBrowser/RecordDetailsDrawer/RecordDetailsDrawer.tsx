import { Drawer, useMantineTheme, type DrawerProps } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ReactElement, ReactNode } from 'react';

import classes from '@/components/FacetedBrowser/FacetedBrowser.module.css';

export interface RecordDetailsDrawerProps {
  readonly opened: boolean;
  readonly sideOnDesktop?: boolean;
  readonly bottomSize?: DrawerProps['size'];
  readonly sideSize?: DrawerProps['size'];
  /** Host content, or the record identity when the host gives no title. */
  readonly title: ReactNode;
  readonly closeLabel: string;
  readonly onClose: () => void;
  readonly children?: ReactNode;
}

/**
 * Shared record-details drawer. Mantine owns the
 * overlay, focus trap, Escape handling and focus return; this wrapper only
 * carries the placement, fixed header and scrolling body.
 */
export function RecordDetailsDrawer({
  opened,
  sideOnDesktop = false,
  bottomSize = '50vh',
  sideSize = '75vw',
  title,
  closeLabel,
  onClose,
  children,
}: RecordDetailsDrawerProps): ReactElement {
  const theme = useMantineTheme();
  const isDesktop = useMediaQuery(
    `(min-width: ${theme.breakpoints.md})`,
    false,
  );
  const sideDrawer = sideOnDesktop && isDesktop;
  const closeButtonProps = { 'aria-label': closeLabel, 'data-autofocus': true };
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position={sideDrawer ? 'right' : 'bottom'}
      size={sideDrawer ? sideSize : bottomSize}
      radius={sideDrawer ? 0 : 'md'}
      title={title}
      closeButtonProps={closeButtonProps}
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
