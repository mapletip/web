import type { DrillDownNode } from './types';

export interface ResolvedDrillDownPath<TMeta = undefined> {
  readonly ancestors: readonly DrillDownNode<TMeta>[];
  readonly current: DrillDownNode<TMeta>;
  readonly children: readonly DrillDownNode<TMeta>[];
}

export interface ResolveDrillDownPathOptions<TMeta = undefined> {
  readonly root: DrillDownNode<TMeta>;
  readonly currentId: string;
  readonly hideEmpty?: boolean | undefined;
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
 */
export function resolveDrillDownPath<TMeta = undefined>({
  root,
  currentId,
  hideEmpty = false,
}: ResolveDrillDownPathOptions<TMeta>): ResolvedDrillDownPath<TMeta> {
  const match = findNode(root, currentId, []);
  const current = match ? match.current : root;
  const ancestors = match ? match.ancestors : [];
  const rawChildren = current.children ?? [];

  const children = hideEmpty
    ? rawChildren.filter((child) => child.count !== 0)
    : rawChildren;

  return {
    ancestors,
    current,
    children,
  };
}
