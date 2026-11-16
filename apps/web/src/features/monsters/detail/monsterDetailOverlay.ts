import type { RouteOverlayOptions } from '@/features/route-overlay/useRouteOverlay';

interface MonsterDetailOverlay {
  readonly type: 'locations';
}

function parseMonsterDetailOverlay(
  value: unknown,
): MonsterDetailOverlay | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  return (value as { readonly type?: unknown }).type === 'locations'
    ? { type: 'locations' }
    : undefined;
}

function sameOverlay(
  left: MonsterDetailOverlay | undefined,
  right: MonsterDetailOverlay,
): boolean {
  return left?.type === right.type;
}

/** Monster Detail's location drawer state for the shared route controller. */
export const monsterDetailOverlayOptions: RouteOverlayOptions<MonsterDetailOverlay> =
  {
    stateKey: 'monsterDetailOverlay',
    parse: parseMonsterDetailOverlay,
    same: sameOverlay,
  };
