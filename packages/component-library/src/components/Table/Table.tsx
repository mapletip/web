import type { ReactElement } from 'react';

import '@/components/Table/styles';

import type { TableProps } from '@/components/Table';
import { MantineDataTableAdapter } from '@/components/Table/MantineDataTableAdapter';

/**
 * Thin public composition over Mantine DataTable 9.x. TanStack (`useFacetedBrowser`)
 * owns query, sort, pagination and visibility; DataTable owns rendering and grid mechanics.
 */
export function Table<TRow extends Record<string, unknown>>(
  props: TableProps<TRow>,
): ReactElement {
  return <MantineDataTableAdapter<TRow> {...props} />;
}
