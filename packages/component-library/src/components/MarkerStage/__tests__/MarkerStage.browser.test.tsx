import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { MarkerStage } from '@/components/MarkerStage';
import type {
  MarkerStageMarker,
  MarkerStageView,
} from '@/components/MarkerStage';

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
  await commands.emulateMedia({
    forcedColors: 'none',
    reducedMotion: 'no-preference',
  });
});

describe('MarkerStage selected marker ring', () => {
  it('renders the production selection ring and exposes the marker size', async () => {
    await mount();

    const target = page
      .getByRole('button', { name: 'Selected point' })
      .element();
    const stage = page
      .getByRole('group', { name: 'Synthetic image' })
      .element();
    const ring = getComputedStyle(target, '::before');

    expect(ring.borderColor).toBe('rgb(255, 235, 59)');
    expect(ring.borderStyle).toBe('solid');
    expect(ring.borderWidth).toBe('2px');
    expect(ring.opacity).toBe('0.8');
    expect(
      getComputedStyle(stage).getPropertyValue('--marker-stage-marker-size'),
    ).toBe('clamp(18px, 5cqi, 44px)');
  });

  it('renders the production focus ring above the selected ring on keyboard focus', async () => {
    await mount();
    const target = page.getByRole('button', { name: 'Selected point' });

    await userEvent.tab();
    await expect.element(target).toHaveFocus();

    const focusRing = getComputedStyle(target.element(), '::after');
    expect(focusRing.borderColor).toBe('rgb(255, 235, 59)');
    expect(focusRing.borderStyle).toBe('solid');
    expect(focusRing.borderWidth).toBe('3px');
    expect(focusRing.boxShadow).toBe(
      'rgba(255, 235, 59, 0.58) 0px 0px 0px 4px',
    );
  });

  it('remains visible in forced-colours mode', async () => {
    await commands.emulateMedia({ forcedColors: 'active' });
    await mount();

    const target = page
      .getByRole('button', { name: 'Selected point' })
      .element();
    const style = getComputedStyle(target, '::before');

    expect(style.borderStyle).toBe('solid');
    expect(style.borderWidth).toBe('2px');
    expect(style.borderColor).not.toBe('rgba(0, 0, 0, 0)');
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

  it('closes on Escape after Space activation while focus stays on the marker', async () => {
    await mountWithDetails();

    const target = page.getByRole('button', { name: 'First point' });
    target.element().focus();
    await userEvent.keyboard(' ');
    const details = page.getByText('Details for first');
    await expect.element(details).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.element(details).not.toBeInTheDocument();
    await expect.element(target).toHaveFocus();
  });

  it('closes on Escape from inside details and returns focus to its marker', async () => {
    await mountWithDetails();

    const target = page.getByRole('button', { name: 'First point' });
    await userEvent.click(target);
    const details = page.getByText('Details for first');
    await expect.element(details).toBeVisible();

    const closeButton = page.getByRole('button', { name: 'Close details' });
    closeButton.element().focus();
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

function zoomScale(container: HTMLElement): number {
  const content = container.querySelector<HTMLElement>(
    '.react-transform-component',
  );
  const match = content?.style.transform.match(/scale\(([-\d.]+)\)/u);
  return Number(match?.[1] ?? 1);
}

function markerContent() {
  return (
    <span
      data-testid="marker-glyph"
      aria-hidden="true"
      style={{
        display: 'block',
        width: 'var(--marker-stage-marker-size)',
        height: 'var(--marker-stage-marker-size)',
        borderRadius: '50%',
        background: '#d44',
      }}
    />
  );
}

async function mountInteractiveStage(options?: {
  readonly wheelZoom?: boolean;
  readonly belowContent?: ReactNode;
  readonly zoomInLabel?: string;
  readonly zoomOutLabel?: string;
  readonly fitLabel?: string;
  readonly width?: number;
  readonly view?: MarkerStageView;
  readonly onViewChange?: (view: MarkerStageView | undefined) => void;
  readonly selectedIds?: readonly string[];
  readonly markers?: readonly MarkerStageMarker[];
}) {
  const result = await render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <div
        style={{
          width: `${options?.width ?? 400}px`,
          maxWidth: '100vw',
        }}
      >
        <MarkerStage
          image={{
            src: image,
            width: 400,
            height: 200,
            alt: 'Zoom test image',
          }}
          markers={
            options?.markers ?? [
              {
                id: 'west',
                x: 80,
                y: 100,
                label: 'West point',
                content: markerContent(),
              },
              {
                id: 'east',
                x: 320,
                y: 100,
                label: 'East point',
                content: markerContent(),
              },
            ]
          }
          selectedIds={options?.selectedIds ?? ['west']}
          connectors={[{ id: 'route', from: 'west', to: 'east' }]}
          wheelZoom={options?.wheelZoom ?? false}
          view={options?.view}
          {...(options?.onViewChange === undefined
            ? {}
            : { onViewChange: options.onViewChange })}
          zoomInLabel={options?.zoomInLabel ?? 'Zoom in'}
          zoomOutLabel={options?.zoomOutLabel ?? 'Zoom out'}
          fitLabel={options?.fitLabel ?? 'Fit map'}
          unavailableMessage="Image unavailable."
        />
        {options?.belowContent}
      </div>
    </MantineProvider>,
  );
  return result.container;
}

function expectMarkerAtImagePixel(container: HTMLElement): void {
  const stage = container.querySelector<HTMLElement>(
    '[role="group"][aria-label="Zoom test image"]',
  )!;
  const imageElement = stage.querySelector<HTMLImageElement>('img')!;
  const marker = stage.querySelector<HTMLElement>('[data-marker-id="west"]')!;
  const imageRect = imageElement.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();

  expect(markerRect.left + markerRect.width / 2).toBeCloseTo(
    imageRect.left + (80 / 400) * imageRect.width,
    1,
  );
  expect(markerRect.bottom).toBeCloseTo(
    imageRect.top + (100 / 200) * imageRect.height,
    1,
  );
}

async function mountSelectionHarness() {
  function Harness() {
    const [selectedIds, setSelectedIds] = useState(['west']);
    return (
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        <button type="button" onClick={() => setSelectedIds(['east'])}>
          Select east
        </button>
        <button type="button" onClick={() => setSelectedIds(['west'])}>
          Select west
        </button>
        <div style={{ width: '400px' }}>
          <MarkerStage
            image={{
              src: image,
              width: 400,
              height: 200,
              alt: 'Selection test image',
            }}
            markers={[
              {
                id: 'west',
                x: 80,
                y: 100,
                label: 'West point',
                content: markerContent(),
              },
              {
                id: 'east',
                x: 320,
                y: 100,
                label: 'East point',
                content: markerContent(),
              },
            ]}
            selectedIds={selectedIds}
            unavailableMessage="Image unavailable."
          />
        </div>
      </MantineProvider>
    );
  }

  return (await render(<Harness />)).container;
}

describe('MarkerStage pan and zoom', () => {
  it('keeps markers on image pixels when the stage has a different aspect ratio', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const container = await mountInteractiveStage();
    const stage = container.querySelector<HTMLElement>(
      '[role="group"][aria-label="Zoom test image"]',
    )!;
    stage.style.height = '300px';

    const stageRect = stage.getBoundingClientRect();
    expect(stageRect.width / stageRect.height).toBeCloseTo(4 / 3, 1);
    expectMarkerAtImagePixel(container);

    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }));
    expectMarkerAtImagePixel(container);
  });

  it('keeps interactive controls stacked at the bottom-right of the stage', async () => {
    const container = await mountInteractiveStage();
    const stage = container.querySelector<HTMLElement>(
      '[role="group"][aria-label="Zoom test image"]',
    )!;
    stage.style.height = '300px';

    const controls = page
      .getByRole('group', { name: 'Map controls' })
      .element();
    const stageRect = stage.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    const zoomInRect = page
      .getByRole('button', { name: 'Zoom in' })
      .element()
      .getBoundingClientRect();
    const zoomOutRect = page
      .getByRole('button', { name: 'Zoom out' })
      .element()
      .getBoundingClientRect();
    const fitRect = page
      .getByRole('button', { name: 'Fit map' })
      .element()
      .getBoundingClientRect();

    expect(stageRect.right - controlsRect.right).toBeCloseTo(4, 0);
    expect(stageRect.bottom - controlsRect.bottom).toBeCloseTo(12, 0);
    expect(zoomInRect.top).toBeLessThan(zoomOutRect.top);
    expect(zoomOutRect.top).toBeLessThan(fitRect.top);
  });

  it('steps by square root of two and disables controls at both limits', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const container = await mountInteractiveStage();
    const zoomIn = page.getByRole('button', { name: 'Zoom in' });
    const zoomOut = page.getByRole('button', { name: 'Zoom out' });
    const fit = page.getByRole('button', { name: 'Fit map' });

    expect(zoomOut.element()).toBeEnabled();
    await userEvent.click(zoomIn);
    const firstZoom = zoomScale(container);
    expect(firstZoom).toBeCloseTo(Math.SQRT2);
    await userEvent.click(zoomIn);
    expect(zoomScale(container) / firstZoom).toBeCloseTo(Math.SQRT2, 1);

    await userEvent.click(fit);
    expect(zoomScale(container)).toBeCloseTo(1);
    await userEvent.click(zoomOut);
    await userEvent.click(zoomOut);
    expect(zoomScale(container)).toBeCloseTo(0.5);
    expect(zoomOut.element()).toBeDisabled();

    await userEvent.click(fit);
    for (
      let step = 0;
      step < 10 && !zoomIn.element().hasAttribute('disabled');
      step += 1
    ) {
      await userEvent.click(zoomIn);
    }
    expect(zoomScale(container)).toBeCloseTo(8);
    expect(zoomIn.element()).toBeDisabled();
  });

  it('keeps marker content the same size at maximum zoom', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const container = await mountInteractiveStage();
    const glyph = container.querySelector<HTMLElement>(
      '[data-testid="marker-glyph"]',
    )!;
    const fitted = glyph.getBoundingClientRect();

    const zoomIn = page.getByRole('button', { name: 'Zoom in' });
    for (
      let step = 0;
      step < 8 && !zoomIn.element().hasAttribute('disabled');
      step += 1
    ) {
      await userEvent.click(zoomIn);
    }

    const zoomed = glyph.getBoundingClientRect();
    expect(zoomScale(container)).toBeCloseTo(8);
    expect(zoomed.width).toBeCloseTo(fitted.width);
    expect(zoomed.height).toBeCloseTo(fitted.height);
  });

  it('uses the host supplied control labels as accessible names', async () => {
    await mountInteractiveStage({
      zoomInLabel: 'Enlarge image',
      zoomOutLabel: 'Shrink image',
      fitLabel: 'Show whole image',
    });

    expect(
      page.getByRole('button', { name: 'Enlarge image' }).element(),
    ).toBeEnabled();
    expect(
      page.getByRole('button', { name: 'Shrink image' }).element(),
    ).toBeEnabled();
    expect(
      page.getByRole('button', { name: 'Show whole image' }).element(),
    ).toBeEnabled();
  });

  it('pans by dragging the image', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const container = await mountInteractiveStage();
    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }));

    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const rect = viewport.getBoundingClientRect();
    const content = container.querySelector<HTMLElement>(
      '.react-transform-component',
    )!;
    const before = content.style.transform;
    await commands.dragPointer(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      rect.x + rect.width / 2 - 70,
      rect.y + rect.height / 2,
    );

    expect(content.style.transform).not.toBe(before);
  });

  it('supports a two-finger pinch', async () => {
    const container = await mountInteractiveStage();
    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const rect = viewport.getBoundingClientRect();

    await commands.pinchAt(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      60,
      150,
    );

    expect(zoomScale(container)).toBeGreaterThan(1);
  });

  it('leaves ordinary wheel input available to the page when wheel zoom is off', async () => {
    await page.viewport(400, 500);
    const container = await mountInteractiveStage({
      belowContent: <div style={{ height: '1200px' }} />,
    });
    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const rect = viewport.getBoundingClientRect();

    await commands.wheelAt(rect.x + rect.width / 2, rect.y + 40, 400);

    expect(zoomScale(container)).toBeCloseTo(1);
    const wheel = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    });
    const pageCanScroll = viewport.dispatchEvent(wheel);
    expect(pageCanScroll).toBe(true);
    expect(wheel.defaultPrevented).toBe(false);
  });

  it('zooms with the wheel when the host enables it', async () => {
    const container = await mountInteractiveStage({ wheelZoom: true });
    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const rect = viewport.getBoundingClientRect();

    await commands.wheelAt(rect.x + rect.width / 2, rect.y + 40, -300);
    await new Promise<void>((resolve) => setTimeout(resolve, 250));

    expect(zoomScale(container)).toBeGreaterThan(1);
  });

  it('brings an off-screen changed selection into view without moving visible selections', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const container = await mountSelectionHarness();
    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const east = page.getByRole('button', { name: 'East point' });
    const viewportRect = viewport.getBoundingClientRect();
    const eastRectBefore = east.element().getBoundingClientRect();

    expect(eastRectBefore.right).toBeLessThanOrEqual(viewportRect.right);
    const fittedTransform = container.querySelector<HTMLElement>(
      '.react-transform-component',
    )!.style.transform;
    await userEvent.click(page.getByRole('button', { name: 'Select east' }));
    expect(
      container.querySelector<HTMLElement>('.react-transform-component')!.style
        .transform,
    ).toBe(fittedTransform);

    await userEvent.click(page.getByRole('button', { name: 'Select west' }));
    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }));
    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }));
    const stageRect = viewport.getBoundingClientRect();
    await commands.dragPointer(
      stageRect.x + stageRect.width / 2,
      stageRect.y + stageRect.height / 2,
      stageRect.x + stageRect.width / 2 + 80,
      stageRect.y + stageRect.height / 2,
    );
    const eastBefore = east.element().getBoundingClientRect();
    expect(eastBefore.right).toBeGreaterThan(
      viewport.getBoundingClientRect().right,
    );
    await userEvent.click(page.getByRole('button', { name: 'Select east' }));

    const eastAfter = east.element().getBoundingClientRect();
    const finalViewport = viewport.getBoundingClientRect();
    expect(eastAfter.left).toBeGreaterThanOrEqual(finalViewport.left);
    expect(eastAfter.right).toBeLessThanOrEqual(finalViewport.right);
    expect(eastAfter.top).toBeGreaterThanOrEqual(finalViewport.top);
    expect(eastAfter.bottom).toBeLessThanOrEqual(finalViewport.bottom);
  });

  it('does not add horizontal page scrolling at 320px', async () => {
    await page.viewport(320, 640);
    await mountInteractiveStage();

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  });

  it('reports one settled view after a drag', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const onViewChange = vi.fn<(view: MarkerStageView | undefined) => void>();
    const container = await mountInteractiveStage({ onViewChange });
    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }));
    await expect.poll(() => onViewChange.mock.calls.length).toBe(1);
    onViewChange.mockClear();

    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const rect = viewport.getBoundingClientRect();
    await commands.dragPointer(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      rect.x + rect.width / 2 - 60,
      rect.y + rect.height / 2,
    );

    await expect.poll(() => onViewChange.mock.calls.length).toBe(1);
    expect(onViewChange.mock.calls[0]?.[0]?.zoom).toBeGreaterThan(1);
  });

  it('reports one settled view after a pinch', async () => {
    const onViewChange = vi.fn<(view: MarkerStageView | undefined) => void>();
    const container = await mountInteractiveStage({ onViewChange });
    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const rect = viewport.getBoundingClientRect();

    await commands.pinchAt(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      60,
      150,
    );

    await expect.poll(() => onViewChange.mock.calls.length).toBe(1);
    expect(onViewChange.mock.calls[0]?.[0]?.zoom).toBeGreaterThan(1);
  });

  it('reports one settled view after a wheel burst', async () => {
    const onViewChange = vi.fn<(view: MarkerStageView | undefined) => void>();
    const container = await mountInteractiveStage({
      wheelZoom: true,
      onViewChange,
    });
    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const rect = viewport.getBoundingClientRect();

    await commands.wheelAt(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      -100,
    );
    await commands.wheelAt(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      -100,
    );
    await commands.wheelAt(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      -100,
    );

    await expect.poll(() => onViewChange.mock.calls.length).toBe(1);
    expect(onViewChange.mock.calls[0]?.[0]?.zoom).toBeGreaterThan(1);
  });

  it('reports zoom-in, zoom-out and Fit once each', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const onViewChange = vi.fn<(view: MarkerStageView | undefined) => void>();
    await mountInteractiveStage({ onViewChange });

    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }));
    await expect.poll(() => onViewChange.mock.calls.length).toBe(1);
    expect(onViewChange.mock.calls[0]?.[0]?.zoom).toBeGreaterThan(1);

    await userEvent.click(page.getByRole('button', { name: 'Zoom out' }));
    await expect.poll(() => onViewChange.mock.calls.length).toBe(2);

    await userEvent.click(page.getByRole('button', { name: 'Fit map' }));
    await expect.poll(() => onViewChange.mock.calls.length).toBe(3);
    expect(onViewChange.mock.calls[2]?.[0]).toBeUndefined();
  });

  it('applies a changed saved view without reporting it again', async () => {
    const savedView: MarkerStageView = {
      zoom: 2,
      centerX: 150,
      centerY: 100,
    };
    const onViewChange = vi.fn();

    function Harness() {
      const [view, setView] = useState<MarkerStageView | undefined>();
      return (
        <MantineProvider
          theme={theme}
          cssVariablesResolver={cssVariablesResolver}
          forceColorScheme="dark"
        >
          <button type="button" onClick={() => setView(savedView)}>
            Restore saved view
          </button>
          <div style={{ width: '400px' }}>
            <MarkerStage
              image={{
                src: image,
                width: 400,
                height: 200,
                alt: 'Restored view image',
              }}
              markers={[]}
              view={view}
              onViewChange={onViewChange}
              unavailableMessage="Image unavailable."
            />
          </div>
        </MantineProvider>
      );
    }

    const container = (await render(<Harness />)).container;
    await userEvent.click(
      page.getByRole('button', { name: 'Restore saved view' }),
    );
    await vi.waitFor(() => expect(zoomScale(container)).toBeCloseTo(2));
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it('centres the same image point when a view is restored at two stage sizes', async () => {
    await page.viewport(1400, 800);
    const view: MarkerStageView = { zoom: 2, centerX: 150, centerY: 100 };

    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        {[400, 800].map((width) => (
          <div key={width} data-stage-size={width} style={{ width }}>
            <MarkerStage
              image={{
                src: image,
                width: 400,
                height: 200,
                alt: `Restored ${width}px image`,
              }}
              markers={[
                {
                  id: 'centre',
                  x: 150,
                  y: 100,
                  label: 'Saved centre',
                  content: markerContent(),
                },
              ]}
              selectedIds={[]}
              view={view}
              unavailableMessage="Image unavailable."
            />
          </div>
        ))}
      </MantineProvider>,
    );

    for (const width of [400, 800]) {
      const wrapper = document.querySelector<HTMLElement>(
        `[data-stage-size="${width}"]`,
      )!;
      const stage = wrapper.querySelector<HTMLElement>('[role="group"]')!;
      const point = wrapper
        .querySelector<HTMLElement>('[data-marker-id="centre"]')!
        .getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();

      expect(point.left + point.width / 2).toBeCloseTo(
        stageRect.left + stageRect.width / 2,
        0,
      );
      expect(point.bottom).toBeCloseTo(stageRect.top + stageRect.height / 2, 0);
    }
  });

  it('keeps the restored view when the initial selection is off screen', async () => {
    const view: MarkerStageView = { zoom: 2, centerX: 100, centerY: 100 };
    const container = await mountInteractiveStage({
      view,
      selectedIds: ['east'],
    });
    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const east = page.getByRole('button', { name: 'East point' }).element();

    await vi.waitFor(() => expect(zoomScale(container)).toBeCloseTo(2));
    const viewportRect = viewport.getBoundingClientRect();
    expect(east.getBoundingClientRect().left).toBeGreaterThan(
      viewportRect.right,
    );
  });
});
