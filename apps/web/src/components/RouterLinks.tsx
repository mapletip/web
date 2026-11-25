import { Anchor } from '@mantine/core';
import type { AnchorProps } from '@mantine/core';
import type { RecordCardLinkRenderer } from '@mapletip/component-library';
import { createLink, defaultParseSearch } from '@tanstack/react-router';
import type { ComponentPropsWithRef } from 'react';

type AnchorLinkBaseProps = Omit<AnchorProps, 'href'> &
  ComponentPropsWithRef<'a'>;

const AnchorLinkBase = (props: AnchorLinkBaseProps) => (
  <Anchor component="a" {...props} />
);

export const AnchorLink = createLink(AnchorLinkBase);

/** Adapt a record card's canonical href to the host router link. */
function createRecordCardLinkRenderer(preload?: false): RecordCardLinkRenderer {
  return (destination, props) => {
    const url = new URL(destination.href, 'https://mapletip.com');
    return (
      <AnchorLink
        to={url.pathname}
        search={defaultParseSearch(url.search)}
        hash={url.hash.slice(1)}
        className={props.className}
        {...(preload === undefined ? {} : { preload })}
      >
        {props.children}
      </AnchorLink>
    );
  };
}

export const recordCardLinkRenderer = createRecordCardLinkRenderer();
export const recordCardLinkRendererWithoutPreload =
  createRecordCardLinkRenderer(false);
