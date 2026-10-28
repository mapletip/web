import { MantineProvider } from '@mantine/core';
import { gzipSync } from 'node:zlib';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ComparisonTable } from '@/components/Table/ComparisonTable';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';
import { theme } from '@/theme';

describe('ComparisonTable server rendering (Mantine DataTable)', () => {
  it('renders every record, entity href and header of a 100-record page in order', () => {
    const records = demoRecords.slice(0, 100);
    const columns = makeDemoColumns();
    const html = renderToString(
      <MantineProvider theme={theme} forceColorScheme="light">
        <ComparisonTable
          ariaLabel="Server records"
          records={records}
          columns={columns}
          idAccessor="id"
          identityField="name"
          sortStatus={{ field: 'value1', direction: 'desc' }}
          onSortChange={() => undefined}
        />
      </MantineProvider>,
    );

    console.log(
      `[DataTable SSR measurement] raw: ${Buffer.byteLength(html)} B | gzip: ${gzipSync(html).byteLength} B`,
    );
    expect(html).toContain('mantine-datatable');
    expect(html).toContain('aria-label="Server records"');
    for (const column of columns) {
      expect(html).toContain(column.title);
    }

    const hrefs = [...html.matchAll(/href="(\/records\/record-\d+)"/gu)].map(
      (match) => match[1],
    );
    expect(hrefs).toEqual(records.map((record) => record.href));
    expect(hrefs).toHaveLength(100);
  });
});
