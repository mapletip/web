import type { ReactElement, ReactNode } from 'react';

import classes from '@/components/EntityChip/EntityChip.module.css';
import type {
  EntityChipDestination,
  EntityChipLinkRenderer,
  EntityChipLinkRenderProps,
  EntityChipProps,
} from '@/components/EntityChip/types';
import { Thumbnail } from '@/components/Thumbnail';

/** Edge length of the chip icon, shared by images and placeholders. */
const ICON_SIZE = 24;

function EntityChipContent({
  name,
  iconSrc,
}: Pick<EntityChipProps, 'name' | 'iconSrc'>): ReactElement {
  return (
    <span className={classes['content']}>
      <Thumbnail src={iconSrc} size={ICON_SIZE} />
      <span className={classes['name']}>{name}</span>
    </span>
  );
}

function renderLink(
  destination: EntityChipDestination,
  linkRenderer: EntityChipLinkRenderer | undefined,
  children: ReactNode,
): ReactNode {
  const props: EntityChipLinkRenderProps = {
    href: destination.href,
    className: classes['link'] ?? '',
    children,
  };

  return linkRenderer ? (
    linkRenderer(destination, props)
  ) : (
    <a href={props.href} className={props.className}>
      {props.children}
    </a>
  );
}

/**
 * A related record shown as an inline chip: a small icon, a name and an optional
 * host control after the name.
 *
 * A destination turns the icon and name into one link. The trailing control is
 * always a sibling of that link, so it remains separately focusable. Without a
 * destination the chip is plain text and adds no tab stop of its own. A record
 * without an icon gets a neutral placeholder of the same size, so names stay
 * aligned in a group.
 */
export function EntityChip({
  name,
  iconSrc,
  destination,
  renderLink: linkRenderer,
  trailing,
}: EntityChipProps): ReactElement {
  const content = <EntityChipContent name={name} iconSrc={iconSrc} />;

  return (
    <span
      className={classes['root']}
      data-linked={destination === undefined ? undefined : 'true'}
    >
      {destination === undefined
        ? content
        : renderLink(destination, linkRenderer, content)}
      {trailing !== undefined && (
        <span className={classes['trailing']}>{trailing}</span>
      )}
    </span>
  );
}
