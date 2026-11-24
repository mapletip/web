import { describe, expect, it } from 'vitest';

import { mapDetailBreadcrumbs, mapDetailMetadata } from '../metadata';

describe('Map Detail breadcrumbs', () => {
  it('omits an area matching the map name from the trail and JSON-LD', () => {
    const view = {
      name: 'Meadowbrook',
      canonicalPath: '/maplestory/maps/meadowbrook-00000000',
      regionLabel: 'Western Isle',
      areaLabel: '  mEADOWbrook  ',
    };
    const breadcrumbs = mapDetailBreadcrumbs({ view, buildId: 'cw-launch' });
    const head = mapDetailMetadata({ view, buildId: 'cw-launch' });
    const breadcrumbScript = head.scripts[0]?.children;
    if (breadcrumbScript === undefined) {
      throw new Error('Expected breadcrumb JSON-LD.');
    }
    const jsonLd = JSON.parse(breadcrumbScript) as {
      readonly itemListElement: readonly { readonly name: string }[];
    };

    expect(breadcrumbs.map(({ label }) => label)).toEqual([
      'Home',
      'Maps',
      'Western Isle',
      'Meadowbrook',
    ]);
    expect(jsonLd.itemListElement.map(({ name }) => name)).toEqual([
      'Home',
      'Maps',
      'Western Isle',
      'Meadowbrook',
    ]);
  });

  it('keeps a distinct area in the trail and JSON-LD', () => {
    const view = {
      name: 'Meadowbrook Hunting Field II',
      canonicalPath: '/maplestory/maps/meadowbrook-hunting-ground-ii-00000000',
      regionLabel: 'Western Isle',
      areaLabel: 'Meadowbrook',
    };
    const breadcrumbs = mapDetailBreadcrumbs({ view, buildId: 'cw-launch' });
    const head = mapDetailMetadata({ view, buildId: 'cw-launch' });
    const breadcrumbScript = head.scripts[0]?.children;
    if (breadcrumbScript === undefined) {
      throw new Error('Expected breadcrumb JSON-LD.');
    }
    const jsonLd = JSON.parse(breadcrumbScript) as {
      readonly itemListElement: readonly { readonly name: string }[];
    };

    expect(breadcrumbs.map(({ label }) => label)).toEqual([
      'Home',
      'Maps',
      'Western Isle',
      'Meadowbrook',
      'Meadowbrook Hunting Field II',
    ]);
    expect(jsonLd.itemListElement.map(({ name }) => name)).toEqual([
      'Home',
      'Maps',
      'Western Isle',
      'Meadowbrook',
      'Meadowbrook Hunting Field II',
    ]);
  });

  it('links the region and area to their Map Browse location pages', () => {
    const view = {
      name: 'Meadowbrook Hunting Field II',
      canonicalPath: '/maplestory/maps/meadowbrook-hunting-ground-ii-00000000',
      regionLabel: 'Western Isle',
      areaLabel: 'Meadowbrook',
      regionPath: '/maplestory/maps/in/western-isle',
      areaPath: '/maplestory/maps/in/western-isle/meadowbrook',
    };

    expect(
      mapDetailBreadcrumbs({ view, buildId: 'cw-launch' }).map(
        ({ label, path }) => [label, path],
      ),
    ).toEqual([
      ['Home', '/'],
      ['Maps', '/maplestory/maps'],
      ['Western Isle', '/maplestory/maps/in/western-isle'],
      ['Meadowbrook', '/maplestory/maps/in/western-isle/meadowbrook'],
      [
        'Meadowbrook Hunting Field II',
        '/maplestory/maps/meadowbrook-hunting-ground-ii-00000000',
      ],
    ]);
  });
});
