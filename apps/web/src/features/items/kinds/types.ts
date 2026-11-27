import type { ItemRow } from '../browse/project';

export interface ItemKind {
  readonly id: string;
  readonly group: 'use' | 'etc' | 'setup' | 'cash';
  readonly slug: string;
  readonly label: string;
  readonly iconContentId?: string;
  readonly matches: (row: ItemRow) => boolean;
}
