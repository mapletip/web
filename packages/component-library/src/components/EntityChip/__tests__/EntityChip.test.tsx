import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import '@/styles.css';
import { EntityChip } from '@/components/EntityChip';
import type {
  EntityChipLinkRenderer,
  EntityChipProps,
} from '@/components/EntityChip';

const destination = { href: '/maplestory/monsters/synthetic-record-100100' };

function mount(props: Partial<EntityChipProps> = {}) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <EntityChip name="Synthetic item" {...props} />
    </MantineProvider>,
  );
}

describe('EntityChip', () => {
  it('links the icon and name to the supplied destination', () => {
    mount({
      destination,
      iconSrc: '/images/synthetic-item.svg',
    });

    const link = screen.getByRole('link', { name: 'Synthetic item' });

    expect(link).toHaveAttribute('href', destination.href);
    expect(link.querySelector('img')).toHaveAttribute(
      'src',
      '/images/synthetic-item.svg',
    );
    expect(link).toHaveTextContent('Synthetic item');
  });

  it('keeps the icon out of the accessible name', () => {
    mount({ destination, iconSrc: '/images/synthetic-item.svg' });

    expect(
      screen.getByRole('link', { name: 'Synthetic item' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders plain text without a destination', async () => {
    const { container } = mount({ iconSrc: '/images/synthetic-item.svg' });

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Synthetic item')).toBeVisible();
    expect(container.firstElementChild).not.toHaveAttribute('tabindex');

    await userEvent.tab();

    expect(document.activeElement).toBe(document.body);
  });

  it('delegates the link to a host renderer while keeping the chip content', () => {
    const renderLink: EntityChipLinkRenderer = (link, props) => (
      <a
        data-testid="host-link"
        data-href={link.href}
        href={props.href}
        className={props.className}
      >
        {props.children}
      </a>
    );

    mount({
      destination,
      iconSrc: '/images/synthetic-item.svg',
      renderLink,
    });

    const link = screen.getByRole('link', { name: 'Synthetic item' });

    expect(link).toHaveAttribute('data-testid', 'host-link');
    expect(link).toHaveAttribute('data-href', destination.href);
    expect(link.querySelector('img')).not.toBeNull();
  });

  it('shows a neutral placeholder of the icon size when no icon is supplied', () => {
    const { container } = mount({ destination });

    const images = container.querySelectorAll('img');

    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute('data-fallback', 'true');
    expect(images[0]).toHaveStyle({
      width: 'calc(1.5rem * var(--mantine-scale))',
      height: 'calc(1.5rem * var(--mantine-scale))',
    });
  });

  it('keeps a trailing control outside the link', () => {
    mount({
      destination,
      iconSrc: '/images/synthetic-item.svg',
      trailing: <button type="button">Confirmed</button>,
    });

    const link = screen.getByRole('link', { name: 'Synthetic item' });
    const control = screen.getByRole('button', { name: 'Confirmed' });

    expect(link).not.toContainElement(control);
    expect(control.closest('a')).toBeNull();
  });

  it('gives the trailing control its own keyboard focus, after the link', async () => {
    mount({
      destination,
      iconSrc: '/images/synthetic-item.svg',
      trailing: <button type="button">Confirmed</button>,
    });

    const link = screen.getByRole('link', { name: 'Synthetic item' });
    const control = screen.getByRole('button', { name: 'Confirmed' });

    await userEvent.tab();
    expect(link).toHaveFocus();

    await userEvent.tab();
    expect(control).toHaveFocus();
  });

  it('leaves the trailing control focusable without a destination', async () => {
    mount({
      trailing: <button type="button">Confirmed</button>,
    });

    expect(screen.queryByRole('link')).toBeNull();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Confirmed' })).toHaveFocus();
  });

  it('renders a long name as text inside the chip', () => {
    const name =
      'Synthetic item with a deliberately long name that must stay inside the chip';

    mount({ name, destination, iconSrc: '/images/synthetic-item.svg' });

    expect(screen.getByText(name)).toBeVisible();
  });
});
