import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import portalImage from '@/assets/maplestory/maps/minimap-portal.png?no-inline';

import { EntityIcon, MarkerContent } from '../MapDetail/markers';
import type { MapDetailEntityView, MapDetailStageMarker } from '../project';

afterEach(cleanup);

function stageMarker(
  kind: MapDetailStageMarker['kind'],
  spriteUrl?: string,
): MapDetailStageMarker {
  return {
    id: `test:${kind}`,
    x: 10,
    y: 20,
    kind,
    entityKey: 'test-entity',
    focusKey: 'test-focus',
    label: `${kind} marker`,
    ...(spriteUrl === undefined ? {} : { spriteUrl }),
  };
}

function entity(
  kind: MapDetailEntityView['kind'],
  spriteUrl?: string,
): MapDetailEntityView {
  return {
    focusKey: 'test-focus',
    kind,
    name: `${kind} entity`,
    kindLabel: kind,
    ...(spriteUrl === undefined ? {} : { spriteUrl }),
  };
}

describe('Map Detail markers', () => {
  it('renders the portal image for Connection and Warp markers', () => {
    const connection = render(
      <MarkerContent marker={stageMarker('connection')} />,
    );
    expect(
      connection.container.querySelector('[data-marker-visual="connection"]'),
    ).toBeInTheDocument();
    expect(connection.container.querySelector('img')).toHaveAttribute(
      'src',
      portalImage,
    );
    connection.unmount();

    const warp = render(<MarkerContent marker={stageMarker('warp')} />);
    expect(
      warp.container.querySelector('[data-marker-visual="warp"] img'),
    ).toHaveAttribute('src', portalImage);
  });

  it('renders Monster sprites and fallback markers', () => {
    const sprite = render(
      <MarkerContent marker={stageMarker('monster', '/sprites/monster.png')} />,
    );
    expect(
      sprite.container.querySelector('[data-marker-visual="monster-sprite"]'),
    ).toHaveAttribute('src', '/sprites/monster.png');
    sprite.unmount();

    const monsterDot = render(
      <MarkerContent marker={stageMarker('monster')} />,
    );
    expect(
      monsterDot.container.querySelector('[data-marker-visual="monster-dot"]'),
    ).toBeInTheDocument();
    monsterDot.unmount();

    const npcSprite = render(
      <MarkerContent marker={stageMarker('npc', '/sprites/npc.png')} />,
    );
    expect(
      npcSprite.container.querySelector('[data-marker-visual="npc-sprite"]'),
    ).toHaveAttribute('src', '/sprites/npc.png');
    npcSprite.unmount();

    const npcDot = render(<MarkerContent marker={stageMarker('npc')} />);
    expect(
      npcDot.container.querySelector('[data-marker-visual="npc-dot"]'),
    ).toBeInTheDocument();
    expect(npcDot.container.querySelector('img')).toBeNull();
  });

  it('renders the same entity content in details and map legends', () => {
    const connection = render(<EntityIcon entity={entity('connection')} />);
    expect(connection.container.querySelector('img')).toHaveAttribute(
      'src',
      portalImage,
    );
    connection.unmount();

    const warp = render(<EntityIcon entity={entity('warp')} />);
    expect(
      warp.container.querySelector('[data-marker-visual="warp"]'),
    ).toBeInTheDocument();
    warp.unmount();

    const monster = render(
      <EntityIcon entity={entity('monster', '/sprites/monster.png')} />,
    );
    expect(
      monster.container.querySelector('[data-marker-visual="monster-sprite"]'),
    ).toHaveAttribute('src', '/sprites/monster.png');
    monster.unmount();

    const npc = render(
      <EntityIcon entity={entity('npc', '/sprites/npc.png')} />,
    );
    expect(
      npc.container.querySelector('[data-marker-visual="npc-sprite"]'),
    ).toHaveAttribute('src', '/sprites/npc.png');
    npc.unmount();

    const npcDot = render(<EntityIcon entity={entity('npc')} />);
    expect(
      npcDot.container.querySelector('[data-marker-visual="npc-dot"]'),
    ).toBeInTheDocument();
  });
});
