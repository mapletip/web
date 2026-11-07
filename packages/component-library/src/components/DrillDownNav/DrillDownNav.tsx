import type { ReactElement, ReactNode } from 'react';

import classes from './DrillDownNav.module.css';
import { resolveDrillDownPath } from './resolvePath';
import type {
  DrillDownLinkRenderProps,
  DrillDownNavProps,
  DrillDownNode,
} from './types';

type RowKind = 'ancestor' | 'current' | 'child';

function renderRowContent<TMeta>(
  node: DrillDownNode<TMeta>,
  kind: RowKind,
  reserveIconSlot: boolean,
): ReactNode {
  let iconElement: ReactNode = null;
  if (node.icon) {
    iconElement = (
      <span className={classes['icon']} aria-hidden="true">
        {node.icon}
      </span>
    );
  } else if (reserveIconSlot) {
    iconElement = <span className={classes['iconSlot']} aria-hidden="true" />;
  }

  if (kind === 'ancestor') {
    return (
      <span className={classes['rowContent']}>
        <span className={classes['backArrow']} aria-hidden="true">
          ←
        </span>{' '}
        {iconElement}
        <span className={classes['label']}>{node.label}</span>
      </span>
    );
  }

  let countElement: ReactNode = null;
  if (node.count !== undefined) {
    const isZero = node.count === 0;
    countElement = (
      <span className={isZero ? classes['countDimmed'] : classes['count']}>
        {node.count}
      </span>
    );
  }

  return (
    <span className={classes['rowContent']}>
      {iconElement}
      <span className={classes['label']}>{node.label}</span>
      {countElement}
    </span>
  );
}

function getRowKindClass(kind: RowKind): string {
  if (kind === 'ancestor') {
    return classes['ancestorRow'] ?? '';
  }
  if (kind === 'current') {
    return classes['currentRow'] ?? '';
  }
  return classes['childRow'] ?? '';
}

function renderLinkItem<TMeta>(
  node: DrillDownNode<TMeta>,
  kind: RowKind,
  reserveIconSlot: boolean,
  onNavigate: (() => void) | undefined,
  renderLink: DrillDownNavProps<TMeta>['renderLink'],
): ReactNode {
  const isCurrent = kind === 'current';
  const rowContent = renderRowContent(node, kind, reserveIconSlot);
  const kindClass = getRowKindClass(kind);
  const className = `${classes['row']} ${kindClass}`.trim();

  const props: DrillDownLinkRenderProps = {
    href: node.href,
    className,
    'aria-current': isCurrent ? 'page' : undefined,
    onClick: onNavigate,
    children: rowContent,
  };

  if (renderLink) {
    return renderLink(node, props);
  }

  return (
    <a
      href={props.href}
      className={props.className}
      aria-current={props['aria-current']}
      onClick={props.onClick}
    >
      {props.children}
    </a>
  );
}

export function DrillDownNav<TMeta = undefined>({
  root,
  currentId,
  label,
  hideEmpty = false,
  renderLink,
  onNavigate,
}: DrillDownNavProps<TMeta>): ReactElement {
  const { ancestors, current, children } = resolveDrillDownPath(
    root,
    currentId,
    { hideEmpty },
  );

  const ancestorsHaveIcon = ancestors.some((node) => Boolean(node.icon));
  const childrenHaveIcon = children.some((node) => Boolean(node.icon));

  return (
    <nav aria-label={label} className={classes['nav']}>
      <ul className={classes['list']}>
        {ancestors.map((node) => (
          <li key={node.id} className={classes['item']}>
            {renderLinkItem(
              node,
              'ancestor',
              ancestorsHaveIcon,
              onNavigate,
              renderLink,
            )}
          </li>
        ))}
        <li key={current.id} className={classes['item']}>
          {renderLinkItem(current, 'current', false, onNavigate, renderLink)}
        </li>
        {children.map((node) => (
          <li key={node.id} className={classes['item']}>
            {renderLinkItem(
              node,
              'child',
              childrenHaveIcon,
              onNavigate,
              renderLink,
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
