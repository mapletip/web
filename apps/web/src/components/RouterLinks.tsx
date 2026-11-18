import { Anchor } from '@mantine/core';
import type { AnchorProps } from '@mantine/core';
import type { RecordCardLinkRenderer } from '@mapletip/component-library';
import { createLink } from '@tanstack/react-router';
import type { ComponentPropsWithRef } from 'react';

type AnchorLinkBaseProps = Omit<AnchorProps, 'href'> &
  ComponentPropsWithRef<'a'>;

const AnchorLinkBase = (props: AnchorLinkBaseProps) => (
  <Anchor component="a" {...props} />
);

export const AnchorLink = createLink(AnchorLinkBase);

/** Adapt a record card's canonical href to the host router link. */
export const recordCardLinkRenderer: RecordCardLinkRenderer = (
  destination,
  props,
) => (
  <AnchorLink to={destination.href} className={props.className}>
    {props.children}
  </AnchorLink>
);
