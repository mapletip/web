import { BUILDS, type BuildId } from '@/config/maplekit';
import { browsePageMetadata } from '@/features/browse/metadata';
import { buildCollectionPath } from '@/features/detail';

/** Monster-owned page copy for one supported build. */
export function monsterPageMetadata(buildId: BuildId): {
  readonly title: string;
  readonly description: string;
} {
  const { title, description } = browsePageMetadata({
    buildId,
    topic: 'Monsters',
    path: buildCollectionPath('monsters', buildId),
    description: `Browse ${BUILDS[buildId].label} monsters in MapleStory. Compare levels, HP, EXP, attack, defense, and other stats.`,
  });
  return { title, description };
}
