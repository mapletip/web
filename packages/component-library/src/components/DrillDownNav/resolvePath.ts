import type { DrillDownNode } from './types';

export interface ResolvedDrillDownPath<TMeta = undefined> {
  readonly ancestors: readonly DrillDownNode<TMeta>[];
  readonly current: DrillDownNode<TMeta>;
  readonly children: readonly DrillDownNode<TMeta>[];
}

function findNodePath<TMeta>(
  node: DrillDownNode<TMeta>,
  targetId: string,
  ancestors: readonly DrillDownNode<TMeta>[],
): readonly DrillDownNode<TMeta>[] | null {
  const currentPath = [...ancestors, node];
  if (node.id === targetId) {
    return currentPath;
  }
  if (node.children) {
    for (const child of node.children) {
      const match = findNodePath(child, targetId, currentPath);
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
  const path = findNodePath(root, currentId, []);
  if (!path || path.length === 0) {
    return {
      ancestors: [],
      current: root,
      children: root.children ?? [],
    };
  }

  const current = path[path.length - 1]!;
  return {
    ancestors: path.slice(0, -1),
    current,
    children: current.children ?? [],
  };
}
