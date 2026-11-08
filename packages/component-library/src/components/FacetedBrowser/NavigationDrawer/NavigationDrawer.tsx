import { Button, Drawer } from '@mantine/core';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import type {
  FacetedBrowserNavigationDrawerMeta,
  FacetedBrowserNavigationDrawerNode,
  FacetedBrowserNavigationHistory,
} from '@/components/FacetedBrowser/FacetedBrowser.types';
import classes from '@/components/FacetedBrowser/FilterDrawer/FilterDrawer.module.css';

export interface NavigationDrawerRenderContext {
  readonly selectedId: string;
  readonly onSelect: (
    node: FacetedBrowserNavigationDrawerNode,
    meta: FacetedBrowserNavigationDrawerMeta,
  ) => void;
}

export interface NavigationDrawerProps {
  readonly opened: boolean;
  readonly title: string;
  readonly currentId: string;
  readonly currentCount?: number | undefined;
  readonly onClose: () => void;
  readonly onApply: (id: string, options: { readonly replace: true }) => void;
  readonly history?: FacetedBrowserNavigationHistory | undefined;
  readonly children:
    ReactNode | ((context: NavigationDrawerRenderContext) => ReactNode);
}

/**
 * Mobile bottom sheet drawer for responsive category navigation.
 * Keeps a draft selection while drilling, with a sticky footer ([Cancel] [Show N items]).
 * Back closes without navigating; applying replaces history.
 */
export function NavigationDrawer({
  opened,
  title,
  currentId,
  currentCount,
  onClose,
  onApply,
  history,
  children,
}: NavigationDrawerProps): ReactElement {
  const [prevOpened, setPrevOpened] = useState(opened);
  const [draftId, setDraftId] = useState(currentId);
  const [draftCount, setDraftCount] = useState<number | undefined>(
    currentCount,
  );
  const [drillEpoch, setDrillEpoch] = useState(0);

  if (opened !== prevOpened) {
    setPrevOpened(opened);
    if (opened) {
      setDraftId(currentId);
      setDraftCount(currentCount);
      setDrillEpoch(0);
    }
  }

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!opened) return;

    if (history) {
      history.push();
    } else if (typeof window !== 'undefined') {
      window.history.pushState(window.history.state, '', window.location.href);
    }
  }, [opened, history]);

  const handleCancel = useCallback(() => {
    if (history) {
      history.back();
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
    setDraftId(currentId);
    setDraftCount(currentCount);
    onClose();
  }, [currentId, currentCount, history, onClose]);

  useEffect(() => {
    if (!opened || typeof window === 'undefined') return;

    const handlePopState = () => {
      setDraftId(currentId);
      setDraftCount(currentCount);
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [opened, currentId, currentCount, onClose]);

  const handleApply = useCallback(() => {
    if (draftId === currentId) {
      handleCancel();
      return;
    }
    onApply(draftId, { replace: true });
    onClose();
  }, [currentId, draftId, handleCancel, onApply, onClose]);

  const handleSelect = useCallback(
    (
      node: FacetedBrowserNavigationDrawerNode,
      meta: FacetedBrowserNavigationDrawerMeta,
    ) => {
      if (meta.isLeaf) {
        if (node.id === currentId) {
          handleCancel();
          return;
        }
        onApply(node.id, { replace: true });
        onClose();
      } else {
        setDraftId(node.id);
        setDraftCount(node.count);
        setDrillEpoch((epoch) => epoch + 1);
      }
    },
    [currentId, handleCancel, onApply, onClose],
  );

  useEffect(() => {
    if (drillEpoch > 0) {
      const activeRow = scrollRef.current?.querySelector<HTMLElement>(
        'button[aria-current="true"]',
      );
      activeRow?.focus();
    }
  }, [drillEpoch]);

  const applyLabel =
    draftCount === undefined ? 'Show items' : `Show ${draftCount} items`;

  return (
    <Drawer.Root
      opened={opened}
      onClose={handleCancel}
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
          <div ref={scrollRef} className={classes['scroll']}>
            {typeof children === 'function'
              ? children({ selectedId: draftId, onSelect: handleSelect })
              : children}
          </div>
          <div
            className={`${classes['footer']} ${classes['footerPair'] ?? ''}`.trim()}
          >
            <Button variant="default" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply}>{applyLabel}</Button>
          </div>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
