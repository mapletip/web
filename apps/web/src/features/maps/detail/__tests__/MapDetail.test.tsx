import { MantineProvider } from '@mantine/core';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { routeTree } from '@/routeTree.gen';

import { MapDetail } from '../MapDetail';
import { projectMapDetail } from '../project';

import { mapPageRecordFixture } from './mapPageFixture';

function renderDetail(mapId: string, withoutInformation = false) {
  const record = mapPageRecordFixture({ mapId });
  const view = projectMapDetail({
    record: withoutInformation
      ? {
          ...record,
          activity: { state: 'unknown' },
          description: { state: 'absent', coverageKey: 'description' },
          information: {
            ...record.information,
            returnMap: { state: 'unknown' },
          },
        }
      : record,
    buildId: 'cw-launch',
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [view.canonicalPath] }),
  });

  render(
    <RouterContextProvider router={router}>
      <MantineProvider>
        <MapDetail view={view} />
      </MantineProvider>
    </RouterContextProvider>,
  );
}

describe('MapDetail information', () => {
  it('omits activity, description, and an empty Map information block', () => {
    renderDetail('practice-grove', true);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Practice Grove' }),
    ).toBeVisible();
    expect(screen.queryByText(/^Part of /u)).not.toBeInTheDocument();
    expect(
      screen.queryByText('A gathering place beneath paper lanterns.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Map information' }),
    ).not.toBeInTheDocument();
  });

  it('shows activity, description, and known map information', () => {
    renderDetail('lantern-square');

    expect(screen.getByText('Part of Market')).toBeVisible();
    expect(
      screen.getByText('A gathering place beneath paper lanterns.'),
    ).toBeVisible();

    const information = screen.getByRole('region', {
      name: 'Map information',
    });
    expect(within(information).getByText('Floral Life')).toBeVisible();
    expect(within(information).getByText('10 min')).toBeVisible();
    expect(within(information).getByText('Allowed')).toBeVisible();
    expect(
      within(information).getByRole('link', { name: 'Practice Grove' }),
    ).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/maplestory\/maps\/practice-grove-/u),
    );
    expect(within(information).queryByText('Flying')).not.toBeInTheDocument();
  });
});
