import type { DrillDownNode } from './types';

export interface ResolvedDrillDownPath<TMeta = undefined> {
  readonly ancestors: readonly DrillDownNode<TMeta>[];
  readonly current: DrillDownNode<TMeta>;
  readonly children: readonly DrillDownNode<TMeta>[];
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
 */
export function resolveDrillDownPath<TMeta = undefined>(
  root: DrillDownNode<TMeta>,
  currentId: string,
): ResolvedDrillDownPath<TMeta> {
  const match = findNode(root, currentId, []);
  if (!match) {
    return {
      ancestors: [],
      current: root,
      children: root.children ?? [],
    };
  }

  return {
    ancestors: match.ancestors,
    current: match.current,
    children: match.current.children ?? [],
  };
}
