import { Chip, ScrollArea, Tabs } from '@mantine/core';
import { useState, type MouseEvent, type ReactElement } from 'react';

import { isMapDetailEntityFocused, type MapDetailFocus } from '../focus';
import type { MapDetailEntityView } from '../project';

import classes from './MapDetail.module.css';
import { EntityIcon } from './markers';

const legendKinds = [
  { value: 'connection', label: 'Connections' },
  { value: 'warp', label: 'Warps' },
  { value: 'monster', label: 'Monsters' },
  { value: 'npc', label: 'NPCs' },
] as const satisfies readonly {
  readonly value: MapDetailEntityView['kind'];
  readonly label: string;
}[];

type LegendTab = 'all' | (typeof legendKinds)[number]['value'];

const isModified = (event: {
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
}): boolean => event.ctrlKey || event.metaKey;

export function MarkerLegend({
  entities,
  focus,
  onActivate,
}: {
  readonly entities: readonly MapDetailEntityView[];
  readonly focus: MapDetailFocus | undefined;
  readonly onActivate: (focusKey: string, modified?: boolean) => void;
}): ReactElement | null {
  const [activeTab, setActiveTab] = useState<LegendTab>('all');
  if (entities.length === 0) return null;

  const kinds = legendKinds
    .map((kind) => ({
      ...kind,
      count: entities.filter((entity) => entity.kind === kind.value).length,
    }))
    .filter((kind) => kind.count > 0);
  const dense = entities.length > 4;
  const availableTabs = new Set<LegendTab>([
    'all',
    ...kinds.map(({ value }) => value),
  ]);
  const selectedTab = availableTabs.has(activeTab) ? activeTab : 'all';
  const visibleEntities =
    selectedTab === 'all'
      ? entities
      : entities.filter((entity) => entity.kind === selectedTab);

  const chipList = (items: readonly MapDetailEntityView[]) => (
    <div
      className={classes['legendChips']}
      role="group"
      aria-label="Map legend"
    >
      {items.map((entity) => (
        <Chip
          aria-label={`${entity.name}, ${entity.kindLabel}`}
          checked={isMapDetailEntityFocused({
            focus,
            focusKey: entity.focusKey,
            kind: entity.kind,
          })}
          onClick={(event) => onActivate(entity.focusKey, isModified(event))}
          // Firefox drops the modifier on keyboard clicks and doesn't forward a
          // modified label click to the input, so handle those two here.
          onKeyDown={(event) => {
            if (event.key !== ' ' || !isModified(event)) return;
            event.preventDefault();
            onActivate(entity.focusKey, true);
          }}
          wrapperProps={{
            onClick: (event: MouseEvent<HTMLDivElement>) => {
              if (event.target instanceof HTMLInputElement) return;
              if (!isModified(event)) return;
              event.preventDefault();
              onActivate(entity.focusKey, true);
            },
          }}
          classNames={{
            root: classes['legendChip'],
            label: classes['legendChipLabel'],
          }}
          icon={false}
          key={entity.focusKey}
          variant="outline"
        >
          <EntityIcon entity={entity} />
          <span className={classes['legendChipName']}>{entity.name}</span>
        </Chip>
      ))}
    </div>
  );

  if (!dense)
    return <div className={classes['legend']}>{chipList(entities)}</div>;

  return (
    <div className={classes['legend']}>
      <Tabs
        classNames={{
          root: classes['legendTabs'],
          list: classes['legendTabList'],
          tab: classes['legendTab'],
          panel: classes['legendTabPanel'],
        }}
        keepMounted={false}
        onChange={(value) => setActiveTab(value as LegendTab)}
        value={selectedTab}
        variant="default"
      >
        <Tabs.List aria-label="Map legend kinds">
          <Tabs.Tab value="all">All ({entities.length})</Tabs.Tab>
          {kinds.map((kind) => (
            <Tabs.Tab key={kind.value} value={kind.value}>
              {kind.label} ({kind.count})
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value={selectedTab}>
          <ScrollArea
            className={classes['legendScrollArea']}
            h={154}
            scrollbars="y"
            type="auto"
            viewportProps={{
              role: 'region',
              'aria-label': 'Scrollable map legend',
              tabIndex: 0,
            }}
          >
            {chipList(visibleEntities)}
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
