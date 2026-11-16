import { useRouteOverlay } from '@/features/route-overlay/useRouteOverlay';

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

/** The Monster Detail Locations Drawer uses the shared same-URL overlay entry. */
export function useMonsterDetailOverlay() {
  return useRouteOverlay<MonsterDetailOverlay>({
    stateKey: 'monsterDetailOverlay',
    parse: parseMonsterDetailOverlay,
    same: sameOverlay,
  });
}
