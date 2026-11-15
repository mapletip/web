import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import '@/styles.css';
import { RecordSections } from '@/components/RecordSections';
import type {
  RecordSection,
  RecordSectionsProps,
} from '@/components/RecordSections';

const sections: readonly RecordSection[] = [
  { id: 'locations', title: 'Locations', count: 3, content: 'Three places' },
  { id: 'drops', title: 'Drops', count: 'unknown', content: 'Unknown count' },
  { id: 'quests', title: 'Quests', content: 'Quest content' },
];

function mount(props: Partial<RecordSectionsProps> = {}) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <RecordSections sections={sections} {...props} />
    </MantineProvider>,
  );
}

describe('RecordSections', () => {
  it('renders headings and navigation in the supplied order with matching counts', () => {
    mount();

    const navigation = screen.getByRole('navigation', {
      name: 'Record sections',
    });
    expect(
      [...navigation.querySelectorAll('a')].map((link) => link.textContent),
    ).toEqual(['Locations (3)', 'Drops (?)', 'Quests']);
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['Locations (3)', 'Drops (?)', 'Quests']);
    expect(screen.getByRole('link', { name: 'Locations (3)' })).toHaveAttribute(
      'href',
      '#locations',
    );
    expect(screen.getByRole('link', { name: 'Drops (?)' })).toHaveAttribute(
      'href',
      '#drops',
    );
  });

  it('opens all sections by default and lets each section collapse independently', async () => {
    const user = userEvent.setup();
    mount();

    const locations = screen.getByRole('button', { name: 'Locations (3)' });
    const drops = screen.getByRole('button', { name: 'Drops (?)' });
    const quests = screen.getByRole('button', { name: 'Quests' });

    expect(locations).toHaveAttribute('aria-expanded', 'true');
    expect(drops).toHaveAttribute('aria-expanded', 'true');
    expect(quests).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Three places')).toBeVisible();

    await user.click(locations);

    expect(locations).toHaveAttribute('aria-expanded', 'false');
    expect(drops).toHaveAttribute('aria-expanded', 'true');
    expect(quests).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows zero, unknown and omitted counts as supplied', () => {
    mount({
      sections: [
        { id: 'known-empty', title: 'Known empty', count: 0, content: 'None' },
        {
          id: 'unresolved',
          title: 'Unresolved',
          count: 'unknown',
          content: 'Pending',
        },
        { id: 'plain', title: 'Plain', content: 'No count' },
      ],
    });

    expect(screen.getByRole('link', { name: 'Known empty (0)' })).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Unresolved (?)' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Plain' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Plain ()' })).toBeNull();
  });

  it('omits a section from both navigation and content when absent from the list', () => {
    mount({ sections: [sections[0]!, sections[2]!] });

    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
    expect(screen.queryByRole('link', { name: 'Drops (?)' })).toBeNull();
    expect(screen.queryByText('Unknown count')).toBeNull();
  });

  it('hides optional icons from assistive technology', () => {
    mount({
      sections: [
        {
          id: 'decorated',
          title: 'Decorated',
          icon: <svg data-testid="section-icon" />,
          content: 'Content',
        },
      ],
    });

    for (const icon of screen.getAllByTestId('section-icon')) {
      expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });
});
