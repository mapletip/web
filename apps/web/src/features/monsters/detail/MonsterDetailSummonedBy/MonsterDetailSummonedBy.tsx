import { Box, Group } from '@mantine/core';
import { EntityChip } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import type { MonsterDetailSummonedByView } from '../project';

import classes from './MonsterDetailSummonedBy.module.css';

export interface MonsterDetailSummonedByProps {
  readonly summonedBy: MonsterDetailSummonedByView;
}

/** Render summoning items as plain, unlinked item chips. */
export function MonsterDetailSummonedBy({
  summonedBy,
}: MonsterDetailSummonedByProps): ReactElement | null {
  if (summonedBy.state === 'absent') return null;

  return (
    <Box
      component="ul"
      className={classes['list']}
      aria-label="Items that summon this monster"
    >
      {summonedBy.entries.map((item) => (
        <Box component="li" className={classes['item']} key={item.key}>
          <Group className={classes['chip']}>
            <EntityChip name={item.name} iconSrc={item.iconUrl} />
          </Group>
        </Box>
      ))}
    </Box>
  );
}
