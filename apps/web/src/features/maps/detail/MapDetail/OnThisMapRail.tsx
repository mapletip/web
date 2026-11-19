import { Box, Text, UnstyledButton } from '@mantine/core';
import { Ghost, MapPin, Signpost, UsersThree } from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import {
  isMapDetailOnThisMapRowSelected,
  type MapDetailFocus,
  type MapDetailFocusKind,
} from '../focus';
import type { MapDetailOnThisMapRowView } from '../project';

import classes from './MapDetail.module.css';

function rowIcon({
  row,
}: {
  readonly row: MapDetailOnThisMapRowView;
}): ReactElement {
  switch (row.key) {
    case 'connections':
      return <Signpost size={16} aria-hidden="true" />;
    case 'monsters':
      return <Ghost size={16} aria-hidden="true" />;
    case 'spawns':
      return <MapPin size={16} aria-hidden="true" />;
    case 'npcs':
      return <UsersThree size={16} aria-hidden="true" />;
  }
}

export function OnThisMapRail({
  rows,
  focus,
  onToggle,
}: {
  readonly rows: readonly MapDetailOnThisMapRowView[];
  readonly focus: MapDetailFocus | undefined;
  readonly onToggle: (kind: MapDetailFocusKind) => void;
}): ReactElement {
  return (
    <Box
      component="section"
      className={classes['onThisMap']}
      aria-labelledby="on-this-map-heading"
    >
      <Text
        id="on-this-map-heading"
        component="h2"
        className={classes['onThisMapHeading']}
        fw={600}
      >
        On this map
      </Text>
      <Box component="ul" className={classes['onThisMapRows']}>
        {rows.map((row) => {
          const selected = isMapDetailOnThisMapRowSelected({ focus, row });
          const content = (
            <>
              <span className={classes['onThisMapIcon']} aria-hidden="true">
                {rowIcon({ row })}
              </span>
              <span className={classes['onThisMapLabel']}>{row.label}</span>
              <span className={classes['onThisMapCount']}>
                {row.countLabel}
              </span>
            </>
          );

          return (
            <Box
              component="li"
              className={classes['onThisMapRow']}
              key={row.key}
              data-map-summary-row={
                row.key === 'spawns' ? 'monster-spawns' : row.key
              }
            >
              {'focus' in row ? (
                <UnstyledButton
                  className={classes['onThisMapAction']}
                  type="button"
                  aria-label={row.accessibleName}
                  aria-pressed={selected}
                  data-selected={selected ? 'true' : undefined}
                  disabled={row.disabled}
                  onClick={() => onToggle(row.focus)}
                >
                  {content}
                </UnstyledButton>
              ) : (
                <div className={classes['onThisMapStatic']}>{content}</div>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
