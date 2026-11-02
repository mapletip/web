import {
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  mapleRadius,
  radiusScale,
  spacingScale,
  toPixels,
} from '@/components/Brand/SpacingAndShape/spacingAndShape';

function radiusUsage(token: string, value: string): string {
  if (token === 'sm') return `Controls (${toPixels(value)})`;
  if (token === 'md') return `Panels (${toPixels(value)})`;
  return 'Contextual';
}

const meta = {
  title: 'Brand/Spacing and Shape',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const FoundationScale: Story = {
  name: 'Foundation Scale',
  render: () => (
    <Stack gap="xl" maw={1000}>
      <Text>
        Use the spacing scale for rhythm. Controls use the small radius, outer
        panels use the medium radius, and internal table cells stay square so
        their column boundaries line up.
      </Text>

      <Stack gap="sm">
        <Title order={2}>Spacing scale</Title>
        <Table
          aria-label="Spacing scale"
          withTableBorder
          withColumnBorders
          style={{ backgroundColor: 'var(--mapletip-color-panel)' }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th scope="col" style={{ width: 64 }}>
                Preview
              </Table.Th>
              <Table.Th scope="col">Token</Table.Th>
              <Table.Th scope="col">Value</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {spacingScale.map(([token, value]) => (
              <Table.Tr key={token}>
                <Table.Td
                  style={{
                    width: 64,
                    textAlign: 'center',
                  }}
                >
                  <Group gap={value} wrap="nowrap" aria-hidden="true">
                    <Box
                      w={6}
                      h={16}
                      style={{ backgroundColor: 'var(--mapletip-color-brand)' }}
                    />
                    <Box
                      w={6}
                      h={16}
                      style={{ backgroundColor: 'var(--mapletip-color-brand)' }}
                    />
                  </Group>
                </Table.Td>
                <Table.Td>{token}</Table.Td>
                <Table.Td>{value}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>

      <Stack gap="sm">
        <Title order={2}>Radius and boundaries</Title>
        <Table
          aria-label="Radius scale"
          withTableBorder
          withColumnBorders
          style={{ backgroundColor: 'var(--mapletip-color-panel)' }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th scope="col" style={{ width: 56 }}>
                Preview
              </Table.Th>
              <Table.Th scope="col">Token</Table.Th>
              <Table.Th scope="col">Value</Table.Th>
              <Table.Th scope="col">Use</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {radiusScale.map(([token, value]) => (
              <Table.Tr key={token}>
                <Table.Td
                  style={{
                    width: 56,
                    textAlign: 'center',
                  }}
                >
                  <Box
                    aria-hidden="true"
                    w={36}
                    h={24}
                    mx="auto"
                    style={{
                      border: '1px solid var(--mapletip-color-border-strong)',
                      borderRadius: value,
                      backgroundColor: 'var(--mapletip-color-raised)',
                    }}
                  />
                </Table.Td>
                <Table.Td>{token}</Table.Td>
                <Table.Td>{value}</Table.Td>
                <Table.Td>{radiusUsage(token, value)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>

      <Group align="stretch" grow>
        <Paper
          p="md"
          withBorder
          style={{
            backgroundColor: 'var(--mapletip-color-panel)',
            borderColor: 'var(--mapletip-color-border-subtle)',
            borderRadius: mapleRadius.md,
          }}
        >
          <Text fw={600}>Subtle divider</Text>
          <Text size="sm" c="dimmed">
            Decorative separation between content regions.
          </Text>
        </Paper>
        <Paper
          p="md"
          withBorder
          style={{
            backgroundColor: 'var(--mapletip-color-panel)',
            borderColor: 'var(--mapletip-color-border-strong)',
            borderRadius: mapleRadius.md,
          }}
        >
          <Text fw={600}>Strong boundary</Text>
          <Text size="sm" c="dimmed">
            A visible edge for an essential control.
          </Text>
        </Paper>
      </Group>

      <Stack gap="sm">
        <Title order={2}>Density on a real table</Title>
        <Text>
          This table keeps square cells and a 48px comparison row. Medium
          controls show the normal 40–44px control range without imposing fixed
          heights on wrapping content.
        </Text>
        <Group align="end" mb="md">
          <Button size="md">Walnut action</Button>
          <TextInput label="Find a record" placeholder="Name or ID" size="md" />
        </Group>
        <Table
          aria-label="Reference table density"
          withTableBorder
          withColumnBorders
          style={{
            backgroundColor: 'var(--mapletip-color-panel)',
            borderRadius: 0,
          }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th scope="col">Record</Table.Th>
              <Table.Th scope="col">Level</Table.Th>
              <Table.Th scope="col">Experience</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr style={{ height: '48px' }}>
              <Table.Td>Crimson Balrog</Table.Td>
              <Table.Td>100</Table.Td>
              <Table.Td>3,500</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Stack>
    </Stack>
  ),
};
