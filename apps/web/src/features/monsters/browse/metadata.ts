import { BUILDS, type BuildId } from '@/config/maplekit';

/** Monster-owned page copy for one supported build. */
export function monsterPageMetadata(buildId: BuildId): {
  readonly title: string;
  readonly description: string;
} {
  const { label } = BUILDS[buildId];
  return {
    title: `MapleStory ${label} Monsters – MapleTip`,
    description: `Browse ${label} monsters in MapleStory. Compare levels, HP, EXP, attack, defense, and other stats.`,
  };
}
