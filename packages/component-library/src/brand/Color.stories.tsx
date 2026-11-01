import {
  ColorSwatch,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { colorGroups, contrastPairs, contrastRatio } from './color-foundation';

const meta = {
  title: 'Brand/Foundations/Color',
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
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {group.roles.map(([label, token, color]) => (
              <Paper
                key={token}
                p="sm"
                withBorder
                style={{
                  backgroundColor: 'var(--mapletip-color-panel)',
                  borderColor: 'var(--mapletip-color-border-subtle)',
                }}
              >
                <Group gap="sm" wrap="nowrap">
                  <ColorSwatch color={color} size={36} aria-hidden="true" />
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {label}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {token}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      ))}

      <Stack gap="sm">
        <Title order={2}>Text and signal contrast</Title>
        <Text size="sm" c="dimmed">
          Ratios use the same tokens shown above. Ordinary text pairs meet
          4.5:1; focus is a non-text indicator checked against the panel at 3:1
          or better.
        </Text>
        <Table
          aria-label="Maple Twilight contrast ratios"
          withTableBorder
          withColumnBorders
          style={{ backgroundColor: 'var(--mapletip-color-panel)' }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th scope="col">Pair</Table.Th>
              <Table.Th scope="col">Contrast ratio</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {contrastPairs.map(([label, foreground, background]) => (
              <Table.Tr key={label}>
                <Table.Td>{label}</Table.Td>
                <Table.Td>{contrastRatio(foreground, background)}:1</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Stack>
  ),
};
