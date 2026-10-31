import { Button, Checkbox, Stack } from '@mantine/core';
import type { ReactElement } from 'react';
import { useState } from 'react';

import type { FacetOptionWithCount } from './types';

const DEFAULT_VISIBLE_OPTIONS = 3;

export interface OptionListProps {
  readonly label: string;
  readonly options: readonly FacetOptionWithCount[];
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
  /** Number of options shown before "See more". Defaults to 3. */
  readonly limit?: number;
}

/** Collapsible checkbox list shared by rail, drawer and custom filter shells. */
export function OptionList({
  label,
  options,
  value,
  onChange,
  limit = DEFAULT_VISIBLE_OPTIONS,
}: OptionListProps): ReactElement {
  const [showAllOptions, setShowAllOptions] = useState(false);
  const collapsible = options.length > limit;
  const visibleOptions =
    collapsible && !showAllOptions ? options.slice(0, limit) : options;

  return (
    <Checkbox.Group
      label={label}
      value={[...value]}
      onChange={(next) => onChange(next)}
      styles={{
        label: {
          fontWeight: 600,
          fontSize: 'var(--mantine-font-size-sm)',
          color: 'var(--mantine-color-text)',
          marginBottom: 'var(--mantine-spacing-xs)',
        },
      }}
    >
      <Stack gap="xs" mt="xs">
        {visibleOptions.map((option) => (
          <Checkbox
            key={option.value}
            value={option.value}
            label={
              <span>
                {option.label}{' '}
                <span style={{ color: 'var(--mantine-color-dimmed)' }}>
                  ({option.count})
                </span>
              </span>
            }
          />
        ))}
      </Stack>
      {collapsible ? (
        <Button
          type="button"
          variant="subtle"
          size="compact-sm"
          mt="xs"
          px={4}
          aria-expanded={showAllOptions}
          onClick={() => setShowAllOptions((expanded) => !expanded)}
        >
          {showAllOptions ? 'See less' : 'See more'}
        </Button>
      ) : null}
    </Checkbox.Group>
  );
}
