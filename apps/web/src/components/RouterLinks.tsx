import { Anchor, Button } from '@mantine/core';
import type { AnchorProps, ButtonProps } from '@mantine/core';
import { createLink } from '@tanstack/react-router';
import type { ComponentPropsWithRef } from 'react';

type AnchorLinkBaseProps = Omit<AnchorProps, 'href'> &
  ComponentPropsWithRef<'a'>;
type ButtonLinkBaseProps = Omit<ButtonProps, 'href'> &
  ComponentPropsWithRef<'a'>;

const AnchorLinkBase = (props: AnchorLinkBaseProps) => (
  <Anchor component="a" {...props} />
);
const ButtonLinkBase = (props: ButtonLinkBaseProps) => (
  <Button component="a" {...props} />
);

export const AnchorLink = createLink(AnchorLinkBase);
export const ButtonLink = createLink(ButtonLinkBase);
