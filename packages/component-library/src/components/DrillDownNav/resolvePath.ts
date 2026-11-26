import type { DrillDownNode } from './types';

export interface ResolvedDrillDownPath<TMeta = undefined> {
  readonly ancestors: readonly DrillDownNode<TMeta>[];
  readonly current: DrillDownNode<TMeta>;
  readonly children: readonly DrillDownNode<TMeta>[];
  readonly siblings: readonly DrillDownNode<TMeta>[];
}

export interface ResolveDrillDownPathOptions<TMeta = undefined> {
  readonly root: DrillDownNode<TMeta>;
  readonly currentId: string;
  readonly hideEmpty?: boolean | undefined;
  readonly showSiblings?: boolean | undefined;
}

interface FoundPath<TMeta> {
  readonly ancestors: readonly DrillDownNode<TMeta>[];
  readonly current: DrillDownNode<TMeta>;
}

function findNode<TMeta>(
  node: DrillDownNode<TMeta>,
  targetId: string,
  ancestors: readonly DrillDownNode<TMeta>[],
): FoundPath<TMeta> | null {
  if (node.id === targetId) {
    return { ancestors, current: node };
  }
  if (node.children) {
    const nextAncestors = [...ancestors, node];
    for (const child of node.children) {
      const match = findNode(child, targetId, nextAncestors);
      if (match) {
        return match;
      }
    }
  }
  return null;
}

/**
 * Pure function that resolves ancestors, current node, and direct children
 * from a tree root and a target currentId.
 * If targetId is not found in the tree, root is treated as current.
 * When hideEmpty is true, child rows whose count === 0 are omitted.
 * The current node and ancestors are never omitted. Nodes with count undefined are never hidden.
 * When showSiblings is true and there are no visible children, siblings include
 * the current node in parent order, even when its count is zero.
 */
export function resolveDrillDownPath<TMeta = undefined>({
  root,
  currentId,
  hideEmpty = false,
  showSiblings = false,
}: ResolveDrillDownPathOptions<TMeta>): ResolvedDrillDownPath<TMeta> {
  const match = findNode(root, currentId, []);
  const current = match ? match.current : root;
  const ancestors = match ? match.ancestors : [];
  const rawChildren = current.children ?? [];

  const children = hideEmpty
    ? rawChildren.filter((child) => child.count !== 0)
    : rawChildren;
  const parent = ancestors.at(-1);
  const siblings =
    showSiblings && children.length === 0 && parent
      ? (parent.children ?? []).filter(
          (node) => !hideEmpty || node.count !== 0 || node.id === current.id,
        )
      : [];

  return {
    ancestors,
    current,
    children,
    siblings,
  };
}
