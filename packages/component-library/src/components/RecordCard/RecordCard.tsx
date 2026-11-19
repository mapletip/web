import { Card, Group, Stack, Text, Title } from '@mantine/core';
import { CaretRight } from '@phosphor-icons/react';
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
  const mediaAside = layout === 'mediaAside' || layout === 'compactMediaAside';
  const compactMediaAside = layout === 'compactMediaAside';
  const hasMedia = media !== undefined;
  const hasFooter = footer !== undefined;
  let cardClassName = classes['card'];
  let cardPadding: 'xs' | 'sm' | 'md' = 'md';
  if (mediaAside) {
    cardClassName = `${classes['card']} ${compactMediaAside ? classes['compactMediaAside'] : classes['mediaAside']}`;
    cardPadding = compactMediaAside ? 'xs' : 'sm';
  }
  const body = (
    <Card
      className={cardClassName}
      padding={cardPadding}
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
              {destination === undefined
                ? title
                : renderLink(destination, linkRenderer, title)}
            </Title>
            {badges === undefined ? null : (
              <div className={classes['badges']}>{badges}</div>
            )}
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
      {destination === undefined || !compactMediaAside ? null : (
        <CaretRight
          className={classes['chevron']}
          aria-hidden="true"
          size={16}
        />
      )}
    </Card>
  );

  return destination === undefined ? (
    body
  ) : (
    <div className={classes['linkedCard']}>{body}</div>
  );
}
