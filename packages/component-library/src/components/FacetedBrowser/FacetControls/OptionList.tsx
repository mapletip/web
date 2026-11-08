import { Button, Checkbox, Stack } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';

import labelClasses from './FacetLabel.module.css';
import type { FacetOptionWithCount } from './types';

const DEFAULT_VISIBLE_OPTIONS = 3;

export interface OptionListProps {
  readonly label: string;
  readonly options: readonly FacetOptionWithCount[];
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
  /** Number of options shown before "See more". Defaults to 3. */
  readonly limit?: number;
  /** Extra control rendered after the options and before the See more toggle. */
  readonly footer?: ReactNode;
}

/** Collapsible checkbox list shared by rail, drawer and custom filter shells. */
export function OptionList({
  label,
  options,
  value,
  onChange,
  limit = DEFAULT_VISIBLE_OPTIONS,
  footer,
}: OptionListProps): ReactElement {
  const [showAllOptions, setShowAllOptions] = useState(false);
  const collapsible = options.length > limit;
  const visibleOptions =
    collapsible && !showAllOptions ? options.slice(0, limit) : options;

  return (
    // The checkbox group owns only the bucket options. Anything in `footer`
    // (e.g. a standalone Custom checkbox) must stay out of the group, otherwise
    // it joins the group's context-driven value array; See more also lives
    // outside the group so it always renders last.
    <Stack gap="xs">
      <Checkbox.Group
        label={label}
        value={[...value]}
        onChange={(next) => onChange(next)}
        classNames={{ label: labelClasses.label }}
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
      </Checkbox.Group>
      {footer}
      {collapsible ? (
        // Vertical spacing comes from this stack; the toggle carries no margin.
        <Button
          type="button"
          variant="subtle"
          color="maple"
          size="compact-sm"
          px={4}
          aria-expanded={showAllOptions}
          onClick={() => setShowAllOptions((expanded) => !expanded)}
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            width: 'fit-content',
          }}
        >
          {showAllOptions ? 'See less' : 'See more'}
        </Button>
      ) : null}
    </Stack>
  );
}
