import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { afterEach, describe, expect, it } from 'vitest';
import { commands, page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { SpriteStage } from '@/components/SpriteStage';
import type { SpriteStageProps } from '@/components/SpriteStage';
import ordinarySprite from '@/fixtures/sprite-ordinary.svg?url';
import oversizedSprite from '@/fixtures/sprite-oversized.svg?url';
import smallSprite from '@/fixtures/sprite-small.svg?url';

// Production's stage box and its desktop safe sprite box.
const STAGE_WIDTH = 544;
const STAGE_HEIGHT = 384;
const SPRITE_MAX_WIDTH = 420;
const SPRITE_MAX_HEIGHT = 276;
const hostId = 'sprite-stage-host';

const unavailableMessage = 'No sprite is available for this record.';

async function mountStage(props: Partial<SpriteStageProps> = {}) {
  const screen = await render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <div data-testid={hostId}>
        <SpriteStage
          src={smallSprite}
          name="Synthetic sprite"
          unavailableMessage={unavailableMessage}
          {...props}
        />
      </div>
    </MantineProvider>,
  );
  const image = document.querySelector('img');
  await image?.decode().catch(() => undefined);
  return screen;
}

function stage(): HTMLElement {
  const host = document.querySelector<HTMLElement>(`[data-testid="${hostId}"]`);
  expect(host?.firstElementChild).not.toBeNull();
  return host!.firstElementChild as HTMLElement;
}

function spriteRect(): DOMRect {
  const image = document.querySelector('img');
  expect(image).not.toBeNull();
  return image!.getBoundingClientRect();
}

function decorations(): readonly HTMLElement[] {
  return [...stage().querySelectorAll<HTMLElement>('[aria-hidden="true"]')];
}

/** Order in the markup: floor, glow, contact shadow. */
function glowRect(): DOMRect {
  return decorations()[1]!.getBoundingClientRect();
}

function shadowRect(): DOMRect {
  return decorations()[2]!.getBoundingClientRect();
}

afterEach(async () => {
  await commands.emulateMedia({
    forcedColors: 'none',
    reducedMotion: 'no-preference',
  });
});

describe('SpriteStage sizing', () => {
  it('shows a sprite smaller than the stage at its natural size', async () => {
    await mountStage({ src: smallSprite });

    const sprite = spriteRect();
    expect(Math.round(sprite.width)).toBe(32);
    expect(Math.round(sprite.height)).toBe(32);
    expect(stage().getBoundingClientRect().width).toBe(STAGE_WIDTH);
    expect(stage().getBoundingClientRect().height).toBe(STAGE_HEIGHT);
  });

  it('shows a sprite that fits at its natural size', async () => {
    await mountStage({ src: ordinarySprite });

    const sprite = spriteRect();
    expect(Math.round(sprite.width)).toBe(120);
    expect(Math.round(sprite.height)).toBe(160);
  });

  it('shrinks an oversized sprite to fit without changing its proportions', async () => {
    await mountStage({ src: oversizedSprite, width: 1600, height: 2400 });

    const sprite = spriteRect();
    expect(sprite.width).toBeLessThanOrEqual(SPRITE_MAX_WIDTH + 0.5);
    expect(sprite.height).toBeLessThanOrEqual(SPRITE_MAX_HEIGHT + 0.5);
    // 1600 × 2400 is exactly 2:3; the fitted box keeps that ratio.
    expect(sprite.width / sprite.height).toBeCloseTo(2 / 3, 2);
    // Never enlarged beyond the safe box, and never larger than its natural size.
    expect(sprite.width).toBeLessThanOrEqual(SPRITE_MAX_WIDTH);
    expect(sprite.height).toBeLessThanOrEqual(SPRITE_MAX_HEIGHT);
  });

  it('sizes the light and contact shadow from a small sprite that is shown', async () => {
    await mountStage({ src: smallSprite });

    // Production's light has a 30rem floor, so even a tiny sprite gets it.
    expect(glowRect().width).toBeCloseTo(480, 0);
    // The shipped contact shadow has a 1.625rem minimum.
    expect(shadowRect().width).toBeCloseTo(26, 0);
  });

  it('sizes the light and contact shadow from an ordinary sprite that is shown', async () => {
    await mountStage({ src: ordinarySprite });

    expect(glowRect().width).toBeCloseTo(480, 0);
    expect(shadowRect().width).toBeCloseTo(120 * 0.75, 0);
  });

  it('draws the floor bend across the stage, not around the sprite', async () => {
    await mountStage({ src: smallSprite });

    const floor = decorations()[0]!.getBoundingClientRect();
    const stageBox = stage().getBoundingClientRect();
    expect(Math.round(floor.width)).toBe(Math.round(stageBox.width));
    expect(Math.round(floor.height)).toBe(Math.round(stageBox.height));
  });

  it('passes supplied dimensions through to the image for space reservation', async () => {
    await mountStage({ src: oversizedSprite, width: 1600, height: 2400 });

    const image = document.querySelector('img')!;
    expect(image.getAttribute('width')).toBe('1600');
    expect(image.getAttribute('height')).toBe('2400');
    expect(getComputedStyle(image).aspectRatio).toContain('1600');
    // The stage's own box is fixed, so nothing around it moves either way.
    expect(stage().getBoundingClientRect().height).toBe(STAGE_HEIGHT);
  });
});

describe('SpriteStage unavailable state', () => {
  it('states a missing sprite instead of showing a placeholder', async () => {
    await mountStage({ src: undefined });

    await expect.element(page.getByText(unavailableMessage)).toBeVisible();
    expect(document.querySelector('img')).toBeNull();
    expect(decorations()).toHaveLength(0);
    expect(stage().getBoundingClientRect().width).toBe(STAGE_WIDTH);
    expect(stage().getBoundingClientRect().height).toBe(STAGE_HEIGHT);
  });

  it('states a sprite that fails to load instead of a broken image', async () => {
    await mountStage({ src: 'data:image/png;base64,not-an-image' });

    await expect.element(page.getByText(unavailableMessage)).toBeVisible();
    expect(document.querySelector('img')).toBeNull();
    expect(stage().getBoundingClientRect().width).toBe(STAGE_WIDTH);
  });
});

describe('SpriteStage display preferences', () => {
  it('applies no motion when the user prefers reduced motion', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    await mountStage({ src: ordinarySprite });

    for (const element of [stage(), ...decorations()]) {
      const style = getComputedStyle(element);
      expect(style.animationName).toBe('none');
      expect(style.transitionDuration).toBe('0s');
    }
  });

  it('keeps the stage distinguishable in forced-colours mode', async () => {
    await commands.emulateMedia({ forcedColors: 'active' });
    await mountStage({ src: ordinarySprite });

    const stageStyle = getComputedStyle(stage());
    expect(stageStyle.borderStyle).toBe('solid');
    expect(stageStyle.borderWidth).not.toBe('0px');

    // The sprite keeps its own colours: no forced-colour adjustment on it.
    const imageStyle = getComputedStyle(document.querySelector('img')!);
    expect(imageStyle.forcedColorAdjust).toBe('auto');
    expect(imageStyle.filter).toBe('none');
  });
});
