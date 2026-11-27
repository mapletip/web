import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RecordCard, RecordFacts } from '@/components/RecordCard';

function mount(card: React.ReactNode) {
  return render(<MantineProvider>{card}</MantineProvider>);
}

describe('RecordCard', () => {
  it('renders quiet identity labels as text and keeps one card action', () => {
    const open = vi.fn();
    const { container } = mount(
      <RecordCard
        layout="quietIdentity"
        title="Copper Compass"
        leadLine="Sells for 35 coins"
        inlineLabels={[
          {
            id: 'use',
            icon: <span>★</span>,
            label: 'Used in tasks',
            tone: 'brand',
          },
        ]}
        detailLine="Found in the practice meadow"
        action={open}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Copper Compass' }),
    ).toBeVisible();
    expect(screen.getByText('Used in tasks')).toBeVisible();
    expect(screen.getByText('★').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(
      container.querySelector('[data-record-card-layout="quietIdentity"]'),
    ).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Copper Compass' }));
    expect(open).toHaveBeenCalledOnce();
  });

  it('puts the detail before labels in reading order when requested', () => {
    const { container } = mount(
      <RecordCard
        layout="quietIdentity"
        title="Amber Lantern"
        inlineLabels={[
          {
            id: 'use',
            icon: <span>★</span>,
            label: 'Used in tasks',
            tone: 'muted',
          },
        ]}
        detailLine="Found in the meadow"
        detailFirst
      />,
    );
    const card = container.querySelector(
      '[data-record-card-layout="quietIdentity"]',
    );
    expect(
      Array.from(card?.children ?? []).map((child) => child.textContent),
    ).toEqual(['Amber Lantern', 'Found in the meadow', '★Used in tasks']);
  });
  it('marks the selected fact in its semantic list', () => {
    mount(
      <RecordFacts
        facts={[
          { id: 'lesser', label: 'Lesser', selected: true },
          { id: 'greater', label: 'Greater', action: vi.fn() },
        ]}
      />,
    );

    expect(screen.getByRole('listitem', { current: true })).toHaveTextContent(
      'Lesser',
    );
    expect(screen.getByRole('button', { name: 'Greater' })).toBeVisible();
  });

  it('places picture media above the title without empty text lines', () => {
    const { container } = mount(
      <RecordCard
        layout="picture"
        title="Copper Compass"
        media={<img src="/compass.svg" alt="" />}
      />,
    );
    const card = container.querySelector('[data-record-card-layout="picture"]');
    expect(card?.firstElementChild?.querySelector('img')).toHaveAttribute(
      'src',
      '/compass.svg',
    );
    expect(card?.lastElementChild).toContainElement(
      screen.getByRole('heading', { name: 'Copper Compass' }),
    );
    expect(card?.lastElementChild?.children).toHaveLength(1);
  });

  it('keeps the picture section when media is missing', () => {
    const { container } = mount(
      <RecordCard layout="picture" title="Still Stone" />,
    );
    const card = container.querySelector('[data-record-card-layout="picture"]');
    expect(card?.firstElementChild?.className).toContain('pictureMedia');
    expect(card?.firstElementChild).toBeEmptyDOMElement();
  });

  it('shows a lead and one secondary line below a long picture title', () => {
    const title =
      'A remarkably long name for an amber lantern carried through the valley';
    const { container } = mount(
      <RecordCard
        layout="picture"
        title={title}
        leadLine="A bright keepsake"
        secondaryLine="Found beyond the western road"
      />,
    );
    const text = container.querySelector('[class*="pictureText"]');
    expect(
      Array.from(text?.children ?? []).map((child) => child.textContent),
    ).toEqual([title, 'A bright keepsake', 'Found beyond the western road']);
  });

  it('clamps the secondary line when a limit is provided', () => {
    const { container } = mount(
      <RecordCard
        layout="compactMediaAside"
        title="Quiet keepsake"
        secondaryLine="A long description that should take no more than two lines."
        secondaryLineClamp={2}
      />,
    );

    expect(container.querySelector('[class*="secondary"]')).toHaveStyle(
      '--text-line-clamp: 2',
    );
  });

  it('opens picture details through the title action', () => {
    const open = vi.fn();
    const { container } = mount(
      <RecordCard
        layout="picture"
        title="Amber Lantern"
        action={open}
        isDetailsOpen
      />,
    );
    const button = screen.getByRole('button', { name: 'Amber Lantern' });
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(
      container.querySelector('[data-details-open="true"]'),
    ).not.toBeNull();
    fireEvent.click(button);
    expect(open).toHaveBeenCalledOnce();
  });

  it('renders identity facts as a list with full detail and aligned values', () => {
    const detail = 'A long description of the northern practice orchard';
    const { container } = mount(
      <RecordCard
        layout="identity"
        title="Copper Compass"
        leadLine="A keepsake for travelers"
        media={<img src="/compass.svg" alt="" />}
        facts={[
          { id: 'place', label: 'Found in', detail, values: ['3 regions'] },
          { id: 'price', label: 'Value', values: ['250', '100'] },
        ]}
      />,
    );

    expect(screen.getByRole('list').children).toHaveLength(2);
    expect(
      screen.getByRole('heading', { name: 'Copper Compass' }),
    ).toBeVisible();
    expect(screen.getByText(detail)).toBeVisible();
    expect(screen.getByText('3 regions')).toBeVisible();
    expect(screen.getByText('250').parentElement?.children).toHaveLength(2);
    expect(
      container.querySelector('[data-record-card-layout="identity"]'),
    ).not.toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('fills a factless identity card with its header', () => {
    const { container } = mount(
      <RecordCard layout="identity" title="Still Stone" />,
    );
    expect(screen.queryByRole('list')).toBeNull();
    expect(container.querySelector('[class*="identityHeader"]')).toBeVisible();
  });

  it('activates the card once by pointer and exposes ordered keyboard stops', () => {
    const open = vi.fn();
    const inspect = vi.fn();
    const { container } = mount(
      <RecordCard
        layout="identity"
        title="Copper Compass"
        action={open}
        isDetailsOpen
        facts={[{ id: 'location', label: 'Inspect location', action: inspect }]}
      />,
    );
    const titleButton = screen.getByRole('button', { name: 'Copper Compass' });
    const factButton = screen.getByRole('button', { name: 'Inspect location' });
    expect(titleButton).toHaveAttribute('aria-haspopup', 'dialog');
    expect(titleButton).toHaveAttribute('aria-expanded', 'true');
    expect(
      container.querySelector('[data-details-open="true"]'),
    ).not.toBeNull();
    expect(screen.getAllByRole('button')).toEqual([titleButton, factButton]);
    expect(
      container.querySelector('[data-record-card="true"]'),
    ).not.toHaveAttribute('tabindex');
    fireEvent.click(titleButton);
    fireEvent.click(factButton);
    expect(open).toHaveBeenCalledOnce();
    expect(inspect).toHaveBeenCalledOnce();
  });
  it('links only the title and keeps the other card content outside the link', () => {
    const { container } = mount(
      <RecordCard
        title="Practice Meadow"
        secondaryLine="West Practice Grounds"
        badges={<span>Training</span>}
        media={<img src="/synthetic-map.svg" alt="" />}
        footer="12 spawns"
        destination={{ href: '/synthetic/maps/practice-meadow' }}
      />,
    );

    const link = screen.getByRole('link', { name: 'Practice Meadow' });
    const card = container.querySelector('[data-record-card="true"]');
    expect(link).toHaveAttribute('href', '/synthetic/maps/practice-meadow');
    expect(link).toHaveAccessibleName('Practice Meadow');
    expect(link).not.toHaveAttribute('aria-label');
    expect(link).toHaveTextContent('Practice Meadow');
    expect(link).not.toHaveTextContent('West Practice Grounds');
    expect(screen.getByText('West Practice Grounds')).toBeVisible();
    expect(screen.getByText('Training')).toBeVisible();
    expect(screen.getByText('12 spawns')).toBeVisible();
    expect(link.querySelector('img')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(card).not.toHaveAttribute('data-record-card-link-scope');
    expect(card?.children).toHaveLength(2);
    expect(screen.getByText('12 spawns').parentElement).toBe(card);
    expect(
      screen
        .getByRole('heading', { name: 'Practice Meadow' })
        .closest('[data-record-card="true"]')
        ?.querySelector('img'),
    ).toHaveAttribute('alt', '');
  });

  it('puts the footer outside a header-scoped link region', () => {
    const { container } = mount(
      <RecordCard
        title="Practice Meadow"
        layout="mediaAside"
        media={<img src="/synthetic-map.svg" alt="" />}
        footer={<button>Locate</button>}
        destination={{ href: '/synthetic/maps/practice-meadow' }}
        linkScope="header"
      />,
    );

    const card = container.querySelector('[data-record-card="true"]');
    const header = card?.firstElementChild;
    const linkedCard = card?.parentElement;
    const footer = screen.getByRole('button', { name: 'Locate' }).parentElement;
    const link = screen.getByRole('link', { name: 'Practice Meadow' });

    expect(linkedCard).toHaveAttribute('data-record-card-link-scope', 'header');
    expect(card).not.toHaveAttribute('data-record-card-link-scope');
    expect(card).not.toHaveAttribute('data-record-card-layout');
    expect(header).not.toBeNull();
    expect(header).toHaveAttribute('data-record-card-layout', 'mediaAside');
    expect(header).toHaveAttribute('data-record-card-has-media', 'true');
    expect(header).toHaveAttribute('data-record-card-has-footer', 'false');
    expect(header?.contains(link)).toBe(true);
    expect(footer?.parentElement).toBe(card);
    expect(header?.contains(footer ?? null)).toBe(false);
  });

  it('keeps compact header links and their footer in the compact card layout', () => {
    mount(
      <RecordCard
        title="Blue Gloop"
        layout="compactMediaAside"
        secondaryLine="Lv 12"
        media={<img src="/blue-gloop.png" alt="" />}
        footer={<span>3m respawn</span>}
        destination={{ href: '/synthetic/monsters/blue-gloop' }}
        linkScope="header"
      />,
    );

    const card = screen
      .getByRole('link', { name: 'Blue Gloop' })
      .closest('[data-record-card="true"]');
    const header = card?.firstElementChild;
    const footer = screen.getByText('3m respawn').parentElement;

    expect(card).toHaveAttribute(
      'data-record-card-layout',
      'compactMediaAside',
    );
    expect(header).toHaveAttribute(
      'data-record-card-layout',
      'compactMediaAside',
    );
    expect(header?.contains(screen.getByText('Lv 12'))).toBe(true);
    expect(header?.contains(screen.getByText('3m respawn'))).toBe(false);
    expect(footer?.parentElement).toBe(card);
  });

  it('keeps a footer button outside the link and lets it handle its own click', () => {
    const onLocate = vi.fn();
    mount(
      <RecordCard
        title="Practice Meadow"
        destination={{ href: '/synthetic/maps/practice-meadow' }}
        footer={<button onClick={onLocate}>Locate</button>}
      />,
    );

    expect(
      screen.getAllByRole('link', {
        name: 'Practice Meadow',
      }),
    ).toHaveLength(1);
    const button = screen.getByRole('button', { name: 'Locate' });
    expect(button.closest('a')).toBeNull();

    fireEvent.click(button);
    expect(onLocate).toHaveBeenCalledOnce();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('uses the full text width when media is omitted', () => {
    const { container } = mount(
      <RecordCard title="Quiet Clearing" secondaryLine="Forest fringe" />,
    );

    expect(
      screen.getByRole('heading', { name: 'Quiet Clearing' }),
    ).toBeVisible();
    expect(screen.getByText('Forest fringe')).toBeVisible();
    expect(container.querySelector('[class*="media"]')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders a custom host link once and keeps a card without destination static', () => {
    const renderLink = (
      _destination: { readonly href: string },
      props: {
        readonly href: string;
        readonly className: string;
        readonly children: React.ReactNode;
      },
    ) => (
      <a href={props.href} className={props.className} data-host-link="true">
        {props.children}
      </a>
    );

    mount(
      <>
        <RecordCard
          title="Linked map"
          destination={{ href: '/maps/linked-map' }}
          renderLink={renderLink}
        />
        <RecordCard title="Static map" />
      </>,
    );

    expect(screen.getByRole('link', { name: 'Linked map' })).toHaveAttribute(
      'data-host-link',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Static map' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Static map' })).toBeNull();
  });

  it('shows the trailing chevron only on linked compact cards', () => {
    const { container } = mount(
      <>
        <RecordCard
          layout="compactMediaAside"
          title="Linked map"
          destination={{ href: '/maps/linked-map' }}
        />
        <RecordCard layout="compactMediaAside" title="Static map" />
        <RecordCard
          title="Linked wide map"
          destination={{ href: '/maps/wide' }}
        />
      </>,
    );

    const linked = screen
      .getByRole('link', { name: 'Linked map' })
      .closest('[data-record-card="true"]');
    const unlinked = screen
      .getByRole('heading', { name: 'Static map' })
      .closest('[data-record-card="true"]');
    expect(linked?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(unlinked?.querySelector('svg')).toBeNull();
    const wide = screen
      .getByRole('link', { name: 'Linked wide map' })
      .closest('[data-record-card="true"]');
    expect(wide?.querySelector('svg')).toBeNull();
    expect(container.querySelectorAll('a')).toHaveLength(2);
  });

  it('renders value headline parts with tones directly under the title on compact and picture cards', () => {
    const open = vi.fn();
    const { container } = mount(
      <>
        <RecordCard
          layout="compactMediaAside"
          title="Meadow Draught"
          value={[
            { id: 'warm', text: '+300 vitality', tone: 'warm' },
            { id: 'cool', text: '+150 focus', tone: 'cool' },
            { id: 'critical', text: '−5 balance', tone: 'critical' },
          ]}
          secondaryLine="Lasts 5 minutes"
          action={open}
        />
        <RecordCard
          layout="picture"
          title="Amber Bench"
          value={[{ id: 'price', text: '7,000 tokens' }]}
        />
        <RecordCard
          layout="compactMediaAside"
          title="Plain Bottle"
          value={[]}
        />
      </>,
    );

    expect(screen.getByText('+300 vitality').className).toContain(
      'valuePartwarm',
    );
    expect(screen.getByText('+150 focus').className).toContain('valuePartcool');
    expect(screen.getByText('−5 balance').className).toContain(
      'valuePartcritical',
    );
    expect(screen.getByText('7,000 tokens').className).toContain(
      'valuePartaccent',
    );
    expect(screen.getByText('Lasts 5 minutes')).toBeVisible();
    // Empty value array renders no value line.
    expect(container.querySelectorAll('[class*="valueLine"]')).toHaveLength(2);

    const button = screen.getByRole('button', { name: 'Meadow Draught' });
    expect(button).toHaveAccessibleName('Meadow Draught');
    fireEvent.click(button);
    expect(open).toHaveBeenCalledOnce();
  });
});
