import type { ReactElement } from 'react';

import { FacetedBrowser } from '@/components/FacetedBrowser/FacetedBrowser';
import {
  demoRecords,
  demoRowsPerPage,
  makeDemoColumns,
} from '@/fixtures/records';

/** Static neutral composition shared by the Node SSR and browser hydration checks. */
export function NeutralBrowserMarkup(): ReactElement {
  return (
    <FacetedBrowser
      title={<h1>Browse records</h1>}
      resultsLabel="Records"
      presentation="comparison"
      records={demoRecords}
      columns={makeDemoColumns()}
      idAccessor="id"
      identityField="name"
      renderCard={(record) => (
        <article>
          <a href={record.href}>{record.name}</a>
        </article>
      )}
      tableLabel="Records sorted by value 1 descending"
      tableMaxHeight={480}
      defaultState={{
        search: '',
        filters: {},
        sort: { field: 'value1', direction: 'desc' },
        page: 1,
        pageSize: demoRowsPerPage,
        hiddenColumns: [],
      }}
      getPageHref={(page) => `?page=${page}`}
    />
  );
}
