import type { ItemKind } from './types';

export const otherEtc = {
  id: 'other-etc',
  group: 'etc',
  slug: 'other-etc',
  label: 'Other ETC',
  iconContentId:
    '01a2f55abad4412c067f2ff4bbded0ce3793affe55817e4fc84e70c808289a43',
  matches: (row) => row.itemClass === 'etc',
} satisfies ItemKind;
