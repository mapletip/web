import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import '@/styles.css';
import { SpriteStage } from '@/components/SpriteStage';
import type { SpriteStageProps } from '@/components/SpriteStage';

function mount(props: Partial<SpriteStageProps> = {}) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <SpriteStage
        name="Synthetic sprite"
        unavailableMessage="No sprite is available for this record."
        {...props}
      />
    </MantineProvider>,
  );
}

const pedestalSelector = '[aria-hidden="true"]';

describe('SpriteStage', () => {
  it('gives the sprite the host-supplied accessible name', () => {
    mount({ src: '/sprite.svg', name: 'Reef Wanderer' });

    expect(screen.getByRole('img', { name: 'Reef Wanderer' })).toHaveAttribute(
      'src',
      '/sprite.svg',
    );
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('keeps the floor, glow and shadow out of the accessibility tree', () => {
    const { container } = mount({ src: '/sprite.svg' });

    const pedestal = [...container.querySelectorAll(pedestalSelector)];
    expect(pedestal).toHaveLength(3);
    for (const decoration of pedestal) {
      expect(decoration).toBeEmptyDOMElement();
      expect(decoration).not.toHaveAttribute('role');
      expect(decoration).not.toHaveAttribute('alt');
    }

    // The announced sprite is not inside the decorative pedestal.
    const image = screen.getByRole('img');
    for (const decoration of pedestal) {
      expect(decoration.contains(image)).toBe(false);
    }
  });

  it('offers no controls', () => {
    const { container } = mount({ src: '/sprite.svg' });

    for (const role of [
      'button',
      'link',
      'slider',
      'checkbox',
      'radio',
      'textbox',
      'combobox',
      'switch',
    ] as const) {
      expect(screen.queryAllByRole(role)).toHaveLength(0);
    }

    expect(
      container.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]',
      ),
    ).toHaveLength(0);
  });

  it('states that no sprite is available when no source is supplied', () => {
    const { container } = mount();

    expect(
      screen.getByText('No sprite is available for this record.'),
    ).toBeVisible();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(container.querySelectorAll(pedestalSelector)).toHaveLength(0);
    expect(container.querySelector('[data-unavailable="true"]')).not.toBeNull();
  });

  it('replaces a sprite that fails to load with the unavailable message', () => {
    mount({ src: '/missing-sprite.svg' });

    fireEvent.error(screen.getByRole('img'));

    expect(
      screen.getByText('No sprite is available for this record.'),
    ).toBeVisible();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('passes the supplied natural dimensions to the image', () => {
    mount({ src: '/sprite.svg', width: 120, height: 160 });

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('width', '120');
    expect(image).toHaveAttribute('height', '160');
  });

  it('omits dimensions the host does not supply', () => {
    mount({ src: '/sprite.svg' });

    const image = screen.getByRole('img');
    expect(image).not.toHaveAttribute('width');
    expect(image).not.toHaveAttribute('height');
  });
});
