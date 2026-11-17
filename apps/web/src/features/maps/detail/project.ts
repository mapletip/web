import { mapMinimapUrl, type MapPageRecordV1 } from '@mapletip/data/maps';

import { MAPLEKIT_RELEASE, type BuildId } from '@/config/maplekit';
import { buildRecordDetailPath, nonBlank } from '@/features/detail';
import {
  MAP_DETAIL_ROUTE,
  projectMapRecordDestination,
  type MapRecordCardView,
} from '@/features/maps/shared';
import {
  formatMonsterNumber,
  MONSTER_DETAIL_ROUTE,
  type monsterDetailLinkProps,
  projectMonsterRecordCard,
  projectMonsterRespawnLabel,
  type MonsterRecordCardView,
} from '@/features/monsters/shared';
import {
  projectNpcRecordCard,
  type NpcRecordCardView,
} from '@/features/npcs/shared';

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
  readonly stage: MapDetailStageView;
  readonly entities: readonly MapDetailEntityView[];
  readonly facts: readonly MapDetailFactView[];
  readonly connections?: MapDetailConnectionsView;
  readonly monsters: MapDetailMonstersView;
  readonly npcs: MapDetailNpcsView;
}

export type MapDetailStageMarkerKind =
  'monster' | 'npc' | 'connection' | 'warp';

export interface MapDetailEntityView {
  readonly focusKey: string;
  readonly kind: MapDetailStageMarkerKind;
  readonly name: string;
  readonly kindLabel: string;
  readonly spriteUrl?: string;
  readonly link?:
    | {
        readonly to: typeof MONSTER_DETAIL_ROUTE;
        readonly params: NonNullable<
          ReturnType<typeof monsterDetailLinkProps>
        >['params'];
      }
    | {
        readonly to: typeof MAP_DETAIL_ROUTE;
        readonly params: NonNullable<
          NonNullable<MapDetailConnectionsView>['maps'][number]['destination']
        >['params'];
      };
}

export interface MapDetailStageImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

export interface MapDetailStageMarker {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly kind: MapDetailStageMarkerKind;
  readonly entityKey: string;
  readonly focusKey: string;
  readonly label: string;
  readonly spriteUrl?: string;
}

export interface MapDetailStageConnector {
  readonly id: string;
  readonly from: string;
  readonly to: string;
}

export interface MapDetailStageView {
  readonly image?: MapDetailStageImage;
  readonly markers: readonly MapDetailStageMarker[];
  readonly connectors: readonly MapDetailStageConnector[];
  readonly positionsUnavailable: boolean;
}

export interface MapDetailConnectionsView {
  readonly state: MapPageRecordV1['connections']['state'];
  readonly count: number | 'unknown';
  readonly notice?: string;
  readonly maps: readonly MapDetailConnectionView[];
}

export interface MapDetailConnectionView extends MapRecordCardView {
  readonly focusKey: string;
}

export interface MapDetailMonsterView extends MonsterRecordCardView {
  readonly focusKey: string;
  readonly placementCount: number;
  readonly spawnCountLabel: string;
  readonly respawnLabel?: string;
}

export interface MapDetailMonstersView {
  readonly state: MapPageRecordV1['monsters']['state'];
  readonly count: number | 'unknown';
  readonly notice?: string;
  readonly summary?: string;
  readonly monsters: readonly MapDetailMonsterView[];
}

export interface MapDetailNpcView extends NpcRecordCardView {
  readonly key: string;
  readonly focusKey: string;
}

