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

interface RenderLinkOptions {
  readonly destination: RecordCardDestination;
  readonly linkRenderer: RecordCardLinkRenderer | undefined;
  readonly children: ReactNode;
}

function renderLink({
  destination,
  linkRenderer,
  children,
}: RenderLinkOptions): ReactNode {
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
  linkScope = 'card',
}: RecordCardProps): ReactElement {
  const mediaAside = layout === 'mediaAside' || layout === 'compactMediaAside';
  const compactMediaAside = layout === 'compactMediaAside';
  const hasMedia = media !== undefined;
  const hasFooter = footer !== undefined;
  const headerScopedLink = destination !== undefined && linkScope === 'header';
  const layoutClass = compactMediaAside
    ? classes['compactMediaAside']
    : classes['mediaAside'];
  let cardPadding: 'xs' | 'sm' | 'md' = 'md';
  if (mediaAside) {
    cardPadding = compactMediaAside ? 'xs' : 'sm';
  }
  const layoutProps = {
    className: mediaAside ? layoutClass : undefined,
    'data-record-card-has-media': mediaAside ? String(hasMedia) : undefined,
    'data-record-card-has-footer': mediaAside
      ? String(compactMediaAside ? hasFooter : hasFooter && !headerScopedLink)
      : undefined,
    'data-record-card-layout': mediaAside ? layout : undefined,
  };
  const main = (
    <Group className={classes['main']} align="flex-start" wrap="nowrap">
      <Stack className={classes['text']} gap="xs">
        <Group align="center" gap="xs" wrap="wrap">
          <Title order={3} className={classes['title']}>
            {destination === undefined
              ? title
              : renderLink({
                  destination,
                  linkRenderer,
                  children: title,
                })}
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
  );
  const asideMedia =
    mediaAside && media !== undefined ? (
      <div className={classes['media']}>{media}</div>
    ) : null;
  const headerContent = (
    <>
      {main}
      {asideMedia}
    </>
  );
  const cardFooter =
    footer === undefined ? null : (
      <div className={classes['footer']}>{footer}</div>
    );
  const chevron =
    destination === undefined || !compactMediaAside ? null : (
      <CaretRight className={classes['chevron']} aria-hidden="true" size={16} />
    );

  let cardContent: ReactNode;
  if (compactMediaAside) {
    cardContent = (
      <>
        <div
          className={[
            classes['compactIdentity'],
            headerScopedLink && classes['headerLinkRegion'],
          ]
            .filter(Boolean)
            .join(' ')}
          data-record-card-layout={headerScopedLink ? layout : undefined}
        >
          {headerContent}
          {chevron}
        </div>
        {cardFooter}
      </>
    );
  } else if (headerScopedLink) {
    cardContent = (
      <>
        <div
          {...layoutProps}
          className={[classes['headerLinkRegion'], layoutProps.className]
            .filter(Boolean)
            .join(' ')}
        >
          {headerContent}
          {chevron}
        </div>
        {cardFooter}
      </>
    );
  } else {
    cardContent = (
      <>
        {headerContent}
        {cardFooter}
        {chevron}
      </>
    );
  }

  const body = (
    <Card
      {...(!headerScopedLink || compactMediaAside ? layoutProps : {})}
      className={[
        classes['card'],
        (!headerScopedLink || compactMediaAside) && layoutProps.className,
      ]
        .filter(Boolean)
        .join(' ')}
      padding={compactMediaAside ? 0 : cardPadding}
      radius="md"
      withBorder
      data-record-card="true"
    >
      {cardContent}
    </Card>
  );

  return destination === undefined ? (
    body
  ) : (
    <div
      className={classes['linkedCard']}
      data-record-card-link-scope={headerScopedLink ? 'header' : undefined}
    >
      {body}
    </div>
  );
}
