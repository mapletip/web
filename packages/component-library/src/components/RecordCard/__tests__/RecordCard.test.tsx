import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RecordCard } from '@/components/RecordCard';

function mount(card: React.ReactNode) {
  return render(<MantineProvider>{card}</MantineProvider>);
}

describe('RecordCard', () => {
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
});
