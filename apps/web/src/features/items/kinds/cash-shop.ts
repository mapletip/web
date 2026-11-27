import type { ItemKind } from './types';

const numberFormat = new Intl.NumberFormat('en-US');

export const cashShop = {
  id: 'cash-shop',
  group: 'cash',
  slug: 'cash-shop',
  label: 'Cash Shop',
  iconContentId:
    'e92811536cb6820a65eafaea2452b94161951361e5ed35b16035f0207d8939f0',
  matches: (row) => row.itemClass === 'cash',
  card: {
    lead: (row) =>
      row.nxPrice === undefined
        ? undefined
        : `${numberFormat.format(row.nxPrice)} NX`,
    facets: ({ coverage }) =>
      coverage?.relationships['cash-shop-listing'] === 'complete'
        ? [
            {
              id: 'listing-status',
              field: 'listed',
              label: 'Cash Shop listing',
              kind: 'multi-select',
              placement: 'results',
              options: [
                { value: 'listed', label: 'Listed' },
                { value: 'not-listed', label: 'Not listed' },
              ],
            },
          ]
        : [],
    queryFields: () => [
      {
        id: 'listed',
        accessor: (row) =>
          (row.cashShopListingCount ?? 0) > 0 ? 'listed' : 'not-listed',
        sortable: false,
      },
    ],
  },
} satisfies ItemKind;
