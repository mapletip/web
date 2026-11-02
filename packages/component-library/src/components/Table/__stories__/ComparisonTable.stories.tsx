import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

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
  play: async ({ canvasElement }) => {
    // Regression: the header row is flush with the table's clipped top edge
    // (`.comparisonTable`), so a focus ring drawn with the brand's 2px offset
    // loses its top edge. Tab onto a sortable header and assert the painted ring
    // stays inside the table box that clips it.
    const canvas = within(canvasElement);
    await userEvent.tab();

    const header = canvas.getByRole('button', { name: /^Record\b/u });
    await expect(header).toHaveFocus();

    const table = canvas.getByRole('table', { name: 'Comparison records' });
    const style = getComputedStyle(header);
    // The ring is painted outward from the border edge's `outline-offset` line,
    // so its outermost edge sits `offset + width` above the cell's top edge.
    const ringTop =
      header.getBoundingClientRect().top -
      (Number.parseFloat(style.outlineOffset) +
        Number.parseFloat(style.outlineWidth));

    await expect(style.outlineStyle, 'header focus ring is painted').toBe(
      'solid',
    );
    await expect(
      ringTop,
      'header focus ring is not clipped by the table top edge',
    ).toBeGreaterThanOrEqual(table.getBoundingClientRect().top);
  },
};
