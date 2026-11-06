import { BUILDS, type BuildId } from '@/config/maplekit';

/** Monster-owned page copy for one supported build. */
export function monsterPageMetadata(buildId: BuildId): {
  readonly title: string;
  readonly description: string;
} {
  const { label } = BUILDS[buildId];
  return {
    title: `${label} monsters — MapleTip`,
    description: `Browse every ${label} monster in the verified MapleKit release, with authoritative stats and honest unknown states.`,
  };
}
