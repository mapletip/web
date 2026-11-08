import { Anchor } from '@mantine/core';
import type { AnchorProps } from '@mantine/core';
import { createLink } from '@tanstack/react-router';
import type { ComponentPropsWithRef } from 'react';

type AnchorLinkBaseProps = Omit<AnchorProps, 'href'> &
  ComponentPropsWithRef<'a'>;

const AnchorLinkBase = (props: AnchorLinkBaseProps) => (
  <Anchor component="a" {...props} />
);

export const AnchorLink = createLink(AnchorLinkBase);
