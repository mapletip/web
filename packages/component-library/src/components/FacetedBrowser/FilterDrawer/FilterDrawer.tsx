import { ActionIcon, Button, Drawer } from '@mantine/core';
import type { ReactElement, ReactNode, Ref } from 'react';

import classes from '@/components/FacetedBrowser/FilterDrawer/FilterDrawer.module.css';

export interface FilterDrawerProps {
  readonly opened: boolean;
  readonly title: string;
  /** "Show 214 results" or "Show results"; computed by the domain. */
  readonly applyLabel: string;
  readonly applyDisabled?: boolean;
  readonly onApply: () => void;
  /** Close and discard the draft: Cancel, Escape, overlay, host-driven close. */
  readonly onCancel: () => void;
  /** Clear the draft's filters; the drawer stays open. */
  readonly onReset: () => void;
  /** Mantine transition hook for host-managed focus when a drawer view opens. */
  readonly onEnterTransitionEnd?: () => void;
  /** Back control shown in the header when the host opens a nested filter view. */
  readonly backLabel?: string;
  readonly onBack?: () => void;
  /** Ref for host-managed focus on the current drawer view title. */
  readonly titleRef?: Ref<HTMLHeadingElement>;
  readonly children: ReactNode;
}

export function FilterDrawer({
  opened,
  title,
  applyLabel,
  applyDisabled = false,
  onApply,
  onCancel,
  onReset,
  onEnterTransitionEnd,
  backLabel,
  onBack,
  titleRef,
  children,
}: FilterDrawerProps): ReactElement {
  return (
    <Drawer.Root
      opened={opened}
      onClose={onCancel}
      position="bottom"
      size="100%"
      {...(onEnterTransitionEnd ? { onEnterTransitionEnd } : {})}
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
          {onBack ? (
            <ActionIcon
              variant="subtle"
              size={44}
              className={classes['headerAction']}
              aria-label={backLabel ?? 'Back'}
              onClick={onBack}
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
                <path d="M20 12H9" />
              </svg>
            </ActionIcon>
          ) : null}
          <Drawer.Title
            className={classes['title']}
            tabIndex={-1}
            {...(titleRef ? { ref: titleRef } : {})}
          >
            {title}
          </Drawer.Title>
          <Drawer.CloseButton
            className={classes['headerAction']}
            aria-label={`Close ${title}`}
          />
        </Drawer.Header>
        <Drawer.Body>
          <div className={classes['scroll']}>{children}</div>
          <div className={classes['footer']}>
            <div className={classes['cancelReset']}>
              <Button variant="default" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="subtle" onClick={onReset}>
                Reset
              </Button>
            </div>
            <Button color="indigo.7" disabled={applyDisabled} onClick={onApply}>
              {applyLabel}
            </Button>
          </div>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
