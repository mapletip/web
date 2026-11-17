import { Anchor } from '@mantine/core';
import type { AnchorProps } from '@mantine/core';
import type { RecordCardLinkRenderer } from '@mapletip/component-library';
import { createLink } from '@tanstack/react-router';
import type {
  FileRoutesByPath,
  LinkOptions,
  RegisteredRouter,
} from '@tanstack/react-router';
import type { ComponentPropsWithRef, ComponentType, ReactNode } from 'react';

type AnchorLinkBaseProps = Omit<AnchorProps, 'href'> &
  ComponentPropsWithRef<'a'>;

const AnchorLinkBase = (props: AnchorLinkBaseProps) => (
  <Anchor component="a" {...props} />
);

export const AnchorLink = createLink(AnchorLinkBase);

// TanStack's Link props cannot be expressed generically over `to`.
const RecordCardAnchorLink = AnchorLink as unknown as ComponentType<{
  readonly to: string;
  readonly params: unknown;
  readonly className: string;
  readonly children?: ReactNode;
}>;

/** Adapt a router destination to the link renderer expected by RecordCard. */
export function createRecordCardLinkRenderer<
  const TTo extends keyof FileRoutesByPath,
>({
  to,
  params,
}: {
  readonly to: TTo;
  readonly params: LinkOptions<RegisteredRouter, string, TTo>['params'];
}): RecordCardLinkRenderer {
  return (_destination, props) => (
    <RecordCardAnchorLink to={to} params={params} className={props.className}>
      {props.children}
    </RecordCardAnchorLink>
  );
}
