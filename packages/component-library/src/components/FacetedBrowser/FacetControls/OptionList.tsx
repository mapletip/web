import { Button, Checkbox, Stack, Text } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';
import { Fragment, useState } from 'react';

import { FacetContainer } from './FacetContainer';
import type { FacetOptionWithCount } from './types';

const DEFAULT_VISIBLE_OPTIONS = 3;

function renderOption(
  option: FacetOptionWithCount,
  checked: boolean,
  onChange: (checked: boolean) => void,
): ReactElement {
  return (
    <Checkbox
      key={option.value}
      value={option.value}
      checked={checked}
      label={
        <span>
          {option.label}{' '}
          <span style={{ color: 'var(--mantine-color-dimmed)' }}>
            ({option.count})
          </span>
        </span>
      }
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
  );
}

export interface OptionListProps {
  readonly label: ReactNode;
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
    <FacetContainer label={label}>
      {(labelId) => (
        <>
          <Stack gap="xs" role="group" aria-labelledby={labelId}>
            {visibleOptions.map((option, index) => {
              const previousGroup = visibleOptions[index - 1]?.group;
              const showGroupHeading =
                option.group !== undefined && option.group !== previousGroup;
              return (
                <Fragment key={option.value}>
                  {showGroupHeading && (
                    <Text size="xs" fw={600} c="dimmed">
                      {option.group}
                    </Text>
                  )}
                  {renderOption(
                    option,
                    value.includes(option.value),
                    (checked) => {
                      const next = checked
                        ? [...value, option.value]
                        : value.filter((entry) => entry !== option.value);
                      onChange(next);
                    },
                  )}
                </Fragment>
              );
            })}
          </Stack>
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
        </>
      )}
    </FacetContainer>
  );
}
