import {
  Button,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Thumbnail } from '@mapletip/component-library';
import { itemIconUrl } from '@mapletip/data/items';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';

import { MAPLEKIT_RELEASE } from '@/config/maplekit';
import { DropSources } from '@/features/drops';

import { formatBuff } from './buff-format';
import type { CategorizedItemRow } from './project';
import {
  ITEM_DRAWER_MONSTER_LIMIT,
  ITEM_DRAWER_QUEST_LIMIT,
  ITEM_DRAWER_RECIPE_LIMIT,
  projectItemDrawerRelations,
  requiredRelationKindsForItem,
  type ItemDrawerPack,
  type ItemDrawerQuestEntry,
  type ItemDrawerRelations,
  type ItemRelationReader,
} from './relations';
import { formatSellPrice } from './sell-price';

const numberFormat = new Intl.NumberFormat('en-US');

/** Plain US English statements for the published facts on an item row. */
export function formatItemFacts({
  record,
}: {
  readonly record: CategorizedItemRow;
}): readonly string[] {
  const facts: string[] = [];
  if (record.hp !== undefined) {
    facts.push(`Restores ${numberFormat.format(record.hp)} HP`);
  }
  if (record.hpPercent !== undefined) {
    facts.push(`Restores ${numberFormat.format(record.hpPercent)}% HP`);
  }
  if (record.mp !== undefined) {
    facts.push(`Restores ${numberFormat.format(record.mp)} MP`);
  }
  if (record.mpPercent !== undefined) {
    facts.push(`Restores ${numberFormat.format(record.mpPercent)}% MP`);
  }
  if (record.buff !== undefined && record.buff.effects.length > 0) {
    facts.push(formatBuff({ buff: record.buff }));
  }
  if (record.attack !== undefined) {
    facts.push(`+${numberFormat.format(record.attack)} attack`);
  }
  if (record.level !== undefined) {
    facts.push(`Requires level ${numberFormat.format(record.level)}`);
  }
  if (record.maxStack !== undefined) {
    facts.push(`Stacks to ${numberFormat.format(record.maxStack)}`);
  }
  const sellPrice = formatSellPrice({ sellPrice: record.sellPrice });
  if (sellPrice !== undefined) facts.push(sellPrice);
  return facts;
}

function DrawerSection<T extends { readonly key: string }>({
  title,
  items,
  limit,
  renderItem,
}: {
  readonly title: string;
  readonly items: readonly T[];
  readonly limit: number;
  readonly renderItem: (item: T) => ReactElement;
}): ReactElement | null {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, limit);
  return (
    <Stack component="section" aria-label={title} gap="xs">
      <Divider />
      <Title order={3} size="sm">
        {title}
      </Title>
      <Stack component="ul" gap="xs" m={0} p={0} style={{ listStyle: 'none' }}>
        {visible.map((item) => (
          <li key={item.key}>{renderItem(item)}</li>
        ))}
      </Stack>
      {!expanded && items.length > limit ? (
        <Button
          variant="subtle"
          size="compact-sm"
          onClick={() => setExpanded(true)}
          style={{ alignSelf: 'flex-start' }}
        >
          {`Show all ${numberFormat.format(items.length)}`}
        </Button>
      ) : null}
    </Stack>
  );
}

function QuestRow({
  quest,
}: {
  readonly quest: ItemDrawerQuestEntry;
}): ReactElement {
  const meta = [
    quest.amountText,
    quest.levelText,
    quest.startNpc,
    quest.recurrenceText,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Stack gap={0}>
      <Text size="sm" fw={500}>
        {quest.name}
      </Text>
      {meta.length > 0 ? (
        <Text size="xs" c="dimmed">
          {meta}
        </Text>
      ) : null}
    </Stack>
  );
}

