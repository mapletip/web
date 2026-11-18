import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RecordCard } from '@/components/RecordCard';

function mount(card: React.ReactNode) {
  return render(<MantineProvider>{card}</MantineProvider>);
}

describe('RecordCard', () => {
  it('shows title, secondary line, badges, media and footer in a linked card', () => {
    mount(
      <RecordCard
        title="Practice Meadow"
        secondaryLine="West Practice Grounds"
        badges={<span>Training</span>}
        media={<img src="/synthetic-map.svg" alt="" />}
        footer="12 spawns"
        destination={{ href: '/synthetic/maps/practice-meadow' }}
      />,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/synthetic/maps/practice-meadow');
    expect(link).toHaveAccessibleName(
      /Practice Meadow.*Training.*West Practice Grounds.*12 spawns/u,
    );
    expect(link).not.toHaveAttribute('aria-label');
    expect(link).toHaveTextContent('West Practice Grounds');
    expect(link).toHaveTextContent('Training');
    expect(link).toHaveTextContent('12 spawns');
    expect(link.querySelector('img')).toHaveAttribute('alt', '');
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
      .getByRole('heading', { name: 'Linked map' })
      .closest('[data-record-card="true"]');
    const unlinked = screen
      .getByRole('heading', { name: 'Static map' })
      .closest('[data-record-card="true"]');
    expect(linked?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(linked?.closest('a')).toHaveAttribute('href', '/maps/linked-map');
    expect(unlinked?.querySelector('svg')).toBeNull();
    const wide = screen
      .getByRole('heading', { name: 'Linked wide map' })
      .closest('[data-record-card="true"]');
    expect(wide?.querySelector('svg')).toBeNull();
    expect(container.querySelectorAll('a')).toHaveLength(2);
  });
});
