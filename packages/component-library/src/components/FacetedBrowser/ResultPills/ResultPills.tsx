import { Chip, Scroller } from '@mantine/core';
import type { ReactElement } from 'react';

import type { FacetDefinition } from '@/components/FacetedBrowser/FacetControls/types';

import classes from './ResultPills.module.css';

interface ResultPillsProps<TRecord extends Record<string, unknown>> {
  readonly facet: FacetDefinition<TRecord>;
  readonly selected: readonly string[];
  readonly counts: ReadonlyMap<string, number>;
  readonly allCount: number;
  readonly onChange: (value: readonly string[]) => void;
}

/** Chip value of the all choice; facet values are never empty. */
const ALL = '';

export function ResultPills<TRecord extends Record<string, unknown>>({
  facet,
  selected,
  counts,
  allCount,
  onChange,
}: ResultPillsProps<TRecord>): ReactElement {
  const chosen = selected[0];
  return (
    <fieldset className={classes['group']}>
      <legend className={classes['legend']}>{facet.label}</legend>
      <Scroller
        role="region"
        aria-label={`${facet.label} choices`}
        classNames={{ content: classes['content'] }}
      >
        <Chip.Group
          value={chosen ?? ALL}
          onChange={(value) => onChange(value === ALL ? [] : [value])}
        >
          <Chip value={ALL} size="sm" variant="light">
            All ({allCount})
          </Chip>
          {facet.options?.map((option) => {
            const count = counts.get(option.value) ?? 0;
            if (count === 0 && chosen !== option.value) return null;
            return (
              <Chip
                key={option.value}
                value={option.value}
                size="sm"
                variant="light"
              >
                {option.label} ({count})
              </Chip>
            );
          })}
        </Chip.Group>
      </Scroller>
    </fieldset>
  );
}
