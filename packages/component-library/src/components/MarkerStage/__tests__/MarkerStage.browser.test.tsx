import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { afterEach, describe, expect, it } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { MarkerStage } from '@/components/MarkerStage';

const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#789"/></svg>')}`;

async function mount() {
  await render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <MarkerStage
        image={{
          src: image,
          width: 400,
          height: 200,
          alt: 'Synthetic image',
        }}
        markers={[
          {
            id: 'selected',
            x: 100,
            y: 50,
            label: 'Selected point',
            content: <span aria-hidden="true">A</span>,
          },
        ]}
        selectedIds={['selected']}
        unavailableMessage="Image unavailable."
      />
    </MantineProvider>,
  );
}

async function mountWithDetails() {
  await render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <MarkerStage
        image={{
          src: image,
          width: 400,
          height: 200,
          alt: 'Synthetic image',
        }}
        markers={[
          {
            id: 'first',
            x: 100,
            y: 50,
            label: 'First point',
            content: <span aria-hidden="true">A</span>,
          },
          {
            id: 'second',
            x: 300,
            y: 150,
            label: 'Second point',
            content: <span aria-hidden="true">B</span>,
          },
        ]}
        renderDetails={(markerIds) => <p>Details for {markerIds.join(', ')}</p>}
        unavailableMessage="Image unavailable."
      />
    </MantineProvider>,
  );
}

afterEach(async () => {
  await commands.emulateMedia({ forcedColors: 'none' });
});

describe('MarkerStage selected marker ring', () => {
  it('remains visible in forced-colours mode', async () => {
    await commands.emulateMedia({ forcedColors: 'active' });
    await mount();

    const target = page
      .getByRole('button', { name: 'Selected point' })
      .element();
    const style = getComputedStyle(target);

    expect(style.outlineStyle).toBe('solid');
    expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThan(0);
    expect(style.outlineOffset).toBe('2px');
  });
});

describe('MarkerStage marker details', () => {
  it('closes from the close control and returns focus to its target', async () => {
    await mountWithDetails();

    const target = page.getByRole('button', { name: 'First point' });
    await userEvent.click(target);
    const details = page.getByText('Details for first');
    await expect.element(details).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Close details' }));

    await expect.element(details).not.toBeInTheDocument();
    await expect.element(target).toHaveFocus();
  });

  it('closes on Escape and returns focus to its target', async () => {
    await mountWithDetails();

    const target = page.getByRole('button', { name: 'First point' });
    await userEvent.click(target);
    const details = page.getByText('Details for first');
    await expect.element(details).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.element(details).not.toBeInTheDocument();
    await expect.element(target).toHaveFocus();
  });

  it('moves details to another activated target and keeps them open on repeat activation', async () => {
    await mountWithDetails();

    const firstTarget = page.getByRole('button', { name: 'First point' });
    const secondTarget = page.getByRole('button', { name: 'Second point' });
    await userEvent.click(firstTarget);
    await expect.element(page.getByText('Details for first')).toBeVisible();

    await userEvent.click(secondTarget);
    const secondDetails = page.getByText('Details for second');
    await expect.element(secondDetails).toBeVisible();
    await expect
      .element(page.getByText('Details for first'))
      .not.toBeInTheDocument();
    await expect.element(secondTarget).toHaveFocus();

    await userEvent.click(secondTarget);
    await expect.element(secondDetails).toBeVisible();
  });

  it('closes when the player clicks outside the details panel', async () => {
    await mountWithDetails();

    await userEvent.click(page.getByRole('button', { name: 'First point' }));
    const details = page.getByText('Details for first');
    await expect.element(details).toBeVisible();

    await userEvent.click(page.getByRole('group', { name: 'Synthetic image' }));

    await expect.element(details).not.toBeInTheDocument();
  });
});
