import { Card, Group, Stack, Text, Title } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';

import classes from '@/components/RecordCard/RecordCard.module.css';
import type {
  RecordCardDestination,
  RecordCardLinkRenderer,
  RecordCardLinkRenderProps,
  RecordCardProps,
} from '@/components/RecordCard/types';

function renderLink(
  destination: RecordCardDestination,
  linkRenderer: RecordCardLinkRenderer | undefined,
  children: ReactNode,
): ReactNode {
  const props: RecordCardLinkRenderProps = {
    href: destination.href,
    className: classes['link'] ?? '',
    children,
  };

  return linkRenderer ? (
    linkRenderer(destination, props)
  ) : (
    <a {...props}>{props.children}</a>
  );
}

/** A generic record card with optional media, footer and host-rendered link. */
export function RecordCard({
  title,
  layout = 'default',
  secondaryLine,
  badges,
  media,
  footer,
  destination,
  renderLink: linkRenderer,
}: RecordCardProps): ReactElement {
  const mediaAside = layout === 'mediaAside';
  const hasMedia = media !== undefined;
  const hasFooter = footer !== undefined;
  const body = (
    <Card
      className={
        mediaAside
          ? `${classes['card']} ${classes['mediaAside']}`
          : classes['card']
      }
      padding={mediaAside ? 'sm' : 'md'}
      radius="md"
      withBorder
      data-record-card="true"
      data-record-card-has-media={mediaAside ? String(hasMedia) : undefined}
      data-record-card-has-footer={mediaAside ? String(hasFooter) : undefined}
      data-record-card-layout={mediaAside ? layout : undefined}
    >
      <Group className={classes['main']} align="flex-start" wrap="nowrap">
        <Stack className={classes['text']} gap="xs">
          <Group align="center" gap="xs" wrap="wrap">
            <Title order={3} className={classes['title']}>
              {title}
            </Title>
            {badges}
          </Group>
          {secondaryLine === undefined ? null : (
            <Text className={classes['secondary']} size="sm" c="dimmed">
              {secondaryLine}
            </Text>
          )}
        </Stack>
        {!mediaAside && media !== undefined ? (
          <div className={classes['media']}>{media}</div>
        ) : null}
      </Group>
      {mediaAside && media !== undefined ? (
        <div className={classes['media']}>{media}</div>
      ) : null}
      {footer === undefined ? null : (
        <div className={classes['footer']}>{footer}</div>
      )}
    </Card>
  );

  return destination === undefined ? (
    body
  ) : (
    <div className={classes['linkedCard']}>
      {renderLink(destination, linkRenderer, body)}
    </div>
  );
}
