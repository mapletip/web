import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ItemRecordChip } from '../ItemRecordChip';

describe('ItemRecordChip', () => {
  it('renders a plain item identity with the missing-icon placeholder', () => {
    const { container } = render(
      <MantineProvider>
        <ItemRecordChip item={{ name: 'Item name unavailable' }} />
      </MantineProvider>,
    );

    expect(screen.getByText('Item name unavailable')).toBeVisible();
    expect(screen.queryByRole('link')).toBeNull();
    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute('data-fallback', 'true');
  });
});
