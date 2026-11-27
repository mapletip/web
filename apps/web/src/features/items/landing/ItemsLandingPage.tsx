import {
  Autocomplete,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Title,
  type RenderAutocompleteOption,
} from '@mantine/core';
import { EntityOption, Thumbnail } from '@mapletip/component-library';
import { itemIconUrl, type ItemBrowseCoverage } from '@mapletip/data/items';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState, type FormEvent, type ReactElement } from 'react';

import { BrowsePageShell } from '@/components/BrowsePageShell';
import { BUILDS, MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import { canonicalBuildParam, DetailBreadcrumbs } from '@/features/detail';

import { numberFormat } from '../browse/number-format';
import {
  ITEM_GROUPS,
  ITEM_GROUP_ROUTES,
  itemPageMetadata,
} from '../browse/page';
import type { CategorizedItemRow } from '../browse/project';
import type { ProjectedRelation } from '../browse/relation-projection';
import { itemBrowseSearch } from '../browse/search-params';
import { ITEM_KINDS, ITEM_KINDS_BY_ID } from '../kinds';
import type { ItemKind } from '../kinds/types';

import classes from './ItemsLandingPage.module.css';
import { MAX_ITEM_SUGGESTIONS, matchItemSuggestions } from './suggestions';

interface ItemsLandingPageProps {
  readonly buildId: BuildId;
  readonly rows: readonly CategorizedItemRow[];
  readonly coverage: ItemBrowseCoverage;
  readonly lookupTargets: {
    readonly quest: ProjectedRelation['targets'];
    readonly monster: ProjectedRelation['targets'];
  };
  /** Monster Drops no quest or recipe uses; undefined when the build cannot say. */
  readonly notRequiredDropCount?: number | undefined;
}

interface DirectoryCategory {
  readonly kind: ItemKind;
  readonly count: number;
}

interface DirectoryPanel {
  readonly group: (typeof ITEM_GROUPS)[number];
  readonly count: number;
  readonly categories: readonly DirectoryCategory[];
}

const SEE_ALL_RESULTS_VALUE = '__see_all_results__';

function buildDirectoryPanels({
  rows,
}: {
  readonly rows: readonly CategorizedItemRow[];
}): readonly DirectoryPanel[] {
  const countsByKind = new Map<string, number>();
  for (const row of rows) {
    countsByKind.set(row.kind, (countsByKind.get(row.kind) ?? 0) + 1);
  }

  return ITEM_GROUPS.map((group) => {
    const categories: DirectoryCategory[] = [];
    let count = 0;

    for (const kind of ITEM_KINDS) {
      if (kind.group !== group.id) continue;
      const kindCount = countsByKind.get(kind.id) ?? 0;
      if (kindCount === 0) continue;
      categories.push({ kind, count: kindCount });
      count += kindCount;
    }

    return { group, count, categories };
  });
}

/** Search bar, four-panel category directory, and quick lookups for the Items landing page. */
export function ItemsLandingPage({
  buildId,
  rows,
  coverage,
  lookupTargets,
  notRequiredDropCount,
}: ItemsLandingPageProps): ReactElement {
  const navigate = useNavigate();
  const { heading } = itemPageMetadata({ buildId, all: false });
  const buildParam = canonicalBuildParam(buildId);
  const [query, setQuery] = useState('');

  const panels = useMemo(() => buildDirectoryPanels({ rows }), [rows]);
  const namedRows = useMemo(
    () =>
      rows.map((row) => ({
        value: row.sourceId,
        label: row.name,
      })),
    [rows],
  );
  const suggestionsById = useMemo(
    () => new Map(rows.map((row) => [row.sourceId, row])),
    [rows],
  );
  const autocompleteData = useMemo(
    () => [...namedRows, { value: SEE_ALL_RESULTS_VALUE, label: query.trim() }],
    [namedRows, query],
  );

  const showCraftingLookup =
    coverage.relationships['used-in-recipe'] !== 'unsupported';
  const craftingCount = useMemo(
    () =>
      showCraftingLookup
        ? rows.filter((row) => (row.usedInRecipeCount ?? 0) > 0).length
        : 0,
    [rows, showCraftingLookup],
  );
  const showUnusedLookup = notRequiredDropCount !== undefined;
  const questOptions = lookupTargets.quest.flatMap(({ publicId, name }) =>
    publicId === undefined ? [] : [{ value: publicId, label: name }],
  );
  const monsterOptions = lookupTargets.monster.flatMap(({ publicId, name }) =>
    publicId === undefined ? [] : [{ value: publicId, label: name }],
  );
  const showQuestLookup = questOptions.length > 0;
  const showMonsterLookup = monsterOptions.length > 0;

  function navigateToAllResults(searchQuery: string): void {
    void navigate({
      to: '/maplestory/{-$buildId}/items/all',
      params: { buildId: buildParam },
      search: { ...itemBrowseSearch.defaultSearch, q: searchQuery },
    });
  }

  function navigateToRelationItems({
    filter,
    publicId,
  }: {
    readonly filter: 'quest' | 'monster';
    readonly publicId: string;
  }): void {
    void navigate({
      to: '/maplestory/{-$buildId}/items/all',
      params: { buildId: buildParam },
      search: {
        ...itemBrowseSearch.defaultSearch,
        [filter]: [publicId],
      },
    });
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    navigateToAllResults(query.trim());
  }

  function handleOptionSubmit(value: string): void {
    if (value === SEE_ALL_RESULTS_VALUE) {
      navigateToAllResults(query.trim());
      return;
    }
    const row = suggestionsById.get(value);
    const kind = row === undefined ? undefined : ITEM_KINDS_BY_ID.get(row.kind);
    if (row === undefined || kind === undefined) return;
    void navigate({
      to: ITEM_GROUP_ROUTES[kind.group],
      params: { buildId: buildParam, kind: kind.slug },
      search: { ...itemBrowseSearch.defaultSearch, q: row.name },
    });
  }

  const renderSuggestionOption: RenderAutocompleteOption = ({ option }) => {
    if (option.value === SEE_ALL_RESULTS_VALUE) {
      return (
        <div className={classes['seeAllOption']}>
          <EntityOption
            icon={<MagnifyingGlass size={16} aria-hidden="true" />}
            label="See all results"
          />
        </div>
      );
    }
    const row = suggestionsById.get(option.value);
    if (row === undefined) return null;
    const kind = ITEM_KINDS_BY_ID.get(row.kind);
    return (
      <EntityOption
        icon={
          <Thumbnail
            src={
              row?.icon === undefined
                ? undefined
                : itemIconUrl(MAPLEKIT_RELEASE.baseUrl, row.icon)
            }
            size={24}
          />
        }
        label={row.name}
        {...(kind === undefined ? {} : { description: kind.label })}
      />
    );
  };

  return (
    <BrowsePageShell fillViewport={false}>
      <Stack gap="lg">
        <Stack gap="sm">
          <DetailBreadcrumbs
            items={[
              { label: 'Home', linkProps: { to: '/' } },
              { label: 'Items' },
            ]}
          />
          <Title order={1}>{heading}</Title>
        </Stack>
        <form
          role="search"
          onSubmit={handleSearchSubmit}
          className={classes['searchForm']}
        >
          <Autocomplete
            aria-label={`Search ${BUILDS[buildId].label} items`}
            placeholder="Search items by name"
            leftSection={<MagnifyingGlass size={16} aria-hidden="true" />}
            clearable
            size="md"
            maxDropdownHeight={360}
            classNames={{ input: classes['searchInput'] }}
            comboboxProps={{ shadow: 'md', offset: 6 }}
            data={autocompleteData}
            filter={matchItemSuggestions}
            limit={MAX_ITEM_SUGGESTIONS}
            value={query}
            onChange={(next) => {
              // Choosing an option writes its value (an item id) into the input;
              // keep the typed query instead, since the page navigates away.
              if (next === SEE_ALL_RESULTS_VALUE || suggestionsById.has(next)) {
                return;
              }
              setQuery(next);
            }}
            onOptionSubmit={handleOptionSubmit}
            renderOption={renderSuggestionOption}
          />
        </form>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {panels.map((panel) => {
            const headingId = `items-group-${panel.group.id}`;
            return (
              <Paper
                key={panel.group.id}
                component="section"
                withBorder
                radius="md"
                p="md"
                className={classes['panel']}
                aria-labelledby={headingId}
              >
                <Title
                  order={2}
                  size="h4"
                  id={headingId}
                  className={classes['panelTitle']}
                >
                  <Link
                    to={ITEM_GROUP_ROUTES[panel.group.id]}
                    params={{ buildId: buildParam, kind: undefined }}
                    search={itemBrowseSearch.defaultSearch}
                    className={classes['panelHeadingLink']}
                  >
                    <span className={classes['label']}>
                      {panel.group.label}
                    </span>
                    <span className={classes['count']}>
                      {numberFormat.format(panel.count)}
                    </span>
                  </Link>
                </Title>
                <ul className={classes['list']}>
                  {panel.categories.map(({ kind, count }) => (
                    <li key={kind.id} className={classes['item']}>
                      <Link
                        to={ITEM_GROUP_ROUTES[panel.group.id]}
                        params={{ buildId: buildParam, kind: kind.slug }}
                        search={itemBrowseSearch.defaultSearch}
                        className={classes['categoryLink']}
                      >
                        <Thumbnail
                          src={
                            kind.iconContentId === undefined
                              ? undefined
                              : itemIconUrl(
                                  MAPLEKIT_RELEASE.baseUrl,
                                  kind.iconContentId,
                                )
                          }
                          size={32}
                        />
                        <span className={classes['label']}>{kind.label}</span>
                        <span className={classes['count']}>
                          {numberFormat.format(count)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Paper>
            );
          })}
        </SimpleGrid>
        {showQuestLookup ||
        showMonsterLookup ||
        showCraftingLookup ||
        showUnusedLookup ? (
          <Paper
            component="section"
            withBorder
            radius="md"
            p="md"
            className={classes['panel']}
            aria-labelledby="items-quick-lookups"
          >
            <Title
              order={2}
              size="h4"
              id="items-quick-lookups"
              className={classes['lookupsTitle']}
            >
              Quick lookups
            </Title>
            {showQuestLookup || showMonsterLookup ? (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {showQuestLookup ? (
                  <Select
                    label="Items a quest requires"
                    placeholder="Search quests"
                    searchable
                    data={questOptions}
                    value={null}
                    onChange={(publicId) => {
                      if (publicId !== null)
                        navigateToRelationItems({ filter: 'quest', publicId });
                    }}
                  />
                ) : null}
                {showMonsterLookup ? (
                  <Select
                    label="Items a monster drops"
                    placeholder="Search monsters"
                    searchable
                    data={monsterOptions}
                    value={null}
                    onChange={(publicId) => {
                      if (publicId !== null)
                        navigateToRelationItems({
                          filter: 'monster',
                          publicId,
                        });
                    }}
                  />
                ) : null}
              </SimpleGrid>
            ) : null}
            <ul className={classes['lookupsList']}>
              {showCraftingLookup ? (
                <li className={classes['item']}>
                  <Link
                    to="/maplestory/{-$buildId}/items/all"
                    params={{ buildId: buildParam }}
                    search={{
                      ...itemBrowseSearch.defaultSearch,
                      usedInRecipes: true,
                    }}
                    className={classes['lookupLink']}
                  >
                    <span className={classes['label']}>
                      Crafting ingredients
                    </span>
                    <span className={classes['count']}>
                      {numberFormat.format(craftingCount)}
                    </span>
                  </Link>
                </li>
              ) : null}
              {showUnusedLookup ? (
                <li className={classes['item']}>
                  <Link
                    to={ITEM_GROUP_ROUTES.etc}
                    params={{ buildId: buildParam, kind: 'monster-drops' }}
                    search={{
                      ...itemBrowseSearch.defaultSearch,
                      dropUses: ['not-required'],
                      sort: 'sellPrice-desc',
                    }}
                    className={classes['lookupLink']}
                  >
                    <span className={classes['label']}>
                      Drops no quest or recipe uses
                    </span>
                    <span className={classes['count']}>
                      {numberFormat.format(notRequiredDropCount ?? 0)}
                    </span>
                  </Link>
                </li>
              ) : null}
            </ul>
          </Paper>
        ) : null}
      </Stack>
    </BrowsePageShell>
  );
}
