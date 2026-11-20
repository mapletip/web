import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { commands, page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { InteractiveMap } from '@/components/InteractiveMap';
import type {
  InteractiveMapMarker,
  InteractiveMapView,
} from '@/components/InteractiveMap';

const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#789"/></svg>')}`;

function expectCenterdRing(style: CSSStyleDeclaration, target: Element): void {
  const targetRect = target.getBoundingClientRect();
  expect(Number.parseFloat(style.top)).toBeCloseTo(targetRect.height / 2, 1);
  expect(Number.parseFloat(style.left)).toBeCloseTo(targetRect.width / 2, 1);

  const transform = new DOMMatrixReadOnly(style.transform);
  const halfSize = Number.parseFloat(style.width) / 2;
  expect(transform.e).toBeCloseTo(-halfSize, 1);
  expect(transform.f).toBeCloseTo(-halfSize, 1);
}

async function mount() {
  await render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <InteractiveMap
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
      <InteractiveMap
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

describe('InteractiveMap selected marker ring', () => {
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
    expectCenterdRing(ring, target);
    expect(
      getComputedStyle(stage).getPropertyValue('--interactive-map-marker-size'),
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
    expectCenterdRing(focusRing, target.element());
    expect(focusRing.boxShadow).toBe(
      'rgba(255, 235, 59, 0.58) 0px 0px 0px 4px',
    );
  });

  it('remains visible in forced-colors mode', async () => {
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

describe('InteractiveMap image layout', () => {
  it('keeps the supplied image aspect ratio after the image fails', async () => {
    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        <InteractiveMap
          image={{
            src: 'data:image/png;base64,not-an-image',
            width: 400,
            height: 100,
            alt: 'Broken test image',
          }}
          markers={[]}
          unavailableMessage="Image unavailable."
        />
      </MantineProvider>,
    );

    await expect.element(page.getByText('Image unavailable.')).toBeVisible();
    const stage = page
      .getByRole('group', { name: 'Image unavailable.' })
      .element();
    expect(stage.style.aspectRatio).toBe('');
    expect(stage).toHaveAttribute('data-unavailable', 'true');
    expect(getComputedStyle(stage).height).toBe('160px');
    expect(
      stage.style.getPropertyValue('--interactive-map-image-aspect-ratio'),
    ).toBe('4');
  });
});

describe('InteractiveMap marker details', () => {
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
        width: 'var(--interactive-map-marker-size)',
        height: 'var(--interactive-map-marker-size)',
        borderRadius: '50%',
        background: '#d44',
      }}
    />
  );
}

function smallMarkerDotContent() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        width: 10,
        height: 10,
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
  readonly imageWidth?: number;
  readonly imageHeight?: number;
  readonly view?: InteractiveMapView;
  readonly onViewChange?: (view: InteractiveMapView | undefined) => void;
  readonly onActivate?: (markerIds: readonly string[]) => void;
  readonly selectedIds?: readonly string[];
  readonly markers?: readonly InteractiveMapMarker[];
  readonly interactive?: boolean;
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
        <InteractiveMap
          image={{
            src: image,
            width: options?.imageWidth ?? 400,
            height: options?.imageHeight ?? 200,
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
          {...(options?.onActivate === undefined
            ? {}
            : { onActivate: options.onActivate })}
          connectors={[{ id: 'route', from: 'west', to: 'east' }]}
          interactive={options?.interactive ?? true}
          wheelZoom={options?.wheelZoom ?? false}
          view={options?.view}
          {...(options?.onViewChange === undefined
            ? {}
            : { onViewChange: options.onViewChange })}
          zoomInLabel={options?.zoomInLabel ?? 'Zoom in'}
          zoomOutLabel={options?.zoomOutLabel ?? 'Zoom out'}
          fitLabel={options?.fitLabel ?? 'Fit'}
          unavailableMessage="Image unavailable."
        />
        {options?.belowContent}
      </div>
    </MantineProvider>,
  );
  return result.container;
}

function expectImageCenteredInStage(container: HTMLElement): void {
  const stage = container.querySelector<HTMLElement>(
    '[role="group"][aria-label="Zoom test image"]',
  )!;
  const imageElement = stage.querySelector<HTMLImageElement>('img')!;
  const stageRect = stage.getBoundingClientRect();
  const imageRect = imageElement.getBoundingClientRect();

  expect(imageRect.left + imageRect.width / 2).toBeCloseTo(
    stageRect.left + stageRect.width / 2,
    0,
  );
  expect(imageRect.top + imageRect.height / 2).toBeCloseTo(
    stageRect.top + stageRect.height / 2,
    0,
  );
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
  expect(markerRect.top + markerRect.height / 2).toBeCloseTo(
    imageRect.top + (100 / 200) * imageRect.height,
    1,
  );
}

async function mountSelectionHarness(options?: {
  readonly onViewChange?: (view: InteractiveMapView | undefined) => void;
}) {
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
          <InteractiveMap
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
            {...(options?.onViewChange === undefined
              ? {}
              : { onViewChange: options.onViewChange })}
            unavailableMessage="Image unavailable."
          />
        </div>
      </MantineProvider>
    );
  }

  return (await render(<Harness />)).container;
}

