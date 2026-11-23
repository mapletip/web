import { ActionIcon, Combobox, TextInput, useCombobox } from '@mantine/core';
import { EntityOption } from '@mapletip/component-library';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { useState, type ReactElement } from 'react';

import type { MapDetailEntityView } from '../project';

import classes from './MapDetail.module.css';
import { EntityIcon } from './markers';

export function FindCombobox({
  entities,
  findText,
  onFindTextChange,
  onChoose,
}: {
  readonly entities: readonly MapDetailEntityView[];
  readonly findText: string;
  readonly onFindTextChange: (findText: string) => void;
  readonly onChoose: (focusKey: string) => void;
}): ReactElement {
  const [mobileFindOpen, setMobileFindOpen] = useState(false);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const normalizedFindText = findText.trim().toLocaleLowerCase('en');
  const matches = entities
    .filter(({ name }) =>
      name.toLocaleLowerCase('en').includes(normalizedFindText),
    )
    .slice(0, 10);

  return (
    <div
      className={classes['findShell']}
      data-mobile-find-open={mobileFindOpen ? 'true' : 'false'}
    >
      <ActionIcon
        aria-label={mobileFindOpen ? 'Close map search' : 'Search map'}
        className={classes['findToggle']}
        size="md"
        variant="default"
        onClick={() => setMobileFindOpen((current) => !current)}
      >
        {mobileFindOpen ? (
          <X size={16} aria-hidden="true" />
        ) : (
          <MagnifyingGlass size={16} aria-hidden="true" />
        )}
      </ActionIcon>
      <div className={classes['findField']}>
        <Combobox
          store={combobox}
          onOptionSubmit={(focusKey) => {
            onChoose(focusKey);
            combobox.closeDropdown();
          }}
          withinPortal
          position="bottom-start"
          offset={6}
          shadow="sm"
          middlewares={{ flip: false, shift: true }}
        >
          <Combobox.Target withExpandedAttribute>
            <TextInput
              role="combobox"
              aria-label="Find on this map"
              autoComplete="off"
              value={findText}
              onChange={(event) => {
                const nextFindText = event.currentTarget.value;
                onFindTextChange(nextFindText);
                if (nextFindText.trim() === '') combobox.closeDropdown();
                else combobox.openDropdown();
                combobox.updateSelectedOptionIndex();
              }}
              onFocus={() => {
                if (findText.trim() !== '') combobox.openDropdown();
              }}
              onClick={() => {
                if (findText.trim() !== '') combobox.openDropdown();
              }}
              placeholder="Monster, NPC, or map"
              size="xs"
              leftSection={<MagnifyingGlass size={16} aria-hidden="true" />}
              leftSectionPointerEvents="none"
            />
          </Combobox.Target>
          <Combobox.Dropdown>
            <Combobox.Options mah={360} style={{ overflowY: 'auto' }}>
              {matches.length === 0 ? (
                <Combobox.Empty>Nothing was found.</Combobox.Empty>
              ) : (
                matches.map((entity) => (
                  <Combobox.Option
                    key={entity.focusKey}
                    value={entity.focusKey}
                    aria-label={`${entity.name}, ${entity.kindLabel}`}
                  >
                    <EntityOption
                      icon={<EntityIcon entity={entity} />}
                      label={entity.name}
                      description={entity.kindLabel}
                    />
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
      </div>
    </div>
  );
}
