import { mapMinimapUrl, type MapPageRecordV1 } from '@mapletip/data/maps';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import { buildRecordDetailPath, nonBlank } from '@/features/detail';
import {
  projectMapRecordDestination,
  type MapRecordCardView,
} from '@/features/maps/shared';
import {
  formatMonsterNumber,
  monsterDetailLinkProps,
  resolveMonsterSpriteUrl,
  UNNAMED_MONSTER_LABEL,
} from '@/features/monsters/shared';

export const UNNAMED_MAP_LABEL = 'Unnamed map';

/** Serializable, display-ready identity and geography for one Map Detail page. */
export interface MapDetailView {
  readonly publicId: string;
  readonly slug: string;
  readonly buildId: BuildId;
  readonly name: string;
  readonly subtitle?: string;
  readonly regionLabel?: string;
  readonly areaLabel?: string;
  readonly canonicalPath: string;
  readonly activity?: string;
  readonly description?: string;
  readonly facts: readonly MapDetailFactView[];
  readonly connections?: MapDetailConnectionsView;
  readonly monsters: MapDetailMonstersView;
}

export interface MapDetailConnectionsView {
  readonly state: MapPageRecordV1['connections']['state'];
  readonly count: number | 'unknown';
  readonly notice?: string;
  readonly maps: readonly MapRecordCardView[];
}

export interface MapDetailMonsterView {
  readonly key: string;
  readonly name: string;
  readonly spriteUrl?: string;
  readonly spriteWidth?: number;
  readonly spriteHeight?: number;
  readonly bossLabel?: 'Boss';
  readonly levelLabel?: string;
  readonly spawnCountLabel: string;
  readonly respawnLabel?: string;
  readonly destination?: {
    readonly href: string;
    readonly params: NonNullable<
      ReturnType<typeof monsterDetailLinkProps>
    >['params'];
  };
}

export interface MapDetailMonstersView {
  readonly state: MapPageRecordV1['monsters']['state'];
  readonly count: number | 'unknown';
  readonly notice?: string;
  readonly summary?: string;
  readonly monsters: readonly MapDetailMonsterView[];
}

export interface MapDetailFactView {
  readonly label: string;
  readonly value: string;
  readonly explanation: string;
  readonly destination?: {
    readonly buildId?: BuildId;
    readonly slugId: string;
  };
}

export interface ProjectMapDetailOptions {
  readonly record: MapPageRecordV1;
  readonly buildId: BuildId;
}

function knownText(fact: { readonly state: string; readonly value?: string }) {
  if (fact.state !== 'known') return undefined;
  return nonBlank(fact.value);
}

