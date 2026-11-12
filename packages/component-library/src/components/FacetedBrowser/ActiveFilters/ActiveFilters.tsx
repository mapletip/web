import { Button, Group } from '@mantine/core';
import type { ReactElement } from 'react';

import { buildActiveChips } from '@/components/FacetedBrowser/ActiveFilters/facetChips';
import type { FacetDefinition } from '@/components/FacetedBrowser/FacetControls/types';
import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';

import classes from './ActiveFilters.module.css';

/**
 * Active-filter chips plus the global reset. Chip derivation is the existing pure
 * helper; removal and reset are emitted to the host, which owns canonical filter
 * state.
 */
export function ActiveFilters<TRecord extends Record<string, unknown>>({
  facets,
  filters,
  onRemove,
  onClear,
}: {
  readonly facets: readonly FacetDefinition<TRecord>[];
  readonly filters: Readonly<Record<string, FacetFilterValue>>;
  readonly onRemove: (
    chip: ReturnType<typeof buildActiveChips<TRecord>>[number],
  ) => void;
  readonly onClear: () => void;
}): ReactElement | null {
  const chips = buildActiveChips(facets, filters);
  if (chips.length === 0) return null;

  return (
    <Group gap={12} className={classes['activeFilters']}>
      {chips.map((chip) => (
        <Button
          key={chip.key}
          type="button"
          size="compact-sm"
          variant="light"
          color="maple"
          {...(chip.icon === undefined
            ? {}
            : {
                className: classes['activeChip'],
                classNames: { label: classes['chipButtonLabel'] },
                title: chip.label,
                leftSection: (
                  <span className={classes['chipIcon']} aria-hidden="true">
                    {chip.icon}
                  </span>
                ),
              })}
          aria-label={`Remove ${chip.label}`}
          onClick={() => onRemove(chip)}
        >
          {chip.icon === undefined ? (
            <>{chip.label} ×</>
          ) : (
            <>
              <span className={classes['chipLabel']}>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </>
          )}
        </Button>
      ))}
      <Button
        type="button"
        size="compact-sm"
        variant="subtle"
        color="gray"
        onClick={onClear}
      >
        Clear filters
      </Button>
    </Group>
  );
}