export interface MapDetailNpcsView {
  readonly state: MapPageRecordV1['npcs']['state'];
  readonly count: number | 'unknown';
  readonly notice?: string;
  readonly npcs: readonly MapDetailNpcView[];
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

type MapDetailPoint =
  MapPageRecordV1['monsters']['items'][number]['points']['items'][number];
type MapDetailPositionCollection = {
  readonly state: string;
  readonly items: readonly MapDetailPoint[];
};
type MapDetailStagePointCollection = {
  readonly state: string;
  readonly items: readonly {
    readonly key: string;
    readonly points: MapDetailPositionCollection;
  }[];
};

const stageMarkerKindLabels: Record<MapDetailStageMarkerKind, string> = {
  monster: 'Monster',
  npc: 'NPC',
  connection: 'Connection',
  warp: 'Warp',
};

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

function projectSectionNotice({
  state,
  empty,
  noun,
  plural,
}: {
  readonly state: 'unknown' | 'partial' | 'known' | 'absent';
  readonly empty: boolean;
  readonly noun: string;
  readonly plural: string;
}): string | undefined {
  if (state === 'unknown') {
    return `${noun.charAt(0).toUpperCase()}${noun.slice(1)} information is unavailable.`;
  }
  if (state === 'partial') return `Some ${noun} information may be missing.`;
  return empty ? `No ${plural} are recorded on this map.` : undefined;
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
      const card = projectMonsterRecordCard(monster, { buildId });
      const respawnLabel = projectMonsterRespawnLabel(monster.respawn);
      const view: MapDetailMonsterView = {
        ...card,
        focusKey: `monster-${monster.focusToken}`,
        placementCount: monster.placementCount,
        spawnCountLabel: `${formatMonsterNumber(monster.placementCount)} ${monster.placementCount === 1 ? 'spawn' : 'spawns'}`,
        ...(respawnLabel === undefined ? {} : { respawnLabel }),
      };

      return { level: card.level, view };
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
  const notice = projectSectionNotice({
    state: record.monsters.state,
    empty: noRecordedMonsters,
    noun: 'monster',
    plural: 'monsters',
  });
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

function projectConnections({
  record,
  buildId,
}: {
  readonly record: MapPageRecordV1;
  readonly buildId: BuildId;
}): MapDetailConnectionsView | undefined {
  const maps = record.connections.items
    .map((connection): MapDetailConnectionView => {
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
        focusKey: `connection-${connection.focusToken}`,
        name,
        ...(minimapUrl === undefined ? {} : { minimapUrl }),
        ...(minimapUrl === undefined
          ? { minimapUnavailableLabel: 'Minimap unavailable' }
          : {}),
        footerParts: [
          ...(connection.monsterCount > 0
            ? [
                {
                  value: connection.monsterCount.toLocaleString('en-US'),
                  label: connection.monsterCount === 1 ? 'monster' : 'monsters',
                },
              ]
            : []),
          ...(connection.npcCount > 0
            ? [
                {
                  value: connection.npcCount.toLocaleString('en-US'),
                  label: connection.npcCount === 1 ? 'NPC' : 'NPCs',
                },
              ]
            : []),
        ],
        destination: projectMapRecordDestination({
          slug: connection.slug,
          publicId: connection.publicId,
          buildId,
        }),
      };
    })
    .sort((left, right) => nameCollator.compare(left.name, right.name));
  const notice = projectSectionNotice({
    state: record.connections.state,
    empty: false,
    noun: 'connection',
    plural: 'connections',
  });

  if (notice === undefined && maps.length === 0) return undefined;

  return {
    state: record.connections.state,
    count: record.connections.state === 'unknown' ? 'unknown' : maps.length,
    ...(notice === undefined ? {} : { notice }),
    maps,
  };
}

function projectNpcs(record: MapPageRecordV1): MapDetailNpcsView {
  const npcs = record.npcs.items
    .map((npc) => ({
      key: npc.key,
      focusKey: `npc-${npc.focusToken}`,
      ...projectNpcRecordCard(npc),
    }))
    .sort((left, right) => nameCollator.compare(left.name, right.name));
  const noRecordedNpcs =
    npcs.length === 0 &&
    (record.npcs.state === 'absent' || record.npcs.state === 'known');
  const notice = projectSectionNotice({
    state: record.npcs.state,
    empty: noRecordedNpcs,
    noun: 'NPC',
    plural: 'NPCs',
  });

  return {
    state: record.npcs.state,
    count: record.npcs.state === 'unknown' ? 'unknown' : npcs.length,
    ...(notice === undefined ? {} : { notice }),
    npcs,
  };
}

function projectPointMarkers({
  kind,
  entityKey,
  focusKey,
  name,
  positions,
  spriteUrl,
}: {
  readonly kind: MapDetailStageMarkerKind;
  readonly entityKey: string;
  readonly focusKey: string;
  readonly name: string;
  readonly positions: MapDetailPositionCollection;
  readonly spriteUrl?: string;
}): MapDetailStageMarker[] {
  if (positions.state !== 'known' && positions.state !== 'partial') return [];

  const count = positions.items.length;
  return positions.items.map(({ x, y }, index) => ({
    id: `${kind}:${entityKey}:${index + 1}`,
    x,
    y,
    kind,
    entityKey,
    focusKey,
    label: `${name}, ${stageMarkerKindLabels[kind]}, ${index + 1} of ${count}`,
    ...(spriteUrl === undefined ? {} : { spriteUrl }),
  }));
}

type MapDetailWarpView = MapPageRecordV1['warps']['items'][number] & {
  readonly focusKey: string;
};

function projectWarps(record: MapPageRecordV1): MapDetailWarpView[] {
  return record.warps.items.map((warp) => ({
    ...warp,
    focusKey: `warp-${warp.focusToken}`,
  }));
}

function projectStage({
  record,
  name,
  connections,
  monsters,
  npcs,
  warps,
}: {
  readonly record: MapPageRecordV1;
  readonly name: string;
  readonly connections: MapDetailConnectionsView | undefined;
  readonly monsters: MapDetailMonstersView;
  readonly npcs: MapDetailNpcsView;
  readonly warps: readonly MapDetailWarpView[];
}): MapDetailStageView {
  const image =
    record.stage.state === 'known'
      ? {
          src: mapMinimapUrl(
            MAPLEKIT_RELEASE.baseUrl,
            record.stage.value.contentId,
          ),
          width: record.stage.value.width,
          height: record.stage.value.height,
          alt: `${name} map`,
        }
      : undefined;
  const markers: MapDetailStageMarker[] = [];
  const monstersByKey = new Map(
    monsters.monsters.map((monster) => [monster.key, monster]),
  );
  const connectionsByKey = new Map(
    (connections?.maps ?? []).map((connection) => [connection.key, connection]),
  );
  const npcsByKey = new Map(npcs.npcs.map((npc) => [npc.key, npc]));
  const pointCollections: readonly {
    readonly kind: Exclude<MapDetailStageMarkerKind, 'warp'>;
    readonly collection: MapDetailStagePointCollection;
    readonly describe: (key: string) =>
      | {
          readonly name: string;
          readonly focusKey: string;
          readonly spriteUrl?: string;
        }
      | undefined;
  }[] = [
    {
      kind: 'monster',
      collection: record.monsters,
      describe: (key) => {
        const monster = monstersByKey.get(key);
        return monster === undefined
          ? undefined
          : {
              name: monster.name,
              focusKey: monster.focusKey,
              ...(monster.spriteUrl === undefined
                ? {}
                : { spriteUrl: monster.spriteUrl }),
            };
      },
    },
    {
      kind: 'npc',
      collection: record.npcs,
      describe: (key) => {
        const npc = npcsByKey.get(key);
        return npc === undefined
          ? undefined
          : { name: npc.name, focusKey: npc.focusKey };
      },
    },
    {
      kind: 'connection',
      collection: record.connections,
      describe: (key) => {
        const connection = connectionsByKey.get(key);
        return connection === undefined
          ? undefined
          : {
              name: connection.name,
              focusKey: connection.focusKey,
            };
      },
    },
  ];

  for (const { kind, collection, describe } of pointCollections) {
    if (collection.state !== 'known' && collection.state !== 'partial') {
      continue;
    }

    for (const entity of collection.items) {
      const description = describe(entity.key);
      if (description === undefined) continue;
      markers.push(
        ...projectPointMarkers({
          kind,
          entityKey: entity.key,
          focusKey: description.focusKey,
          name: description.name,
          positions: entity.points,
          ...(description.spriteUrl === undefined
            ? {}
            : { spriteUrl: description.spriteUrl }),
        }),
      );
    }
  }

  const connectors: MapDetailStageConnector[] = [];
  if (record.warps.state === 'known' || record.warps.state === 'partial') {
    for (const warp of warps) {
      const from = `warp:${warp.focusToken}:1`;
      const to = `warp:${warp.focusToken}:2`;
      markers.push(
        ...warp.ends.map(({ x, y }, index) => ({
          id: `warp:${warp.focusToken}:${index + 1}`,
          x,
          y,
          kind: 'warp' as const,
          entityKey: warp.focusToken,
          focusKey: warp.focusKey,
          label: `Warp, Warp, ${index + 1} of ${warp.ends.length}`,
        })),
      );
      connectors.push({
        id: `warp:${warp.focusToken}`,
        from,
        to,
      });
    }
  }

  return {
    ...(image === undefined ? {} : { image }),
    markers,
    connectors,
    positionsUnavailable: image !== undefined && markers.length === 0,
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
  const monsters = projectMonsters({ record, buildId });
  const npcs = projectNpcs(record);
  const warps = projectWarps(record);
  const entities: MapDetailEntityView[] = [
    ...(connections?.maps.map((connection) => ({
      focusKey: connection.focusKey,
      kind: 'connection' as const,
      name: connection.name,
      kindLabel: 'Connection',
      ...(connection.destination === undefined
        ? {}
        : {
            link: {
              to: MAP_DETAIL_ROUTE,
              params: connection.destination.params,
            },
          }),
    })) ?? []),
    ...warps.map((warp) => ({
      focusKey: warp.focusKey,
      kind: 'warp' as const,
      name: 'Warp',
      kindLabel: 'Warp',
    })),
    ...monsters.monsters.map((monster) => ({
      focusKey: monster.focusKey,
      kind: 'monster' as const,
      name: monster.name,
      kindLabel: 'Monster',
      ...(monster.spriteUrl === undefined
        ? {}
        : { spriteUrl: monster.spriteUrl }),
      ...(monster.destination === undefined
        ? {}
        : {
            link: {
              to: MONSTER_DETAIL_ROUTE,
              params: monster.destination.params,
            },
          }),
    })),
    ...npcs.npcs.map((npc) => ({
      focusKey: npc.focusKey,
      kind: 'npc' as const,
      name: npc.name,
      kindLabel: 'NPC',
    })),
  ];
  const stage = projectStage({
    record,
    name: name ?? UNNAMED_MAP_LABEL,
    connections,
    monsters,
    npcs,
    warps,
  });

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
    stage,
    entities,
    facts: projectFacts({ information: record.information, buildId }),
    ...(connections === undefined ? {} : { connections }),
    monsters,
    npcs,
    canonicalPath: buildRecordDetailPath(
      'maps',
      record.slug,
      record.publicId,
      buildId,
    ),
  };
}
