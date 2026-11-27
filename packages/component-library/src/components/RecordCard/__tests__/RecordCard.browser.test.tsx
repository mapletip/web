import { MantineProvider, Tooltip } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { RecordCard } from '@/components/RecordCard';

describe('RecordCard stretched link in the browser', () => {
  it('fits long identity text at 320px and clips its detail to one line', async () => {
    const detail =
      'The northern orchard beyond the quiet meadow and western road';
    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        <div style={{ width: 320, padding: 8, boxSizing: 'border-box' }}>
          <RecordCard
            layout="identity"
            title="A remarkably long compass name for travelers"
            facts={[{ id: 'place', label: 'Found in', detail, values: ['12'] }]}
          />
        </div>
      </MantineProvider>,
    );
    await page.viewport(320, 500);
    const detailElement = page.getByText(detail).element();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    expect(getComputedStyle(detailElement).textOverflow).toBe('ellipsis');
    expect(getComputedStyle(detailElement).whiteSpace).toBe('nowrap');
    expect(detailElement.getAttribute('title')).toBe(detail);
  });
  it('stretches identity cards equally and activates only the chosen control', async () => {
    const open = vi.fn();
    const inspect = vi.fn();
    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
            width: 600,
          }}
        >
          <RecordCard
            layout="identity"
            title="Copper Compass"
            media={
              <div
                data-testid="identity-media"
                style={{ width: 40, height: 40 }}
              />
            }
            action={open}
            facts={[
              { id: 'source', label: 'Inspect source', action: inspect },
              { id: 'value', label: 'Value', values: ['250', '100'] },
            ]}
          />
          <RecordCard layout="identity" title="Still Stone" />
        </div>
      </MantineProvider>,
    );
    const cards = document.querySelectorAll('[data-record-card="true"]');
    expect(cards).toHaveLength(2);
    expect(cards[0]!.getBoundingClientRect().height).toBe(
      cards[1]!.getBoundingClientRect().height,
    );
    const title = page.getByRole('button', { name: 'Copper Compass' });
    const fact = page.getByRole('button', { name: 'Inspect source' });
    await page.getByTestId('identity-media').click({ force: true });
    expect(open).toHaveBeenCalledOnce();
    await fact.click();
    expect(inspect).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledOnce();
    title.element().focus();
    await userEvent.keyboard('{Enter}');
    expect(open).toHaveBeenCalledTimes(2);
    await userEvent.tab();
    expect(document.activeElement).toBe(fact.element());
  });
  it('keeps a linked mediaAside card footer action above the stretched link', async () => {
    const onLocate = vi.fn();

    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        <div style={{ width: 420 }}>
          <RecordCard
            layout="mediaAside"
            title="Practice Meadow"
            secondaryLine={
              <span style={{ display: 'block', height: 160 }}>
                West Practice Grounds
              </span>
            }
            footer={
              <div style={{ width: '100%', height: 56 }}>
                <Tooltip label="Locate">
                  <button onClick={onLocate}>Locate</button>
                </Tooltip>
              </div>
            }
            destination={{ href: '#practice-meadow' }}
            renderLink={(_destination, props) => (
              <a href={props.href} className={props.className}>
                {props.children}
              </a>
            )}
          />
        </div>
      </MantineProvider>,
    );

    const link = page.getByRole('link', {
      name: 'Practice Meadow',
      exact: true,
    });
    const button = page.getByRole('button', { name: 'Locate' });
    await expect.element(link).toBeVisible();
    const cardElement = link.element().closest('[data-record-card="true"]');
    if (cardElement === null)
      throw new Error('The title link is outside its card.');
    expect(getComputedStyle(cardElement).isolation).toBe('isolate');
    const buttonElement = button.element();
    expect(buttonElement.closest('a')).toBeNull();
    const bounds = buttonElement.getBoundingClientRect();
    const hitTarget = document.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
    expect(buttonElement.contains(hitTarget)).toBe(true);
    await button.click();
    expect(onLocate).toHaveBeenCalledOnce();
    expect(window.location.hash).toBe('');

    await link.click();
    expect(window.location.hash).toBe('#practice-meadow');
  });

  it('limits header link activation and feedback to the identity region', async () => {
    const onLocate = vi.fn();
    window.history.replaceState(null, '', window.location.pathname);

    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        <div style={{ width: 420 }}>
          <RecordCard
            layout="mediaAside"
            title="Practice Meadow"
            secondaryLine="West Practice Grounds"
            footer={
              <div
                data-testid="record-card-header-footer-space"
                style={{ width: '100%', height: 56 }}
              >
                <button onClick={onLocate}>Locate</button>
              </div>
            }
            destination={{ href: '#header-practice-meadow' }}
            linkScope="header"
          />
        </div>
      </MantineProvider>,
    );

    const link = page.getByRole('link', {
      name: 'Practice Meadow',
      exact: true,
    });
    const button = page.getByRole('button', { name: 'Locate' });
    const footerSpace = page.getByTestId('record-card-header-footer-space');
    const headerElement = link
      .element()
      .closest('[data-record-card-layout="mediaAside"]');
    const cardElement = link.element().closest('[data-record-card="true"]');

    if (
      !(headerElement instanceof HTMLElement) ||
      !(cardElement instanceof HTMLElement)
    ) {
      throw new Error('The linked card header or card is missing.');
    }

    await userEvent.unhover(cardElement);
    expect(link.element().matches(':hover')).toBe(false);
    await expect
      .poll(() => getComputedStyle(headerElement).boxShadow)
      .toBe('none');
    const headerBackground = getComputedStyle(headerElement).backgroundColor;
    const headerShadow = getComputedStyle(headerElement).boxShadow;
    expect(headerShadow).toBe('none');
    const buttonElement = button.element();
    const buttonBounds = buttonElement.getBoundingClientRect();
    const buttonHitTarget = document.elementFromPoint(
      buttonBounds.left + buttonBounds.width / 2,
      buttonBounds.top + buttonBounds.height / 2,
    );
    expect(buttonElement.contains(buttonHitTarget)).toBe(true);
    await button.click();
    expect(onLocate).toHaveBeenCalledOnce();
    expect(window.location.hash).toBe('');

    const footerBounds = footerSpace.element().getBoundingClientRect();
    await footerSpace.click({
      position: { x: footerBounds.width - 8, y: footerBounds.height / 2 },
    });
    expect(window.location.hash).toBe('');
    await footerSpace.hover({
      position: { x: footerBounds.width - 8, y: footerBounds.height / 2 },
    });
    expect(link.element().matches(':hover')).toBe(false);
    expect(getComputedStyle(headerElement).backgroundColor).toBe(
      headerBackground,
    );
    expect(getComputedStyle(headerElement).boxShadow).toBe(headerShadow);

    await link.hover();
    expect(link.element().matches(':hover')).toBe(true);
    expect(getComputedStyle(headerElement).boxShadow).not.toBe(headerShadow);

    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(link.element());
    expect(link.element().matches(':focus-visible')).toBe(true);
    expect(getComputedStyle(headerElement).outlineStyle).toBe('solid');
    expect(getComputedStyle(headerElement).outlineWidth).toBe('2px');
    expect(getComputedStyle(cardElement).outlineStyle).toBe('none');
    expect(headerElement.getBoundingClientRect().bottom).toBeLessThan(
      cardElement.getBoundingClientRect().bottom,
    );

    await link.click();
    expect(window.location.hash).toBe('#header-practice-meadow');
  });

  it('fits compact cards in two columns at 320px without title overflow', async () => {
    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        <div
          data-testid="compact-card-grid"
          style={{
            boxSizing: 'border-box',
            display: 'grid',
            gap: 8,
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            padding: 16,
            width: 320,
          }}
        >
          <RecordCard
            layout="compactMediaAside"
            title="Blue Gloop"
            media={<div style={{ width: 32, height: 32 }} />}
            destination={{ href: '#blue-gloop' }}
            linkScope="header"
          />
          <RecordCard
            layout="compactMediaAside"
            title="Red Gloop"
            media={<div style={{ width: 32, height: 32 }} />}
            destination={{ href: '#red-gloop' }}
            linkScope="header"
          />
        </div>
      </MantineProvider>,
    );

    await page.viewport(320, 240);
    const grid = page.getByTestId('compact-card-grid').element();
    const firstCard = page
      .getByRole('link', { name: 'Blue Gloop' })
      .element()
      .closest('[data-record-card="true"]');
    const titleLink = page.getByRole('link', { name: 'Blue Gloop' }).element();

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
    expect(grid.getBoundingClientRect().width).toBe(320);
    expect(firstCard?.getBoundingClientRect().right).toBeLessThanOrEqual(320);
    expect(getComputedStyle(titleLink).overflowWrap).toBe('anywhere');
  });

  it.each([
    { linkScope: 'card' as const, width: 180 },
    { linkScope: 'header' as const, width: 180 },
    { linkScope: 'card' as const, width: 300 },
    { linkScope: 'header' as const, width: 300 },
  ])(
    'keeps the compact $linkScope layout intact at $width px',
    async ({ linkScope, width }) => {
      await render(
        <MantineProvider
          theme={theme}
          cssVariablesResolver={cssVariablesResolver}
          forceColorScheme="dark"
        >
          <div style={{ width }}>
            <RecordCard
              layout="compactMediaAside"
              title="Gloop"
              media={
                <div
                  data-testid="compact-card-media"
                  style={{ width: 48, height: 48 }}
                />
              }
              footer={
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <span>7 spawns</span>
                  <span>3m respawn</span>
                </div>
              }
              destination={{ href: '#gloop' }}
              linkScope={linkScope}
            />
          </div>
        </MantineProvider>,
      );

      await page.viewport(width, 220);
      const card = page
        .getByRole('heading', { name: 'Gloop' })
        .element()
        .closest('[data-record-card="true"]');
      const title = page.getByRole('heading', { name: 'Gloop' }).element();
      const media = page
        .getByTestId('compact-card-media')
        .element().parentElement;

      if (
        !(card instanceof HTMLElement) ||
        !(card.firstElementChild instanceof HTMLElement) ||
        !(card.lastElementChild instanceof HTMLElement) ||
        !(media instanceof HTMLElement)
      ) {
        throw new Error(
          'The compact card identity, media or footer is missing.',
        );
      }

      const identity = card.firstElementChild;
      const footer = card.lastElementChild;
      const mediaBounds = media.getBoundingClientRect();
      const titleBounds = title.getBoundingClientRect();
      const identityBounds = identity.getBoundingClientRect();
      const footerBounds = footer.getBoundingClientRect();

      expect(mediaBounds.right).toBeLessThanOrEqual(titleBounds.left);
      expect(footerBounds.top).toBeGreaterThanOrEqual(identityBounds.bottom);
      expect(card.getBoundingClientRect().height).toBeLessThan(140);
      expect(footer.scrollWidth).toBeLessThanOrEqual(footer.clientWidth);
    },
  );
});
