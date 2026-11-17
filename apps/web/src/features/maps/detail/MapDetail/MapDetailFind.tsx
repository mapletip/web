import { ActionIcon, Select } from '@mantine/core';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { useRef, useState, type ReactElement } from 'react';

import type { MapDetailEntityView } from '../project';

import classes from './MapDetail.module.css';

export function MapDetailFind({
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
  const findInputRef = useRef<HTMLInputElement>(null);
  const data = entities.map((entity) => ({
    value: entity.focusKey,
    label: `${entity.name} — ${entity.kindLabel}`,
  }));

  return (
    <div
      className={classes['findShell']}
      data-mobile-find-open={mobileFindOpen ? 'true' : 'false'}
    >
      <ActionIcon
        aria-label={mobileFindOpen ? 'Close map search' : 'Search map'}
        className={classes['findToggle']}
        size="input-sm"
        variant="white"
        onClick={() => setMobileFindOpen((current) => !current)}
      >
        {mobileFindOpen ? (
          <X size={18} aria-hidden="true" />
        ) : (
          <MagnifyingGlass size={18} aria-hidden="true" />
        )}
      </ActionIcon>
      <Select
        className={classes['findField']}
        ref={findInputRef}
        aria-label="Find on this map"
        autoComplete="off"
        data={data}
        searchable
        limit={10}
        nothingFoundMessage="Nothing was found."
        value={null}
        searchValue={findText}
        onSearchChange={(nextFindText) => {
          if (
            nextFindText === '' &&
            document.activeElement !== findInputRef.current
          ) {
            return;
          }
          onFindTextChange(nextFindText);
        }}
        onChange={(focusKey) => {
          if (focusKey !== null) onChoose(focusKey);
        }}
        maxDropdownHeight={360}
        openOnFocus={findText.trim().length > 0}
        placeholder="Monster, NPC, or map"
        leftSection={<MagnifyingGlass size={18} aria-hidden="true" />}
        leftSectionPointerEvents="none"
        comboboxProps={{
          withinPortal: true,
          position: 'bottom-start',
          offset: 6,
          shadow: 'sm',
          zIndex: 1001,
          middlewares: { flip: false, shift: true },
        }}
      />
    </div>
  );
}
