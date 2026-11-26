import type { ItemKind } from './types';

export const otherSetup = {
  id: 'other-setup',
  group: 'setup',
  slug: 'other-setup',
  label: 'Other Set-up',
  matches: (row) => row.itemClass === 'setup',
} satisfies ItemKind;
