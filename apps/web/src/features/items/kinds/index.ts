import { boxes } from './boxes';
import { cashShop } from './cash-shop';
import { chairs } from './chairs';
import { furniture } from './furniture';
import { monsterCards } from './monster-cards';
import { monsterDrops } from './monster-drops';
import { oresAndGems } from './ores-and-gems';
import { ornaments } from './ornaments';
import { otherEtc } from './other-etc';
import { otherSetup } from './other-setup';
import { otherUse } from './other-use';
import { petFood } from './pet-food';
import { pets } from './pets';
import { potionsAndFood } from './potions-and-food';
import { questItems } from './quest-items';
import { scrolls } from './scrolls';
import { skillBooks } from './skill-books';
import { starsAndArrows } from './stars-and-arrows';
import { summoningSacks } from './summoning-sacks';

export const ITEM_KINDS = [
  pets,
  petFood,
  cashShop,
  chairs,
  furniture,
  ornaments,
  otherSetup,
  oresAndGems,
  monsterDrops,
  questItems,
  otherEtc,
  scrolls,
  starsAndArrows,
  monsterCards,
  skillBooks,
  summoningSacks,
  boxes,
  potionsAndFood,
  otherUse,
] as const;

export function assignItemKind({
  row,
}: {
  readonly row: Parameters<(typeof ITEM_KINDS)[number]['matches']>[0];
}) {
  return ITEM_KINDS.find((kind) => kind.matches(row));
}
