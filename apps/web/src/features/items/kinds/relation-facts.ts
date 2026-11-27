import {
  Thumbnail,
  type RecordCardInlineLabel,
} from '@mapletip/component-library';
import { BookBookmark, Check, Hammer } from '@phosphor-icons/react';
import { createElement, Fragment, type ReactNode } from 'react';

import { resolveMonsterSpriteUrl } from '@/features/monsters/shared/sprite';

import type { ProjectedRelations } from '../browse/relation-projection';

export const questUseLabel: RecordCardInlineLabel = {
  id: 'quests',
  icon: createElement(BookBookmark, { size: 16 }),
  label: 'Required by quests',
  tone: 'brand',
};
export const recipeUseLabel: RecordCardInlineLabel = {
  id: 'recipes',
  icon: createElement(Hammer, { size: 16 }),
  label: 'Used in recipes',
  tone: 'muted',
};
export const notRequiredLabel: RecordCardInlineLabel = {
  id: 'not-required',
  icon: createElement(Check, { size: 16 }),
  label: 'Not required',
  tone: 'success',
};

export function hasQuestUse({
  sourceId,
  count,
  relations,
}: {
  readonly sourceId: string;
  readonly count: number | undefined;
  readonly relations: ProjectedRelations;
}): boolean {
  return (
    (count ?? 0) > 0 &&
    relations['needed-for-quest']?.unestablished?.includes(sourceId) !== true
  );
}

export function dropSourceLine({
  sourceId,
  relations,
}: {
  readonly sourceId: string;
  readonly relations: ProjectedRelations;
}): ReactNode {
  const relation = relations['monster-drop'];
  const monsters = (relation?.byItem[sourceId] ?? []).flatMap((index) => {
    const target = relation?.targets[index];
    return target === undefined ? [] : [target];
  });
  if (monsters.length === 0) return undefined;
  if (monsters.length > 1) return 'Drops from ' + monsters.length + ' monsters';
  const monster = monsters[0];
  if (monster === undefined) return undefined;
  const spriteUrl = resolveMonsterSpriteUrl(monster.spriteContentId);
  return createElement(
    Fragment,
    null,
    'Drops from',
    spriteUrl === undefined
      ? null
      : createElement(Thumbnail, { src: spriteUrl, size: 24 }),
    monster.name +
      (monster.level === undefined ? '' : ', level ' + monster.level),
  );
}
