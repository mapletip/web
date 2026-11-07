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
  readonly renderLink?: DrillDownLinkRenderer<TMeta>;
  readonly onNavigate?: () => void;
}