function ItemDrawerRelationsSection({
  record,
  reader,
  descriptions,
}: {
  readonly record: CategorizedItemRow;
  readonly reader: ItemRelationReader;
  readonly descriptions?: Readonly<Record<string, string>>;
}): ReactElement {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<
    { readonly relations: ItemDrawerRelations } | { readonly retry: () => void }
  >();

  useEffect(() => {
    let active = true;
    const kinds = requiredRelationKindsForItem({ record });
    const projectedDescription = descriptions?.[record.sourceId];
    const descriptionsRequest =
      descriptions === undefined
        ? reader.readDescriptions()
        : Promise.resolve(
            projectedDescription === undefined
              ? {}
              : { [record.key]: projectedDescription },
          );
    const relationRequests = kinds.map((kind) => ({
      kind,
      request: reader.readRelation(kind),
    }));

    void Promise.all([
      descriptionsRequest,
      ...relationRequests.map(({ request }) => request),
    ])
      .then(([descriptions, ...packs]) => {
        if (!active) return;
        let neededForQuest: ItemDrawerPack<'needed-for-quest'> | undefined;
        let questReward: ItemDrawerPack<'quest-reward'> | undefined;
        let usedInRecipe: ItemDrawerPack<'used-in-recipe'> | undefined;
        let monsterDrop: ItemDrawerPack<'monster-drop'> | undefined;

        for (const pack of packs) {
          switch (pack.relationshipKind) {
            case 'needed-for-quest':
              neededForQuest = pack;
              break;
            case 'quest-reward':
              questReward = pack;
              break;
            case 'used-in-recipe':
              usedInRecipe = pack;
              break;
            case 'monster-drop':
              monsterDrop = pack;
              break;
          }
        }

        setResult({
          relations: projectItemDrawerRelations({
            record,
            descriptions,
            neededForQuest,
            questReward,
            usedInRecipe,
            monsterDrop,
          }),
        });
      })
      .catch(() => {
        if (!active) return;
        setResult({
          retry: () => {
            reader.forgetDescriptions(descriptionsRequest);
            for (const { kind, request } of relationRequests) {
              reader.forgetRelation(kind, request);
            }
            setResult(undefined);
            setAttempt((count) => count + 1);
          },
        });
      });

    return () => {
      active = false;
    };
  }, [attempt, descriptions, reader, record]);

  if (result === undefined) {
    return (
      <Group gap="xs" role="status">
        <Loader size="xs" aria-hidden="true" />
        <Text size="sm" c="dimmed">
          Loading connections…
        </Text>
      </Group>
    );
  }

  if ('retry' in result) {
    return (
      <Stack gap="xs" align="flex-start">
        <Divider w="100%" />
        <Text size="sm" role="alert">
          Quests, recipes and monsters could not be loaded.
        </Text>
        <Button variant="default" size="compact-sm" onClick={result.retry}>
          Try again
        </Button>
      </Stack>
    );
  }

  const { relations } = result;
  return (
    <Stack gap="md">
      {relations.description === undefined ? null : (
        <Text size="sm">{relations.description}</Text>
      )}
      <DrawerSection
        title="Required by quests"
        items={relations.requiredQuests}
        limit={ITEM_DRAWER_QUEST_LIMIT}
        renderItem={(quest) => <QuestRow quest={quest} />}
      />
      <DrawerSection
        title="Given by quests"
        items={relations.rewardQuests}
        limit={ITEM_DRAWER_QUEST_LIMIT}
        renderItem={(quest) => <QuestRow quest={quest} />}
      />
      <DrawerSection
        title="Used in recipes"
        items={relations.recipes}
        limit={ITEM_DRAWER_RECIPE_LIMIT}
        renderItem={(recipe) => (
          <Stack gap={0}>
            <Text size="sm" fw={500}>
              {recipe.productName}
            </Text>
            {recipe.amountText === undefined ? null : (
              <Text size="xs" c="dimmed">
                {recipe.amountText}
              </Text>
            )}
          </Stack>
        )}
      />
      <DrawerSection
        title="Dropped by monsters"
        items={relations.monsters}
        limit={ITEM_DRAWER_MONSTER_LIMIT}
        renderItem={(monster) => (
          <Group align="flex-start" gap="sm" wrap="nowrap">
            <Thumbnail src={monster.spriteUrl} size={40} />
            <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
              <Text size="sm" fw={500}>
                {monster.name}
              </Text>
              {monster.levelText === undefined ? null : (
                <Text size="xs" c="dimmed">
                  {monster.levelText}
                </Text>
              )}
              <DropSources sources={monster.sources} />
            </Stack>
          </Group>
        )}
      />
    </Stack>
  );
}

interface ItemDrawerBodyProps {
  readonly record: CategorizedItemRow;
  readonly categoryLabel?: string | undefined;
  readonly reader: ItemRelationReader;
  readonly descriptions?: Readonly<Record<string, string>>;
  readonly additionalContent?: ReactNode;
}

/** Item summary, published facts, and lazy connections shown inside the record-details drawer. */
export function ItemDrawerBody({
  record,
  categoryLabel,
  reader,
  descriptions,
  additionalContent,
}: ItemDrawerBodyProps): ReactElement {
  const facts = formatItemFacts({ record });
  return (
    <Stack gap="md">
      <Group align="center" gap="md" wrap="nowrap">
        <Thumbnail
          src={
            record.icon === undefined
              ? undefined
              : itemIconUrl(MAPLEKIT_RELEASE.baseUrl, record.icon)
          }
          size={64}
          magnify={2}
        />
        {categoryLabel === undefined ? null : (
          <Text size="sm" c="dimmed">
            {categoryLabel}
          </Text>
        )}
      </Group>
      {facts.length > 0 ? (
        <Stack
          component="ul"
          gap="xs"
          m={0}
          p={0}
          style={{ listStyle: 'none' }}
        >
          {facts.map((fact) => (
            <li key={fact}>
              <Text size="sm">{fact}</Text>
            </li>
          ))}
        </Stack>
      ) : null}
      {additionalContent}
      <ItemDrawerRelationsSection
        key={record.key}
        record={record}
        reader={reader}
        {...(descriptions === undefined ? {} : { descriptions })}
      />
    </Stack>
  );
}
