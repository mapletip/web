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
  title: string,
  children: ReactNode,
): ReactNode {
  const props: RecordCardLinkRenderProps = {
    href: destination.href,
    className: classes['link'] ?? '',
    'aria-label': title,
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
  secondaryLine,
  badges,
  media,
  footer,
  destination,
  renderLink: linkRenderer,
}: RecordCardProps): ReactElement {
  const body = (
    <Card
      className={classes['card']}
      padding="md"
      radius="md"
      withBorder
      data-record-card="true"
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
        {media === undefined ? null : (
          <div className={classes['media']}>{media}</div>
        )}
      </Group>
      {footer === undefined ? null : (
        <div className={classes['footer']}>{footer}</div>
      )}
    </Card>
  );

  return destination === undefined ? (
    body
  ) : (
    <div className={classes['linkedCard']}>
      {renderLink(destination, linkRenderer, title, body)}
    </div>
  );
}
