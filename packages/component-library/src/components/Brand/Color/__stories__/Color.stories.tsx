import { Stack, Table, Text, Title } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { colorGroups } from '@/components/Brand/Color/colorRoles';

const meta = {
  title: 'Brand/Color',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SemanticRoles: Story = {
  name: 'Semantic Roles',
  render: () => (
    <Stack gap="xl" maw={1100}>
      {colorGroups.map((group) => (
        <Stack key={group.title} gap="sm">
          <Title order={2}>{group.title}</Title>
          <Table
            aria-label={`${group.title} color tokens`}
            withTableBorder
            withColumnBorders
            style={{ backgroundColor: 'var(--mapletip-color-panel)' }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th scope="col" style={{ width: 32 }}>
                  Color
                </Table.Th>
                <Table.Th scope="col">Role / theme token</Table.Th>
                <Table.Th scope="col">Value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {group.roles.map(([label, token, color]) => (
                <Table.Tr key={token}>
                  <Table.Td
                    aria-label={`${label} color sample`}
                    title={color}
                    style={{
                      width: 32,
                      padding: 0,
                      backgroundColor: color,
                    }}
                  />
                  <Table.Th scope="row">
                    <Stack gap={0}>
                      <Text size="sm">{label}</Text>
                      <Text
                        size="xs"
                        c="dimmed"
                        style={{ overflowWrap: 'anywhere' }}
                      >
                        {token}
                      </Text>
                    </Stack>
                  </Table.Th>
                  <Table.Td style={{ whiteSpace: 'nowrap' }}>{color}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      ))}
    </Stack>
  ),
};
