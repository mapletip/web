import { describe, expect, it } from 'vitest';

import { mapDetailBreadcrumbs, mapDetailMetadata } from '../metadata';

describe('Map Detail breadcrumbs', () => {
  it('omits an area matching the map name from the trail and JSON-LD', () => {
    const view = {
      name: 'Henesys',
      canonicalPath: '/maplestory/maps/henesys-00000000',
      regionLabel: 'Victoria Island',
      areaLabel: '  hENESys  ',
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
      'Victoria Island',
      'Henesys',
    ]);
    expect(jsonLd.itemListElement.map(({ name }) => name)).toEqual([
      'Home',
      'Maps',
      'Victoria Island',
      'Henesys',
    ]);
  });

  it('keeps a distinct area in the trail and JSON-LD', () => {
    const view = {
      name: 'Henesys Hunting Ground II',
      canonicalPath: '/maplestory/maps/henesys-hunting-ground-ii-00000000',
      regionLabel: 'Victoria Island',
      areaLabel: 'Henesys',
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
      'Victoria Island',
      'Henesys',
      'Henesys Hunting Ground II',
    ]);
    expect(jsonLd.itemListElement.map(({ name }) => name)).toEqual([
      'Home',
      'Maps',
      'Victoria Island',
      'Henesys',
      'Henesys Hunting Ground II',
    ]);
  });
});
