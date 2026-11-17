import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';

import portalImage from '@/assets/maplestory/maps/minimap-portal.png?no-inline';

import classes from '../MapDetail/MapDetail.module.css';
import { EntityIcon, MarkerContent } from '../MapDetail/markers';
import type { MapDetailEntityView, MapDetailStageMarker } from '../project';

const styles = readFileSync(
  'src/features/maps/detail/MapDetail/MapDetail.module.css',
  'utf8',
);

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
  it('renders the production portal image for a Connection marker', () => {
    const { container } = render(
      <MarkerContent marker={stageMarker('connection')} />,
    );
    const visual = container.querySelector('[data-marker-visual="connection"]');
    const image = visual?.querySelector('img');

    expect(image).toHaveAttribute('src', portalImage);
    expect(image).toHaveAttribute('alt', '');
    expect(styles).toMatch(
      /\.connectionMarker\s*\{[^}]*height:\s*24px;[^}]*width:\s*24px;/su,
    );
    expect(styles).toMatch(/\.portalImage\s*\{[^}]*object-fit:\s*contain;/su);
  });

  it('renders the filtered portal inside the production Warp ring', () => {
    const { container } = render(
      <MarkerContent marker={stageMarker('warp')} />,
    );
    const visual = container.querySelector('[data-marker-visual="warp"]');

    expect(visual?.className).toContain(classes['warpMarker']);
    expect(visual?.querySelector('img')?.className).toContain(
      classes['warpImage'],
    );
    expect(visual?.querySelector('img')).toHaveAttribute('src', portalImage);
    expect(styles).toContain('filter: hue-rotate(115deg) saturate(1.45);');
    expect(styles).toContain(
      'box-shadow: 0 0 0 1px var(--map-detail-marker-warp-ring-color);',
    );
    expect(styles).toMatch(
      /\.warpMarker\s*\{[^}]*height:\s*22px;[^}]*padding:\s*2px;[^}]*width:\s*22px;/su,
    );
  });

  it('sizes Monster sprites by the stage custom property and keeps them pixelated', () => {
    const { container } = render(
      <MarkerContent marker={stageMarker('monster', '/sprites/monster.png')} />,
    );
    const sprite = container.querySelector(
      '[data-marker-visual="monster-sprite"]',
    );

    expect(sprite).toHaveAttribute('src', '/sprites/monster.png');
    expect(sprite?.className).toContain(classes['stageMonsterSprite']);
    expect(styles).toMatch(
      /\.stageMonsterSprite\s*\{[^}]*height:\s*var\(--marker-stage-marker-size\);[^}]*width:\s*var\(--marker-stage-marker-size\);/su,
    );
    expect(styles).toContain('image-rendering: pixelated;');
    expect(styles).toContain('object-fit: contain;');
  });

  it('renders the production Monster fallback dot', () => {
    const { container } = render(
      <MarkerContent marker={stageMarker('monster')} />,
    );
    const visual = container.querySelector(
      '[data-marker-visual="monster-dot"]',
    );

    expect(visual?.className).toContain(classes['monsterDot']);
    expect(styles).toContain('--map-detail-marker-monster-color: #ffd166;');
    expect(styles).toMatch(/\.monsterDot\s*\{[^}]*border-radius:\s*50%;/su);
    expect(styles).toMatch(
      /\.monsterDot,\s*\.npcDot\s*\{[^}]*height:\s*10px;[^}]*width:\s*10px;/su,
    );
  });

  it('renders every NPC as the production square fallback', () => {
    const { container } = render(<MarkerContent marker={stageMarker('npc')} />);
    const visual = container.querySelector('[data-marker-visual="npc-dot"]');

    expect(visual?.className).toContain(classes['npcDot']);
    expect(styles).toContain('--map-detail-marker-npc-color: #20c997;');
    expect(styles).not.toMatch(/\.npcDot\s*\{[^}]*border-radius:/su);
    expect(visual?.querySelector('img')).toBeNull();
  });

  it('uses the same production visuals in detail icons', () => {
    const connection = render(<EntityIcon entity={entity('connection')} />);
    expect(connection.container.querySelector('img')).toHaveAttribute(
      'src',
      portalImage,
    );
    connection.unmount();

    const warp = render(<EntityIcon entity={entity('warp')} />);
    expect(
      warp.container.querySelector('[data-marker-visual="warp"]')?.className,
    ).toContain(classes['warpMarker']);
    warp.unmount();

    const monster = render(
      <EntityIcon entity={entity('monster', '/sprites/monster.png')} />,
    );
    expect(
      monster.container.querySelector('[data-marker-visual="monster-sprite"]')
        ?.className,
    ).toContain(classes['detailMonsterSprite']);
    expect(styles).toMatch(
      /\.detailMonsterSprite\s*\{[^}]*height:\s*24px;[^}]*width:\s*24px;/su,
    );
    monster.unmount();

    const npc = render(<EntityIcon entity={entity('npc')} />);
    expect(
      npc.container.querySelector('[data-marker-visual="npc-dot"]')?.className,
    ).toContain(classes['npcDot']);
  });
});
