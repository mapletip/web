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
import { projectMapDetail, UNNAMED_MAP_LABEL } from '../project';

import { mapPageRecordFixture } from './mapPageFixture';

function renderDetail(
  mapId: string,
  withoutInformation = false,
  connections?: ReturnType<typeof mapPageRecordFixture>['connections'],
) {
  const record = mapPageRecordFixture({ mapId });
  const projectedRecord = withoutInformation
    ? {
        ...record,
        activity: { state: 'unknown' as const },
        description: { state: 'absent' as const, coverageKey: 'description' },
        information: {
          ...record.information,
          returnMap: { state: 'unknown' as const },
        },
      }
    : record;
  const recordWithConnections =
    connections === undefined
      ? projectedRecord
      : { ...projectedRecord, connections };
  const view = projectMapDetail({
    record: recordWithConnections,
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

  it('omits the section and navigation for a known empty connection collection', () => {
    renderDetail('practice-grove', false, { state: 'absent', items: [] });

    expect(
      screen.queryByRole('navigation', { name: 'Record sections' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Connections/u }),
    ).not.toBeInTheDocument();
  });

  it('omits the section for a known zero connection count', () => {
    renderDetail('practice-grove', false, { state: 'known', items: [] });

    expect(
      screen.queryByRole('navigation', { name: 'Record sections' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Connections/u }),
    ).not.toBeInTheDocument();
  });

  it('shows an unavailable message and unknown count for unresolved connections', () => {
    renderDetail('practice-grove', false, { state: 'unknown', items: [] });

    expect(
      within(
        screen.getByRole('navigation', { name: 'Record sections' }),
      ).getByRole('link', { name: 'Connections (?)' }),
    ).toHaveAttribute('href', '#connections');
    expect(
      screen.getByRole('heading', { name: 'Connections (?)' }),
    ).toBeVisible();
    expect(
      screen.getByText('Connection information is unavailable.'),
    ).toBeVisible();
  });

  it('links connection cards to their same-build Map Detail address', () => {
    const record = mapPageRecordFixture({ mapId: 'practice-grove' });
    const connected = record.connections.items[0];
    if (connected === undefined)
      throw new Error('Expected fixture connection.');
    renderDetail('practice-grove', false, {
      state: 'known',
      items: [
        {
          ...connected,
          name: { state: 'unknown' },
          minimap: {
            state: 'absent',
            coverageKey: 'fixture:connection-minimap',
          },
        },
      ],
    });

    const card = screen.getByTestId('map-connection-card');
    expect(
      within(card).getByRole('heading', { name: UNNAMED_MAP_LABEL }),
    ).toBeVisible();
    expect(
      within(card).getByRole('img', { name: 'Minimap unavailable' }),
    ).toBeVisible();
    expect(within(card).getByRole('link')).toHaveAttribute(
      'href',
      `/maplestory/maps/${connected.slug}-${connected.publicId}`,
    );
  });
});
