import {
  Badge,
  Card,
  Grid,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

const meta = {
  title: 'Brand/Color System',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface SwatchProps {
  readonly label: string;
  readonly hex: string;
  readonly fg?: string;
  readonly border?: string;
  readonly roleDescription?: string;
}

function Swatch({
  label,
  hex,
  fg = '#27272A',
  border = '1px solid var(--mapletip-color-border-subtle)',
  roleDescription,
}: SwatchProps): ReactElement {
  return (
    <Card p="xs" withBorder style={{ minWidth: 160 }}>
      <div
        style={{
          height: 48,
          borderRadius: 6,
          backgroundColor: hex,
          border,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: fg,
          fontWeight: 600,
          fontSize: '0.8125rem',
          letterSpacing: '0.02em',
        }}
      >
        {hex}
      </div>
      <Text size="xs" fw={600} mt="xs">
        {label}
      </Text>
      {roleDescription ? (
        <Text size="xs" c="dimmed">
          {roleDescription}
        </Text>
      ) : null}
    </Card>
  );
}

export const ApprovedFoundationV7: Story = {
  name: 'Approved Color Tokens (Maple Twilight)',
  render: (): ReactElement => {
    return (
      <Stack gap="xl" style={{ maxWidth: 960 }}>
        <div>
          <Title order={1}>Approved Color Foundation: Maple Twilight</Title>
          <Text c="dimmed" size="sm" mt="xs">
            Canonical dark theme color contract.
          </Text>
        </div>

        <Paper p="md" withBorder>
          <Title order={2} size="h4" mb="xs">
            Locked Brand System Choices
          </Title>
          <Grid>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Architecture
              </Text>
              <Text size="sm" fw={600}>
                Dark Theme Only
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Primary CTA
              </Text>
              <Text size="sm" fw={600}>
                Walnut Glow
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Selection
              </Text>
              <Text size="sm" fw={600}>
                Maple Selection
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Identity & Links
              </Text>
              <Text size="sm" fw={600}>
                Luminous Amber
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Boundaries
              </Text>
              <Text size="sm" fw={600}>
                Charcoal Steel
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Statuses
              </Text>
              <Text size="sm" fw={600}>
                Clear Signals
              </Text>
            </Grid.Col>
          </Grid>
        </Paper>

        <Stack gap="lg">
          <Title order={2} size="h3">
            Primary Action vs Brand Accent
          </Title>
          <Text size="sm">
            Walnut primary actions and luminous Maple amber identity are
            separate semantic concepts:
          </Text>
          <Group gap="md">
            <Swatch
              label="Walnut CTA Background"
              hex="#3A2312"
              fg="#F0A456"
              roleDescription="Primary filled actions"
            />
            <Swatch
              label="Walnut CTA Foreground"
              hex="#F0A456"
              fg="#111417"
              roleDescription="CTA text & icon (7.95:1)"
            />
            <Swatch
              label="Walnut CTA Border"
              hex="#8F7665"
              fg="#000000"
              roleDescription="Essential boundary (3.86:1)"
            />
            <Swatch
              label="Walnut CTA Hover"
              hex="#4E2F18"
              fg="#F0A456"
              roleDescription="Primary button hover"
            />
            <Swatch
              label="Maple Amber (Brand & Link)"
              hex="#F0A456"
              fg="#111417"
              roleDescription="Brand accent & text links"
            />
          </Group>
        </Stack>

        <Stack gap="lg">
          <Title order={2} size="h3">
            Clear Signals Semantic Statuses
          </Title>
          <Text size="sm">
            Accessible status roles meeting ≥4.5:1 contrast against surface and
            paired background:
          </Text>
          <Table withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Role</Table.Th>
                <Table.Th>Tokens (fg / bg)</Table.Th>
                <Table.Th>Preview</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>Success</Table.Td>
                <Table.Td>#ACE0C2 / #20372B</Table.Td>
                <Table.Td>
                  <Badge
                    style={{
                      backgroundColor:
                        'var(--mapletip-color-status-success-bg)',
                      color: 'var(--mapletip-color-status-success)',
                    }}
                  >
                    Verified
                  </Badge>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Warning</Table.Td>
                <Table.Td>#F4D397 / #443524</Table.Td>
                <Table.Td>
                  <Badge
                    style={{
                      backgroundColor:
                        'var(--mapletip-color-status-warning-bg)',
                      color: 'var(--mapletip-color-status-warning)',
                    }}
                  >
                    Uncertain
                  </Badge>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Danger</Table.Td>
                <Table.Td>#F8ADB8 / #46282F</Table.Td>
                <Table.Td>
                  <Badge
                    style={{
                      backgroundColor: 'var(--mapletip-color-status-danger-bg)',
                      color: 'var(--mapletip-color-status-danger)',
                    }}
                  >
                    Unavailable
                  </Badge>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Info</Table.Td>
                <Table.Td>#B0D5F3 / #26394A</Table.Td>
                <Table.Td>
                  <Badge
                    style={{
                      backgroundColor: 'var(--mapletip-color-status-info-bg)',
                      color: 'var(--mapletip-color-status-info)',
                    }}
                  >
                    Build Context
                  </Badge>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Stack>

        <Stack gap="lg">
          <Title order={2} size="h3">
            Maple Twilight Dark Surfaces & Boundaries
          </Title>
          <Group gap="md">
            <Swatch
              label="Canvas Background"
              hex="#111417"
              fg="#F4F1EA"
              roleDescription="Deep neutral background"
            />
            <Swatch
              label="Panel Surface"
              hex="#1A1D20"
              fg="#F4F1EA"
              roleDescription="Cards, containers, headers"
            />
            <Swatch
              label="Raised / Hover"
              hex="#22262B"
              fg="#F4F1EA"
              roleDescription="Raised surfaces & row hover"
            />
            <Swatch
              label="Brand Wash"
              hex="#261F1A"
              fg="#F0A456"
              roleDescription="Subtle brand / alert tint"
            />
            <Swatch
              label="Selection Surface"
              hex="#3A2E24"
              fg="#F4F1EA"
              roleDescription="Active / selected row"
            />
            <Swatch
              label="Border Strong"
              hex="#788088"
              fg="#111417"
              roleDescription="Essential control boundary"
            />
            <Swatch
              label="Border Subtle"
              hex="#2C3137"
              fg="#F4F1EA"
              roleDescription="Decorative divider"
            />
          </Group>
        </Stack>
      </Stack>
    );
  },
};
