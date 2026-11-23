import { MultiSelect, Pill } from '@mantine/core';
import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';

import { EntityOption } from '@/components/EntityOption';
import type { FacetFilterValue } from '@/components/FacetedBrowser/hooks/filterTypes';

import { FacetContainer } from './FacetContainer';
import classes from './PickerControl.module.css';
import type { FacetOption, FacetPicker } from './types';

export interface PickerControlProps {
  readonly label: string;
  readonly labelContent: ReactNode;
  readonly options: readonly FacetOption[];
  readonly picker: FacetPicker;
  readonly value: FacetFilterValue;
  readonly onChange: (value: FacetFilterValue) => void;
}

/**
 * Searchable multi-select facet for long option lists, built on Mantine
 * `MultiSelect` with `EntityOption` rows (icon, label, secondary line).
 */
export function PickerControl({
  label,
  labelContent,
  options,
  picker,
  value,
  onChange,
}: PickerControlProps): ReactElement {
  const byValue = useMemo(
    () => new Map(options.map((option) => [option.value, option] as const)),
    [options],
  );
  const data = useMemo(
    () =>
      options.map(({ value: optionValue, label: optionLabel }) => ({
        value: optionValue,
        label: optionLabel,
      })),
    [options],
  );
  const selected = Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && byValue.has(entry),
      )
    : [];

  return (
    <FacetContainer label={labelContent}>
      <MultiSelect
        aria-label={label}
        data={data}
        value={selected}
        onChange={(next) => onChange(next.length === 0 ? undefined : next)}
        comboboxProps={{ withinPortal: false }}
        searchable
        clearable
        hidePickedOptions
        maxDropdownHeight={300}
        nothingFoundMessage={picker.nothingFound}
        placeholder={picker.placeholder}
        renderOption={({ option }) => {
          const facetOption = byValue.get(String(option.value));
          return (
            <EntityOption
              icon={facetOption?.icon}
              label={option.label}
              description={facetOption?.description}
            />
          );
        }}
        renderPill={({ option, onRemove, disabled }) => {
          const icon =
            option === undefined
              ? undefined
              : byValue.get(String(option.value))?.icon;
          return (
            <Pill
              className={classes['pill']}
              classNames={{ label: classes['pillLabel'] ?? '' }}
              withRemoveButton={!disabled && onRemove !== undefined}
              title={option?.label}
              {...(onRemove === undefined ? {} : { onRemove })}
              {...(disabled === undefined ? {} : { disabled })}
            >
              <span className={classes['pillContent']}>
                {icon === undefined ? null : (
                  <span aria-hidden="true" className={classes['pillIcon']}>
                    {icon}
                  </span>
                )}
                <span className={classes['pillText']}>{option?.label}</span>
              </span>
            </Pill>
          );
        }}
        size="sm"
      />
    </FacetContainer>
  );
}
