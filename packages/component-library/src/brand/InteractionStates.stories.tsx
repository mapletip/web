import {
  Anchor,
  Button,
  Checkbox,
  Group,
  NativeSelect,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Brand/Foundations/Interaction States',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ControlStates: Story = {
  render: () => (
    <Stack gap="md" maw={760}>
      <Text size="sm" c="dimmed">
        Hover enabled controls, use Tab to see keyboard focus, and press and
        hold a button to inspect its active feedback.
      </Text>

      <Group gap="sm">
        <Button color="walnut">Walnut primary action</Button>
        <Button color="walnut" variant="outline" aria-pressed="true">
          Compare selected record
        </Button>
        <Button color="walnut" disabled>
          Disabled action
        </Button>
      </Group>

      <Group align="end" gap="md">
        <Anchor href="#interaction-help">Open record details</Anchor>
        <TextInput label="Search records" placeholder="Name or ID" />
        <NativeSelect
          label="Region"
          data={['All regions', 'Victoria Island', 'Ossyria']}
        />
      </Group>

      <Checkbox defaultChecked label="Include selected records" />

      <Table
        aria-label="Selected record state"
        withTableBorder
        withColumnBorders
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col">Record</Table.Th>
            <Table.Th scope="col">Level</Table.Th>
            <Table.Th scope="col">State</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr
            aria-selected="true"
            style={{
              backgroundColor: 'var(--mapletip-color-selection)',
              boxShadow: 'inset 3px 0 0 var(--mapletip-color-selection-edge)',
            }}
          >
            <Table.Td>Crimson Balrog</Table.Td>
            <Table.Td>100</Table.Td>
            <Table.Td>Selected</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>

      <Text id="interaction-help" size="xs" c="dimmed">
        Focus uses the Maple Twilight focus token and remains distinct from
        selection.
      </Text>
    </Stack>
  ),
};
