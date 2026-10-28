import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';

import { ComparisonTable as ComparisonTableComponent } from '@/components/Table/ComparisonTable';
import type { SortIntent } from '@/components/Table/types';
import { demoRecords, makeDemoColumns } from '@/fixtures/records';

function ComparisonTableExample() {
  const columns = useMemo(() => makeDemoColumns(), []);
  const [sort, setSort] = useState<SortIntent>({
    field: 'value1',
    direction: 'desc',
  });

  return (
    <div style={{ padding: 24 }}>
      <ComparisonTableComponent
        ariaLabel="Comparison records"
        records={demoRecords.slice(0, 12)}
        columns={columns}
        idAccessor="id"
        identityField="name"
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

export const ComparisonTable: Story = {
  render: () => <ComparisonTableExample />,
};