function formatSeconds(seconds: number): string {
  return seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds} sec`;
}

function addMapFact({
  facts,
  field,
  label,
  explanation,
  buildId,
}: {
  readonly facts: MapDetailFactView[];
  readonly field:
    | MapPageRecordV1['information']['returnMap']
    | MapPageRecordV1['information']['forcedReturnMap'];
  readonly label: string;
  readonly explanation: string;
  readonly buildId: BuildId;
}) {
  if (field.state !== 'known') return;
  const target = field.value;
  facts.push({
    label,
    value: knownText(target.name) ?? UNNAMED_MAP_LABEL,
    explanation,
    destination: projectMapRecordDestination({
      slug: target.slug,
      publicId: target.publicId,
      buildId,
    }).params,
  });
}

function projectFacts({
  information,
  buildId,
}: {
  readonly information: MapPageRecordV1['information'];
  readonly buildId: BuildId;
}): readonly MapDetailFactView[] {
  const facts: MapDetailFactView[] = [];
  const {
    music,
    returnMap,
    forcedReturnMap,
    timeLimitSeconds,
    levelLimit,
    hpDrain,
    hpDrainProtectionItem,
    swimming,
    flying,
  } = information;

  const musicTitle =
    music.state === 'known' ? nonBlank(music.value) : undefined;
  if (musicTitle !== undefined) {
    facts.push({
      label: 'Music',
      value: musicTitle,
      explanation: 'The background music played on this map.',
    });
  }

  addMapFact({
    facts,
    field: returnMap,
    label: 'Return map',
    explanation:
      'Ordinary revival and generic Return Scrolls can send you to this map. Some items and activities use another destination.',
    buildId,
  });
  addMapFact({
    facts,
    field: forcedReturnMap,
    label: 'Forced return',
    explanation:
      'Some timed activities send you to this map when time runs out. Check when the timer starts.',
    buildId,
  });

  if (timeLimitSeconds.state === 'known') {
    facts.push({
      label: 'Time limit',
      value: formatSeconds(timeLimitSeconds.value),
      explanation:
        'Check the activity rules for when the timer starts and what happens when it runs out.',
    });
  }

  if (levelLimit.state === 'known') {
    facts.push({
      label: 'Level limit',
      value: `Lv ${levelLimit.value}`,
      explanation:
        'Check entry requirements before traveling here. Special entrances may have extra rules.',
    });
  }

  if (hpDrain.state === 'known') {
    facts.push({
      label: 'HP drain',
      value: `${hpDrain.value} HP`,
      explanation:
        'This map can lower your HP without a monster hit. Bring healing; the amount does not say how often it happens.',
    });
  }

  const protectionItem =
    hpDrainProtectionItem.state === 'known'
      ? nonBlank(hpDrainProtectionItem.value)
      : undefined;
  if (protectionItem !== undefined) {
    facts.push({
      label: 'HP drain protection',
      value: protectionItem,
      explanation:
        "Equip this item to prevent the map's HP drain; carrying it is not enough.",
    });
  }

  if (swimming.state === 'known' && swimming.value) {
    facts.push({
      label: 'Swimming',
      value: 'Allowed',
      explanation:
        'You swim on this map. Jump to rise and use the direction controls to move through the water.',
    });
  }

  if (flying.state === 'known' && flying.value) {
    facts.push({
      label: 'Flying',
      value: 'Allowed',
      explanation:
        'You float while moving on this map. Jumping and steering work differently than on a normal field.',
    });
  }

  return facts;
}

const nameCollator = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
});

function projectMonsterRespawn(
  respawn: MapPageRecordV1['monsters']['items'][number]['respawn'],
): string | undefined {
  switch (respawn.kind) {
    case 'ordinary':
      return undefined;
    case 'none':
      return 'No respawn';
    case 'delayed':
      return `Respawns after ${formatSeconds(respawn.seconds)}`;
    case 'mixed':
      return 'Mixed respawn';
  }
}

function projectMonsterNotice(
  state: MapPageRecordV1['monsters']['state'],
  noRecordedMonsters: boolean,
): string | undefined {
  switch (state) {
    case 'unknown':
      return 'Monster information is unavailable.';
    case 'partial':
      return 'Some monster information may be missing.';
    case 'absent':
    case 'known':
      return noRecordedMonsters
        ? 'No monsters are recorded on this map.'
        : undefined;
  }
}

function projectMonsters({
  record,
  buildId,
}: {
  readonly record: MapPageRecordV1;
  readonly buildId: BuildId;
}): MapDetailMonstersView {
  const monsters = record.monsters.items
    .map((monster) => {
      const name =
        monster.name.state === 'known'
          ? (nonBlank(monster.name.value) ?? UNNAMED_MONSTER_LABEL)
          : UNNAMED_MONSTER_LABEL;
      const spriteContentId =
        monster.sprite.contentId.state === 'known'
          ? monster.sprite.contentId.value
          : undefined;
      const spriteUrl =
        spriteContentId === undefined
          ? undefined
          : resolveMonsterSpriteUrl(spriteContentId);
      const level =
        monster.level.state === 'known' ? monster.level.value : undefined;
      const respawnLabel = projectMonsterRespawn(monster.respawn);
      const link = monsterDetailLinkProps(monster, buildId);
      const view: MapDetailMonsterView = {
        key: monster.key,
        name,
        ...(spriteUrl === undefined ? {} : { spriteUrl }),
        ...(typeof monster.sprite.width === 'number'
          ? { spriteWidth: monster.sprite.width }
          : {}),
        ...(typeof monster.sprite.height === 'number'
          ? { spriteHeight: monster.sprite.height }
          : {}),
        ...(monster.boss.state === 'known' && monster.boss.value
          ? { bossLabel: 'Boss' }
          : {}),
        ...(level === undefined ? {} : { levelLabel: `Lv ${level}` }),
        spawnCountLabel: `${formatMonsterNumber(monster.placementCount)} ${monster.placementCount === 1 ? 'spawn' : 'spawns'}`,
        ...(respawnLabel === undefined ? {} : { respawnLabel }),
        ...(link === undefined
          ? {}
          : {
              destination: {
                href: buildRecordDetailPath(
                  'monsters',
                  monster.slug,
                  monster.publicId,
                  buildId,
                ),
                params: link.params,
              },
            }),
      };

      return { level, view };
    })
    .sort((left, right) => {
      const levelOrder =
        (left.level ?? Number.POSITIVE_INFINITY) -
        (right.level ?? Number.POSITIVE_INFINITY);
      return (
        levelOrder || nameCollator.compare(left.view.name, right.view.name)
      );
    })
    .map(({ view }) => view);
  const count =
    record.monsters.state === 'unknown' ? 'unknown' : monsters.length;
  const totalSpawns = record.monsters.items.reduce(
    (total, monster) => total + monster.placementCount,
    0,
  );
  const noRecordedMonsters =
    monsters.length === 0 &&
    (record.monsters.state === 'absent' || record.monsters.state === 'known');
  const notice = projectMonsterNotice(
    record.monsters.state,
    noRecordedMonsters,
  );
  const summary =
    record.monsters.state === 'unknown' || noRecordedMonsters
      ? undefined
      : `${formatMonsterNumber(monsters.length)} ${monsters.length === 1 ? 'monster type' : 'monster types'}, ${formatMonsterNumber(totalSpawns)} total ${totalSpawns === 1 ? 'spawn' : 'spawns'}`;

  return {
    state: record.monsters.state,
    count,
    ...(notice === undefined ? {} : { notice }),
    ...(summary === undefined ? {} : { summary }),
    monsters,
  };
}

function projectConnectionNotice(
  state: MapPageRecordV1['connections']['state'],
): string | undefined {
  switch (state) {
    case 'unknown':
      return 'Connection information is unavailable.';
    case 'partial':
      return 'Some connection information may be missing.';
    case 'absent':
    case 'known':
      return undefined;
  }
}

function projectConnections({
  record,
  buildId,
}: {
  readonly record: MapPageRecordV1;
  readonly buildId: BuildId;
}): MapDetailConnectionsView | undefined {
  const maps = record.connections.items
    .map((connection): MapRecordCardView => {
      const name =
        connection.name.state === 'known'
          ? (nonBlank(connection.name.value) ?? UNNAMED_MAP_LABEL)
          : UNNAMED_MAP_LABEL;
      const minimapUrl =
        connection.minimap.state === 'known'
          ? mapMinimapUrl(MAPLEKIT_RELEASE.baseUrl, connection.minimap.value)
          : undefined;
      return {
        key: connection.key,
        name,
        ...(minimapUrl === undefined ? {} : { minimapUrl }),
        ...(minimapUrl === undefined
          ? { minimapUnavailableLabel: 'Minimap unavailable' }
          : {}),
        footerParts: [
          {
            value: connection.monsterCount.toLocaleString('en-US'),
            label: connection.monsterCount === 1 ? 'monster' : 'monsters',
          },
          {
            value: connection.npcCount.toLocaleString('en-US'),
            label: connection.npcCount === 1 ? 'NPC' : 'NPCs',
          },
        ],
        destination: projectMapRecordDestination({
          slug: connection.slug,
          publicId: connection.publicId,
          buildId,
        }),
      };
    })
    .sort((left, right) => nameCollator.compare(left.name, right.name));
  const notice = projectConnectionNotice(record.connections.state);

  if (notice === undefined && maps.length === 0) return undefined;

  return {
    state: record.connections.state,
    count: record.connections.state === 'unknown' ? 'unknown' : maps.length,
    ...(notice === undefined ? {} : { notice }),
    maps,
  };
}

/** Project display-ready identity, geography, description, activity, and facts. */
export function projectMapDetail({
  record,
  buildId,
}: ProjectMapDetailOptions): MapDetailView {
  const name = knownText(record.name);
  const streetName = knownText(record.streetName);
  const geography = record.geography;
  const regionLabel = nonBlank(geography?.regionLabel);
  const areaLabel = nonBlank(geography?.areaLabel);
  const activity =
    record.activity.state === 'known'
      ? nonBlank(record.activity.value)
      : undefined;
  const description =
    record.description.state === 'known'
      ? nonBlank(record.description.value)
      : undefined;
  const connections = projectConnections({ record, buildId });

  return {
    publicId: record.publicId,
    slug: record.slug,
    buildId,
    name: name ?? UNNAMED_MAP_LABEL,
    ...(name === undefined && streetName !== undefined
      ? { subtitle: streetName }
      : {}),
    ...(regionLabel === undefined ? {} : { regionLabel }),
    ...(areaLabel === undefined ? {} : { areaLabel }),
    ...(activity === undefined ? {} : { activity }),
    ...(description === undefined ? {} : { description }),
    facts: projectFacts({ information: record.information, buildId }),
    ...(connections === undefined ? {} : { connections }),
    monsters: projectMonsters({ record, buildId }),
    canonicalPath: buildRecordDetailPath(
      'maps',
      record.slug,
      record.publicId,
      buildId,
    ),
  };
}
