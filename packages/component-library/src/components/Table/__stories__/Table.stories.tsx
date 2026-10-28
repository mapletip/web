import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';

import { Table as TableComponent } from '@/components/Table/Table';
import type { SortIntent } from '@/components/Table/types';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

function TableExample() {
  const columns = useMemo(() => makeDemoColumns(), []);
  const [sort, setSort] = useState<SortIntent>({
    field: 'value1',
    direction: 'desc',
  });

  return (
    <div style={{ padding: 24 }}>
      <TableComponent
        ariaLabel="Records"
        records={demoRecords.slice(0, 12)}
        columns={columns}
        idAccessor="id"
        sortStatus={sort}
        onSortChange={setSort}
        maxHeight={480}
      />
    </div>
  );
}

const meta = {
  title: 'Components/Table',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Table: Story = {
  render: () => <TableExample />,
};
