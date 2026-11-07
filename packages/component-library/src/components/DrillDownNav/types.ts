import type { ReactNode } from 'react';

export interface DrillDownNode<TMeta = undefined> {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly icon?: ReactNode;
  readonly count?: number;
  readonly meta?: TMeta;
  readonly children?: readonly DrillDownNode<TMeta>[];
}

export interface DrillDownLinkRenderProps {
  readonly href: string;
  readonly className: string;
  readonly 'aria-current': 'page' | undefined;
  readonly onClick: (() => void) | undefined;
  readonly children: ReactNode;
}

export type DrillDownLinkRenderer<TMeta = undefined> = (
  node: DrillDownNode<TMeta>,
  props: DrillDownLinkRenderProps,
) => ReactNode;

export interface DrillDownNavProps<TMeta = undefined> {
  readonly root: DrillDownNode<TMeta>;
  readonly currentId: string;
  readonly label: string;
  /**
   * When true, direct child links whose count === 0 are omitted.
   * The current node and ancestor back links are never omitted even when count === 0.
   * Nodes with undefined count are never omitted.
   * @default false
   */
  readonly hideEmpty?: boolean | undefined;
  readonly renderLink?: DrillDownLinkRenderer<TMeta> | undefined;
  readonly onNavigate?: (() => void) | undefined;
}
