import { Table, Text, Title } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  numericTextStyle,
  typographyTheme,
} from '@/components/Brand/Typography/typography';

const meta = {
  title: 'Brand/Typography',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeScale: Story = {
  name: 'Type Scale',
  render: () => (
    <Table
      aria-label="MapleTip type scale"
      withTableBorder
      withColumnBorders
      style={{ backgroundColor: 'var(--mapletip-color-panel)' }}
    >
      <Table.Thead>
        <Table.Tr>
          <Table.Th scope="col">Role</Table.Th>
          <Table.Th scope="col">Theme token</Table.Th>
          <Table.Th scope="col">Size / line height</Table.Th>
          <Table.Th scope="col">Specimen</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        <Table.Tr>
          <Table.Td>Page heading</Table.Td>
          <Table.Td>h1</Table.Td>
          <Table.Td>
            {typographyTheme.headings.sizes.h1.fontSize} /{' '}
            {typographyTheme.headings.sizes.h1.lineHeight}
          </Table.Td>
          <Table.Td>
            <Title order={1}>Browse monsters</Title>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>Entity heading</Table.Td>
          <Table.Td>h2</Table.Td>
          <Table.Td>
            {typographyTheme.headings.sizes.h2.fontSize} /{' '}
            {typographyTheme.headings.sizes.h2.lineHeight}
          </Table.Td>
          <Table.Td>
            <Title order={2}>Crimson Balrog</Title>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>Section heading</Table.Td>
          <Table.Td>h3</Table.Td>
          <Table.Td>
            {typographyTheme.headings.sizes.h3.fontSize} /{' '}
            {typographyTheme.headings.sizes.h3.lineHeight}
          </Table.Td>
          <Table.Td>
            <Title order={3}>Spawn geography</Title>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>Component heading</Table.Td>
          <Table.Td>h4</Table.Td>
          <Table.Td>
            {typographyTheme.headings.sizes.h4.fontSize} /{' '}
            {typographyTheme.headings.sizes.h4.lineHeight}
          </Table.Td>
          <Table.Td>
            <Title order={4}>Active filters</Title>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>Interface and data</Table.Td>
          <Table.Td>sm</Table.Td>
          <Table.Td>
            {typographyTheme.fontSizes.sm} / {typographyTheme.lineHeights.sm}
          </Table.Td>
          <Table.Td>
            <Text size="sm">Level 100 · Boss monster</Text>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>Reading text</Table.Td>
          <Table.Td>md</Table.Td>
          <Table.Td>
            {typographyTheme.fontSizes.md} / {typographyTheme.lineHeights.md}
          </Table.Td>
          <Table.Td>
            <Text size="md">
              Spawns periodically during the voyage to Orbis.
            </Text>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>Metadata and help</Table.Td>
          <Table.Td>xs</Table.Td>
          <Table.Td>
            {typographyTheme.fontSizes.xs} / {typographyTheme.lineHeights.xs}
          </Table.Td>
          <Table.Td>
            <Text size="xs" c="dimmed">
              Source: v83 client data
            </Text>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>Numeric values</Table.Td>
          <Table.Td>sm + tabular figures</Table.Td>
          <Table.Td>
            {typographyTheme.fontSizes.sm} / {typographyTheme.lineHeights.sm}
          </Table.Td>
          <Table.Td>
            <Text size="sm" style={numericTextStyle}>
              HP 100,000 · EXP 3,500
            </Text>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  ),
};
