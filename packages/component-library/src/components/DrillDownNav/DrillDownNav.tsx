import type { ReactElement, ReactNode } from 'react';

import classes from './DrillDownNav.module.css';
import { resolveDrillDownPath } from './resolvePath';
import type {
  DrillDownLinkRenderProps,
  DrillDownNavProps,
  DrillDownNode,
  DrillDownSelectHandler,
} from './types';

type RowKind = 'ancestor' | 'current' | 'child';

function isLeafNode<TMeta>(
  node: DrillDownNode<TMeta>,
  hideEmpty: boolean,
): boolean {
  const rawChildren = node.children ?? [];
  const visibleChildren = hideEmpty
    ? rawChildren.filter((child) => child.count !== 0)
    : rawChildren;
  return visibleChildren.length === 0;
}

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

interface RenderLinkItemOptions<TMeta> {
  readonly node: DrillDownNode<TMeta>;
  readonly kind: RowKind;
  readonly reserveIconSlot: boolean;
  readonly onNavigate?: (() => void) | undefined;
  readonly renderLink?: DrillDownNavProps<TMeta>['renderLink'];
}

function renderLinkItem<TMeta>({
  node,
  kind,
  reserveIconSlot,
  onNavigate,
  renderLink,
}: RenderLinkItemOptions<TMeta>): ReactNode {
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

interface RenderButtonItemOptions<TMeta> {
  readonly node: DrillDownNode<TMeta>;
  readonly kind: RowKind;
  readonly reserveIconSlot: boolean;
  readonly hideEmpty: boolean;
  readonly onSelect: DrillDownSelectHandler<TMeta>;
}

function renderButtonItem<TMeta>({
  node,
  kind,
  reserveIconSlot,
  hideEmpty,
  onSelect,
}: RenderButtonItemOptions<TMeta>): ReactNode {
  const isCurrent = kind === 'current';
  const rowContent = renderRowContent(node, kind, reserveIconSlot);
  const kindClass = getRowKindClass(kind);
  const className = `${classes['row']} ${kindClass}`.trim();
  const isLeaf = isLeafNode(node, hideEmpty);

  return (
    <button
      type="button"
      className={className}
      aria-current={isCurrent ? 'true' : undefined}
      onClick={() => onSelect(node, { isLeaf })}
    >
      {rowContent}
    </button>
  );
}

export function DrillDownNav<TMeta = undefined>({
  root,
  currentId,
  label,
  hideEmpty = false,
  renderLink,
  onNavigate,
  onSelect,
}: DrillDownNavProps<TMeta>): ReactElement {
  const { ancestors, current, children } = resolveDrillDownPath(
    root,
    currentId,
    { hideEmpty },
  );

  const ancestorsHaveIcon = ancestors.some((node) => Boolean(node.icon));
  const childrenHaveIcon = children.some((node) => Boolean(node.icon));

  const renderItem = (
    node: DrillDownNode<TMeta>,
    kind: RowKind,
    reserveIconSlot: boolean,
  ) => {
    if (onSelect) {
      return renderButtonItem({
        node,
        kind,
        reserveIconSlot,
        hideEmpty,
        onSelect,
      });
    }
    return renderLinkItem({
      node,
      kind,
      reserveIconSlot,
      onNavigate,
      renderLink,
    });
  };

  return (
    <nav aria-label={label} className={classes['nav']}>
      <ul className={classes['list']}>
        {ancestors.map((node) => (
          <li key={node.id} className={classes['item']}>
            {renderItem(node, 'ancestor', ancestorsHaveIcon)}
          </li>
        ))}
        <li key={current.id} className={classes['item']}>
          {renderItem(current, 'current', false)}
        </li>
        {children.map((node) => (
          <li key={node.id} className={classes['item']}>
            {renderItem(node, 'child', childrenHaveIcon)}
          </li>
        ))}
      </ul>
    </nav>
  );
}
