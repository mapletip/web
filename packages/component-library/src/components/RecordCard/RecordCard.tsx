import { Card, Group, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { CaretRight } from '@phosphor-icons/react';
import type { ReactElement, ReactNode } from 'react';

import classes from '@/components/RecordCard/RecordCard.module.css';
import { RecordFacts } from '@/components/RecordCard/RecordFacts';
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

interface RenderTitleControlOptions {
  readonly destination: RecordCardDestination | undefined;
  readonly linkRenderer: RecordCardLinkRenderer | undefined;
  readonly children: ReactNode;
  readonly action: (() => void) | undefined;
  readonly isDetailsOpen: boolean | undefined;
}

function renderTitleControl({
  destination,
  linkRenderer,
  children,
  action,
  isDetailsOpen,
}: RenderTitleControlOptions): ReactNode {
  if (action !== undefined) {
    return (
      <UnstyledButton
        className={classes['action']}
        onClick={action}
        aria-haspopup="dialog"
        aria-expanded={isDetailsOpen ?? false}
      >
        {children}
      </UnstyledButton>
    );
  }
  if (destination !== undefined) {
    return renderLink({ destination, linkRenderer, children });
  }
  return children;
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
  secondaryLineClamp,
  leadLine,
  badges,
  media,
  footer,
  destination,
  action,
  isDetailsOpen,
  facts,
  renderLink: linkRenderer,
  linkScope = 'card',
}: RecordCardProps): ReactElement {
  if (layout === 'picture') {
    const titleControl = renderTitleControl({
      destination,
      linkRenderer,
      children: title,
      action,
      isDetailsOpen,
    });
    return (
      <div className={classes['linkedCard']}>
        <Card
          className={`${classes['card']} ${classes['pictureCard']}`}
          padding={0}
          radius="md"
          withBorder
          data-record-card="true"
          data-record-card-layout="picture"
          data-details-open={isDetailsOpen ? 'true' : undefined}
        >
          <Card.Section className={classes['pictureMedia']}>
            {media}
          </Card.Section>
          <div className={classes['pictureText']}>
            <Title order={3} className={classes['pictureTitle']}>
              {titleControl}
            </Title>
            {leadLine === undefined ? null : (
              <Text className={classes['pictureLead']}>{leadLine}</Text>
            )}
            {secondaryLine === undefined ? null : (
              <Text
                className={classes['pictureSecondary']}
                {...(secondaryLineClamp === undefined
                  ? {}
                  : { lineClamp: secondaryLineClamp })}
              >
                {secondaryLine}
              </Text>
            )}
            {badges === undefined ? null : (
              <div className={classes['badges']}>{badges}</div>
            )}
            {footer === undefined ? null : (
              <div className={classes['footer']}>{footer}</div>
            )}
          </div>
        </Card>
      </div>
    );
  }
  if (layout === 'identity') {
    const titleControl = renderTitleControl({
      destination,
      linkRenderer,
      children: title,
      action,
      isDetailsOpen,
    });
    return (
      <div className={classes['linkedCard']}>
        <Card
          className={`${classes['card']} ${classes['identityCard']}`}
          padding={0}
          radius="md"
          withBorder
          data-record-card="true"
          data-record-card-layout="identity"
          data-details-open={isDetailsOpen ? 'true' : undefined}
        >
          <Card.Section className={classes['identityHeader']}>
            {media === undefined ? null : (
              <div className={classes['identityMedia']}>{media}</div>
            )}
            <div className={classes['identityText']}>
              <Title order={3} className={classes['identityTitle']}>
                {titleControl}
              </Title>
              {leadLine === undefined ? null : (
                <Text className={classes['identityLead']}>{leadLine}</Text>
              )}
              {badges === undefined ? null : (
                <div className={classes['badges']}>{badges}</div>
              )}
            </div>
          </Card.Section>
          {facts === undefined ? null : <RecordFacts facts={facts} />}
        </Card>
      </div>
    );
  }
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
            {renderTitleControl({
              destination,
              linkRenderer,
              children: title,
              action,
              isDetailsOpen,
            })}
          </Title>
          {badges === undefined ? null : (
            <div className={classes['badges']}>{badges}</div>
          )}
        </Group>
        {secondaryLine === undefined ? null : (
          <Text
            className={classes['secondary']}
            size="sm"
            c="dimmed"
            {...(secondaryLineClamp === undefined
              ? {}
              : { lineClamp: secondaryLineClamp })}
          >
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

  return destination === undefined && action === undefined ? (
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