describe('InteractiveMap pan and zoom', () => {
  it.each([
    { shape: 'tall', imageWidth: 300, imageHeight: 900 },
    { shape: 'wide', imageWidth: 1200, imageHeight: 200 },
  ])(
    'bounds a $shape image and centers it on init and Fit',
    async ({ imageWidth, imageHeight }) => {
      await page.viewport(1440, 900);
      const onViewChange =
        vi.fn<(view: InteractiveMapView | undefined) => void>();
      const container = await mountInteractiveStage({
        width: 1000,
        imageWidth,
        imageHeight,
        onViewChange,
      });
      const stage = container.querySelector<HTMLElement>(
        '[role="group"][aria-label="Zoom test image"]',
      )!;
      const stageRect = stage.getBoundingClientRect();
      const imageRect = stage.querySelector('img')!.getBoundingClientRect();

      expect(stageRect.height).toBe(400);
      expect(imageRect.left).toBeGreaterThanOrEqual(stageRect.left);
      expect(imageRect.right).toBeLessThanOrEqual(stageRect.right);
      expect(imageRect.top).toBeGreaterThanOrEqual(stageRect.top);
      expect(imageRect.bottom).toBeLessThanOrEqual(stageRect.bottom);
      expectImageCenteredInStage(container);

      await userEvent.click(page.getByRole('button', { name: 'Zoom in' }));
      await expect.poll(() => zoomScale(container)).toBeGreaterThan(1);
      await userEvent.click(page.getByRole('button', { name: 'Fit' }));
      await expect.poll(() => zoomScale(container)).toBeCloseTo(1);
      await expect
        .poll(() => onViewChange.mock.calls.at(-1)?.[0])
        .toBeUndefined();
      expectImageCenteredInStage(container);
    },
  );

  it('centers static and hydrated images the same way with letterboxing', async () => {
    await page.viewport(1440, 900);
    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        {[false, true].map((interactive) => (
          <div
            key={String(interactive)}
            data-position-mode={interactive ? 'interactive' : 'static'}
            style={{ width: 600 }}
          >
            <InteractiveMap
              image={{
                src: image,
                width: 200,
                height: 400,
                alt: 'Letterboxed image',
              }}
              markers={[
                {
                  id: 'center',
                  x: 100,
                  y: 200,
                  label: 'Image center',
                  content: markerContent(),
                },
              ]}
              interactive={interactive}
              unavailableMessage="Image unavailable."
            />
          </div>
        ))}
      </MantineProvider>,
    );

    const imageRects = ['static', 'interactive'].map((mode) => {
      const stage = document.querySelector<HTMLElement>(
        `[data-position-mode="${mode}"] [role="group"]`,
      )!;
      const stageRect = stage.getBoundingClientRect();
      const imageRect = stage.querySelector('img')!.getBoundingClientRect();

      expect(imageRect.left + imageRect.width / 2).toBeCloseTo(
        stageRect.left + stageRect.width / 2,
        0,
      );
      expect(imageRect.top + imageRect.height / 2).toBeCloseTo(
        stageRect.top + stageRect.height / 2,
        0,
      );

      return imageRect;
    });

    expect(imageRects[0]!.width).toBeCloseTo(imageRects[1]!.width, 0);
    expect(imageRects[0]!.height).toBeCloseTo(imageRects[1]!.height, 0);
  });

  it('keeps the phone frame bounded for a wide image', async () => {
    await page.viewport(390, 844);
    const container = await mountInteractiveStage({
      width: 390,
      imageWidth: 1200,
      imageHeight: 200,
    });
    const stage = container.querySelector<HTMLElement>(
      '[role="group"][aria-label="Zoom test image"]',
    )!;

    expect(stage.getBoundingClientRect().height).toBe(232);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
  });

  it('uses the tablet frame height at the tablet breakpoint', async () => {
    await page.viewport(800, 900);
    const container = await mountInteractiveStage({ width: 800 });
    const stage = container.querySelector<HTMLElement>(
      '[role="group"][aria-label="Zoom test image"]',
    )!;

    expect(stage.getBoundingClientRect().height).toBe(360);
  });

  it('lets adjacent marker visuals receive pointer clicks and keyboard focus', async () => {
    const onActivate = vi.fn<(markerIds: readonly string[]) => void>();
    await mountInteractiveStage({
      width: 400,
      onActivate,
      selectedIds: [],
      markers: [
        {
          id: 'first',
          x: 180,
          y: 100,
          label: 'First nearby point',
          content: smallMarkerDotContent(),
        },
        {
          id: 'second',
          x: 216,
          y: 100,
          label: 'Second nearby point',
          content: smallMarkerDotContent(),
        },
      ],
    });
    const first = page.getByRole('button', { name: 'First nearby point' });
    const second = page.getByRole('button', { name: 'Second nearby point' });
    const firstRect = first.element().getBoundingClientRect();
    const secondRect = second.element().getBoundingClientRect();
    const firstContentRect = first
      .element()
      .firstElementChild!.getBoundingClientRect();

    expect(firstRect.width).toBe(44);
    expect(firstContentRect.width).toBe(16);
    expect(firstRect.right).toBeGreaterThan(secondRect.left);

    await userEvent.tab();
    await expect.element(first).toHaveFocus();
    await userEvent.tab();
    await expect.element(second).toHaveFocus();

    await userEvent.click(first);
    await userEvent.click(second);
    expect(onActivate.mock.calls).toEqual([[['first']], [['second']]]);
  });

  it('keeps marker centers on image pixels when the stage has a different aspect ratio', async () => {
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

  it('centers static markers on their image pixels', async () => {
    const container = await mountInteractiveStage({ interactive: false });
    expect(container.querySelector('[data-marker-id="west"]')).not.toBeNull();
    expectMarkerAtImagePixel(container);
  });

  it('keeps interactive controls stacked at the bottom-right of the stage', async () => {
    const container = await mountInteractiveStage();
    const stage = container.querySelector<HTMLElement>(
      '[role="group"][aria-label="Zoom test image"]',
    )!;
    stage.style.height = '300px';

    const controls = page
      .getByRole('group', { name: 'Stage controls' })
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
      .getByRole('button', { name: 'Fit' })
      .element()
      .getBoundingClientRect();

    expect(stageRect.right - controlsRect.right).toBeCloseTo(8, 0);
    expect(stageRect.bottom - controlsRect.bottom).toBeCloseTo(8, 0);
    // One attached bar: each 28px button starts where the one above ends.
    expect(zoomInRect.height).toBeCloseTo(28, 0);
    expect(zoomOutRect.top).toBeCloseTo(zoomInRect.bottom, 0);
    expect(fitRect.top).toBeCloseTo(zoomOutRect.bottom, 0);
  });

  it('steps by square root of two and disables controls at both limits', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const container = await mountInteractiveStage();
    const zoomIn = page.getByRole('button', { name: 'Zoom in' });
    const zoomOut = page.getByRole('button', { name: 'Zoom out' });
    const fit = page.getByRole('button', { name: 'Fit' });

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

  it('keeps the target and both rings the same size from 0.5x to 8x', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    function Harness() {
      const [view, setView] = useState<InteractiveMapView | undefined>();
      return (
        <MantineProvider
          theme={theme}
          cssVariablesResolver={cssVariablesResolver}
          forceColorScheme="dark"
        >
          <button
            type="button"
            onClick={() => setView({ zoom: 8, centerX: 200, centerY: 100 })}
          >
            Zoom to 8x
          </button>
          <button
            type="button"
            onClick={() => setView({ zoom: 0.5, centerX: 200, centerY: 100 })}
          >
            Zoom to 0.5x
          </button>
          <div style={{ width: '400px' }}>
            <InteractiveMap
              image={{
                src: image,
                width: 400,
                height: 200,
                alt: 'Zoom size test image',
              }}
              markers={[
                {
                  id: 'west',
                  x: 80,
                  y: 100,
                  label: 'West point',
                  content: markerContent(),
                },
              ]}
              selectedIds={['west']}
              view={view}
              unavailableMessage="Image unavailable."
            />
          </div>
        </MantineProvider>
      );
    }
    const container = (await render(<Harness />)).container;
    const target = page.getByRole('button', { name: 'West point' });

    function sizeAtCurrentZoom() {
      const button = target.element();
      const bounds = button.getBoundingClientRect();
      const selectionRing = getComputedStyle(button, '::before');
      const focusRing = getComputedStyle(button, '::after');
      return {
        hitWidth: bounds.width,
        hitHeight: bounds.height,
        selectionWidth: selectionRing.width,
        selectionHeight: selectionRing.height,
        focusWidth: focusRing.width,
        focusHeight: focusRing.height,
      };
    }

    async function focusWithVisibleRing() {
      target.element().focus();
      await userEvent.keyboard('{Enter}');
      await expect.element(target).toHaveFocus();
    }

    await focusWithVisibleRing();
    const fittedSize = sizeAtCurrentZoom();

    await userEvent.click(page.getByRole('button', { name: 'Zoom to 8x' }));
    await expect.poll(() => zoomScale(container)).toBeCloseTo(8);
    await focusWithVisibleRing();
    const maximumSize = sizeAtCurrentZoom();

    await userEvent.click(page.getByRole('button', { name: 'Zoom to 0.5x' }));
    await expect.poll(() => zoomScale(container)).toBeCloseTo(0.5);
    await focusWithVisibleRing();
    const minimumSize = sizeAtCurrentZoom();

    expect(maximumSize).toEqual(fittedSize);
    expect(minimumSize).toEqual(fittedSize);
    expect(fittedSize.hitWidth).toBe(44);
    expect(fittedSize.hitHeight).toBe(44);
    expect(fittedSize.selectionWidth).not.toBe('auto');
    expect(fittedSize.focusWidth).not.toBe('auto');
  });

  it('keeps edge marker details at the unzoomed size and inside the stage at 4x', async () => {
    function Harness() {
      const [view, setView] = useState<InteractiveMapView | undefined>();
      return (
        <MantineProvider
          theme={theme}
          cssVariablesResolver={cssVariablesResolver}
          forceColorScheme="dark"
        >
          <button
            type="button"
            onClick={() => setView({ zoom: 4, centerX: 350, centerY: 25 })}
          >
            Zoom to edge
          </button>
          <div style={{ width: 400 }}>
            <InteractiveMap
              image={{
                src: image,
                width: 400,
                height: 200,
                alt: 'Edge test image',
              }}
              markers={[
                {
                  id: 'edge',
                  x: 380,
                  y: 50,
                  label: 'Edge point',
                  content: markerContent(),
                },
              ]}
              view={view}
              onViewChange={setView}
              renderDetails={() => (
                <div style={{ width: 180, fontSize: 14 }}>
                  Details near the edge
                </div>
              )}
              unavailableMessage="Image unavailable."
            />
          </div>
        </MantineProvider>
      );
    }

    await render(<Harness />);
    const stage = page.getByRole('group', { name: 'Edge test image' });
    const marker = page.getByRole('button', { name: 'Edge point' });
    await userEvent.click(marker);
    const details = page.getByText('Details near the edge');
    await expect.element(details).toBeVisible();
    const initialDropdown = document.querySelector<HTMLElement>(
      '.mantine-Popover-dropdown',
    );
    expect(initialDropdown).not.toBeNull();
    if (initialDropdown === null)
      throw new Error('Details dropdown is missing.');
    const initialWidth = initialDropdown.getBoundingClientRect().width;
    const initialFontSize = getComputedStyle(initialDropdown).fontSize;

    await userEvent.click(page.getByRole('button', { name: 'Close details' }));
    await userEvent.click(page.getByRole('button', { name: 'Zoom to edge' }));
    await expect
      .poll(() => zoomScale(stage.element().parentElement!))
      .toBeCloseTo(4);
    await userEvent.click(marker);
    await expect.element(details).toBeVisible();

    const dropdown = document.querySelector<HTMLElement>(
      '.mantine-Popover-dropdown',
    );
    expect(dropdown).not.toBeNull();
    if (dropdown === null) throw new Error('Details dropdown is missing.');
    const dropdownRect = dropdown.getBoundingClientRect();
    const stageRect = stage.element().getBoundingClientRect();
    expect(dropdownRect.width).toBeCloseTo(initialWidth);
    expect(getComputedStyle(dropdown).fontSize).toBe(initialFontSize);
    expect(stage.element().contains(dropdown)).toBe(true);
    expect(dropdownRect.left).toBeGreaterThanOrEqual(stageRect.left);
    expect(dropdownRect.right).toBeLessThanOrEqual(stageRect.right);
    expect(dropdownRect.top).toBeGreaterThanOrEqual(stageRect.top);
    expect(dropdownRect.bottom).toBeLessThanOrEqual(stageRect.bottom);
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
    await commands.dragPointer({
      startX: rect.x + rect.width / 2,
      startY: rect.y + rect.height / 2,
      endX: rect.x + rect.width / 2 - 70,
      endY: rect.y + rect.height / 2,
    });

    expect(content.style.transform).not.toBe(before);
  });

  it('supports a two-finger pinch', async () => {
    const container = await mountInteractiveStage();
    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const rect = viewport.getBoundingClientRect();

    await commands.pinchAt({
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      startDistance: 60,
      endDistance: 150,
    });

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

    await commands.wheelAt({
      x: rect.x + rect.width / 2,
      y: rect.y + 40,
      deltaY: 400,
    });

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

    await commands.wheelAt({
      x: rect.x + rect.width / 2,
      y: rect.y + 40,
      deltaY: -300,
    });
    await expect.poll(() => zoomScale(container)).toBeGreaterThan(1);

    expect(zoomScale(container)).toBeGreaterThan(1);
  });

  it('brings an off-screen changed selection into view without moving visible selections', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const onViewChange =
      vi.fn<(view: InteractiveMapView | undefined) => void>();
    const container = await mountSelectionHarness({ onViewChange });
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
    await commands.dragPointer({
      startX: stageRect.x + stageRect.width / 2,
      startY: stageRect.y + stageRect.height / 2,
      endX: stageRect.x + stageRect.width / 2 + 80,
      endY: stageRect.y + stageRect.height / 2,
    });
    const eastBefore = east.element().getBoundingClientRect();
    expect(eastBefore.right).toBeGreaterThan(
      viewport.getBoundingClientRect().right,
    );
    onViewChange.mockClear();
    await userEvent.click(page.getByRole('button', { name: 'Select east' }));
    await expect.poll(() => onViewChange.mock.calls.length).toBe(1);

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
    const onViewChange =
      vi.fn<(view: InteractiveMapView | undefined) => void>();
    const container = await mountInteractiveStage({ onViewChange });
    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }));
    await expect.poll(() => onViewChange.mock.calls.length).toBe(1);
    onViewChange.mockClear();

    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const rect = viewport.getBoundingClientRect();
    await commands.dragPointer({
      startX: rect.x + rect.width / 2,
      startY: rect.y + rect.height / 2,
      endX: rect.x + rect.width / 2 - 60,
      endY: rect.y + rect.height / 2,
    });

    await expect.poll(() => onViewChange.mock.calls.length).toBe(1);
    expect(onViewChange.mock.calls[0]?.[0]?.zoom).toBeGreaterThan(1);
  });

  it('reports one settled view after a pinch', async () => {
    const onViewChange =
      vi.fn<(view: InteractiveMapView | undefined) => void>();
    const container = await mountInteractiveStage({ onViewChange });
    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const rect = viewport.getBoundingClientRect();

    await commands.pinchAt({
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      startDistance: 60,
      endDistance: 150,
    });

    await expect.poll(() => onViewChange.mock.calls.length).toBe(1);
    expect(onViewChange.mock.calls[0]?.[0]?.zoom).toBeGreaterThan(1);
  });

  it('reports one settled view after a wheel burst', async () => {
    const onViewChange =
      vi.fn<(view: InteractiveMapView | undefined) => void>();
    const container = await mountInteractiveStage({
      wheelZoom: true,
      onViewChange,
    });
    const viewport = container.querySelector<HTMLElement>(
      '.react-transform-wrapper',
    )!;
    const rect = viewport.getBoundingClientRect();

    await commands.wheelAt({
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      deltaY: -100,
    });
    await commands.wheelAt({
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      deltaY: -100,
    });
    await commands.wheelAt({
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      deltaY: -100,
    });

    await expect.poll(() => onViewChange.mock.calls.length).toBe(1);
    expect(onViewChange.mock.calls[0]?.[0]?.zoom).toBeGreaterThan(1);
  });

  it('reports zoom-in, zoom-out and Fit once each', async () => {
    await commands.emulateMedia({ reducedMotion: 'reduce' });
    const onViewChange =
      vi.fn<(view: InteractiveMapView | undefined) => void>();
    await mountInteractiveStage({ onViewChange });

    await userEvent.click(page.getByRole('button', { name: 'Zoom in' }));
    await expect.poll(() => onViewChange.mock.calls.length).toBe(1);
    expect(onViewChange.mock.calls[0]?.[0]?.zoom).toBeGreaterThan(1);

    await userEvent.click(page.getByRole('button', { name: 'Zoom out' }));
    await expect.poll(() => onViewChange.mock.calls.length).toBe(2);

    await userEvent.click(page.getByRole('button', { name: 'Fit' }));
    await expect.poll(() => onViewChange.mock.calls.length).toBe(3);
    expect(onViewChange.mock.calls[2]?.[0]).toBeUndefined();
  });

  it('does not report a view after a plain click', async () => {
    const onViewChange =
      vi.fn<(view: InteractiveMapView | undefined) => void>();
    await mountInteractiveStage({ onViewChange });

    await userEvent.click(page.getByRole('group', { name: 'Zoom test image' }));

    expect(onViewChange).not.toHaveBeenCalled();
  });

  it('applies a changed saved view without reporting it again', async () => {
    const savedView: InteractiveMapView = {
      zoom: 2,
      centerX: 150,
      centerY: 100,
    };
    const onViewChange = vi.fn();

    function Harness() {
      const [view, setView] = useState<InteractiveMapView | undefined>();
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
            <InteractiveMap
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

  it('centers the same image point when a view is restored at two stage sizes', async () => {
    await page.viewport(1400, 800);
    const view: InteractiveMapView = { zoom: 2, centerX: 150, centerY: 100 };

    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        {[400, 800].map((width) => (
          <div key={width} data-stage-size={width} style={{ width }}>
            <InteractiveMap
              image={{
                src: image,
                width: 400,
                height: 200,
                alt: `Restored ${width}px image`,
              }}
              markers={[
                {
                  id: 'center',
                  x: 150,
                  y: 100,
                  label: 'Saved center',
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
        .querySelector<HTMLElement>('[data-marker-id="center"]')!
        .getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();

      expect(point.left + point.width / 2).toBeCloseTo(
        stageRect.left + stageRect.width / 2,
        0,
      );
      expect(point.top + point.height / 2).toBeCloseTo(
        stageRect.top + stageRect.height / 2,
        0,
      );
    }
  });

  it('keeps the restored view when the initial selection is off screen', async () => {
    const view: InteractiveMapView = { zoom: 2, centerX: 100, centerY: 100 };
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
