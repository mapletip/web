import type { ItemKind } from './types';

const numberFormat = new Intl.NumberFormat('en-US');

export const chairs = {
  id: 'chairs',
  group: 'setup',
  slug: 'chairs',
  label: 'Chairs',
  iconContentId:
    '15ceb9596a6bdc8f61f8aa1382292f3b428a30281315b83ed0499c5d0492e120',
  matches: (row) =>
    row.itemClass === 'setup' && row.types?.includes('chair') === true,
  card: {
    lead: (row) => {
      const parts = [
        row.seatHp === undefined
          ? undefined
          : `+${numberFormat.format(row.seatHp)} HP`,
        row.seatMp === undefined
          ? undefined
          : `+${numberFormat.format(row.seatMp)} MP`,
      ].filter((part) => part !== undefined);
      return parts.length > 0 ? parts.join(' · ') : undefined;
    },
    facets: () => [
      {
        id: 'recovery-type',
        field: 'recoveryTypes',
        label: 'Recovery',
        kind: 'multi-select',
        placement: 'results',
        options: [
          { value: 'hp', label: 'Recovers HP' },
          { value: 'mp', label: 'Recovers MP' },
        ],
      },
    ],
    queryFields: () => [
      {
        id: 'recoveryTypes',
        accessor: (row) => [
          ...(row.seatHp !== undefined ? ['hp'] : []),
          ...(row.seatMp !== undefined ? ['mp'] : []),
        ],
        sortable: false,
      },
      {
        id: 'recovery',
        accessor: (row) => (row.seatHp ?? 0) + (row.seatMp ?? 0),
        firstSortDirection: 'desc',
      },
    ],
    sortOptions: [{ label: 'Recovery', field: 'recovery', direction: 'desc' }],
  },
} satisfies ItemKind;
