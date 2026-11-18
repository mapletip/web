import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NpcRecordCard } from '../NpcRecordCard';

describe('NpcRecordCard', () => {
  it('uses the missing-image placeholder and keeps NPC identity unlinked', () => {
    const { container } = render(
      <MantineProvider>
        <NpcRecordCard npc={{ name: 'Bellkeeper' }} />
      </MantineProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Bellkeeper' })).toBeVisible();
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('img[data-fallback="true"]')).not.toBeNull();
  });
});
