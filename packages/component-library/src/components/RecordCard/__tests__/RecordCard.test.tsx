import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RecordCard } from '@/components/RecordCard';

function mount(card: React.ReactNode) {
  return render(<MantineProvider>{card}</MantineProvider>);
}

describe('RecordCard', () => {
  it('links only the title and keeps the other card content outside the link', () => {
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

    const link = screen.getByRole('link', { name: 'Practice Meadow' });
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
    expect(
      screen
        .getByRole('heading', { name: 'Practice Meadow' })
        .closest('[data-record-card="true"]')
        ?.querySelector('img'),
    ).toHaveAttribute('alt', '');
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
