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
): ReactNode {
  const iconElement = node.icon ? (
    <span className={classes['icon']} aria-hidden="true">
      {node.icon}
    </span>
  ) : null;

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
  onNavigate: (() => void) | undefined,
  renderLink: DrillDownNavProps<TMeta>['renderLink'],
): ReactNode {
  const isCurrent = kind === 'current';
  const rowContent = renderRowContent(node, kind);
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

  return (
    <nav aria-label={label} className={classes['nav']}>
      <ul className={classes['list']}>
        {ancestors.map((node) => (
          <li key={node.id} className={classes['item']}>
            {renderLinkItem(node, 'ancestor', onNavigate, renderLink)}
          </li>
        ))}
        <li key={current.id} className={classes['item']}>
          {renderLinkItem(current, 'current', onNavigate, renderLink)}
        </li>
        {children.map((node) => (
          <li key={node.id} className={classes['item']}>
            {renderLinkItem(node, 'child', onNavigate, renderLink)}
          </li>
        ))}
      </ul>
    </nav>
  );
}
