import {
  Anchor,
  Badge,
  Button,
  Checkbox,
  Group,
  NativeSelect,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

const meta = {
  title: 'Brand/Mantine Native Specimen',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const NativeControlsSpecimen: Story = {
  name: 'Theme-styled Mantine Controls',
  render: (): ReactElement => (
    <Stack gap="xl" style={{ maxWidth: 840 }}>
      <div>
        <Title order={1}>Mantine Native Controls Specimen</Title>
        <Text c="dimmed" size="sm" mt="xs">
          Verifying Mantine defaults and variant resolvers with the approved
          brand: Walnut primary actions, Classic Maple identity badges, warm
          focus rings, and 8px control radius.
        </Text>
      </div>

      <Paper p="md" withBorder>
        <Title order={2} size="h4" mb="md">
          1. Buttons & Actions (Walnut Glow CTA vs Maple Brand)
        </Title>
        <Stack gap="md">
          <Group gap="sm">
            <Button>Walnut Filled (Default Primary)</Button>
            <Button variant="default">Default Variant</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="subtle">Subtle</Button>
            <Button disabled>Disabled</Button>
          </Group>

          <Group gap="sm">
            <Button color="maple">Maple Orange Button</Button>
            <Button color="maple" variant="light">
              Maple Light
            </Button>
            <Button color="maple" variant="subtle">
              Maple Subtle
            </Button>
          </Group>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Title order={2} size="h4" mb="md">
          2. Badges & Status Chips
        </Title>
        <Group gap="sm">
          <Badge>Maple Brand (Filled)</Badge>
          <Badge variant="light">Maple Light</Badge>
          <Badge variant="outline">Maple Outline</Badge>
          <Badge
            style={{
              backgroundColor: 'var(--mapletip-color-status-success-bg)',
              color: 'var(--mapletip-color-status-success)',
            }}
          >
            Verified Status
          </Badge>
          <Badge
            style={{
              backgroundColor: 'var(--mapletip-color-status-warning-bg)',
              color: 'var(--mapletip-color-status-warning)',
            }}
          >
            Uncertain Status
          </Badge>
          <Badge
            style={{
              backgroundColor: 'var(--mapletip-color-status-danger-bg)',
              color: 'var(--mapletip-color-status-danger)',
            }}
          >
            Unavailable
          </Badge>
          <Badge
            style={{
              backgroundColor: 'var(--mapletip-color-status-info-bg)',
              color: 'var(--mapletip-color-status-info)',
            }}
          >
            Build Info
          </Badge>
        </Group>
      </Paper>

      <Paper p="md" withBorder>
        <Title order={2} size="h4" mb="md">
          3. Inputs & Native Selects (~8px Radius)
        </Title>
        <Stack gap="sm" style={{ maxWidth: 400 }}>
          <TextInput
            label="Search keyword"
            placeholder="e.g. Crimson Balrog"
            defaultValue="Balrog"
          />
          <NativeSelect
            label="Region filter"
            data={['All Regions', 'Victoria Island', 'Ossyria', 'Ludus Lake']}
            defaultValue="Victoria Island"
          />
          <TextInput label="Disabled field" disabled value="Read-only value" />
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Title order={2} size="h4" mb="md">
          4. Checkboxes (Maple Primary with onBrand Check Mark)
        </Title>
        <Stack gap="xs">
          <Checkbox
            label="Boss monsters only (Checked)"
            defaultChecked
            aria-label="Boss monsters only"
          />
          <Checkbox
            label="Include quest-exclusive spawns (Unchecked)"
            aria-label="Include quest-exclusive spawns"
          />
          <Checkbox
            label="Disabled option"
            disabled
            defaultChecked
            aria-label="Disabled option"
          />
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Title order={2} size="h4" mb="md">
          5. Anchors & Text Links
        </Title>
        <Stack gap="xs">
          <Text size="sm">
            Here is an inline <Anchor href="#link">Mantine Anchor</Anchor> with
            underline and approved link color.
          </Text>
          <Text size="sm">
            Here is a plain <a href="#plain-link">native link</a> sharing the
            same anchor styling.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  ),
};
