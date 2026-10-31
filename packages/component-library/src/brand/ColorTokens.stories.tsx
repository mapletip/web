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
import { approvedColorTokens } from '@mapletip/theme';
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
  name: 'Approved Color Tokens (v7)',
  render: (): ReactElement => {
    const { locked } = approvedColorTokens;

    return (
      <Stack gap="xl" style={{ maxWidth: 960 }}>
        <div>
          <Title order={1}>Approved Color Foundation v7</Title>
          <Text c="dimmed" size="sm" mt="xs">
            Normative color contract from approved-color-tokens.json.
          </Text>
        </div>

        <Paper p="md" withBorder>
          <Title order={2} size="h4" mb="xs">
            Locked Brand System Choices
          </Title>
          <Grid>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Background
              </Text>
              <Text size="sm" fw={600}>
                {locked.background}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Primary CTA
              </Text>
              <Text size="sm" fw={600}>
                {locked.cta}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Selection
              </Text>
              <Text size="sm" fw={600}>
                {locked.selection}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Identity
              </Text>
              <Text size="sm" fw={600}>
                {locked.identity}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Links & Focus
              </Text>
              <Text size="sm" fw={600}>
                {locked.linksAndFocus}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Boundaries
              </Text>
              <Text size="sm" fw={600}>
                {locked.boundaries}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Statuses
              </Text>
              <Text size="sm" fw={600}>
                {locked.statuses}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text size="xs" c="dimmed">
                Heritage Soft
              </Text>
              <Text size="sm" fw={600}>
                {locked.soft}
              </Text>
            </Grid.Col>
          </Grid>
        </Paper>

        <Stack gap="lg">
          <Title order={2} size="h3">
            Primary Action vs Brand Accent
          </Title>
          <Text size="sm">
            Walnut primary actions and Classic Maple identity orange are
            separate semantic concepts:
          </Text>
          <Group gap="md">
            <Swatch
              label="Walnut CTA (Light)"
              hex="#3D332C"
              fg="#FFFFFF"
              roleDescription="Primary filled actions"
            />
            <Swatch
              label="Walnut CTA (Dark)"
              hex="#514039"
              fg="#F9EFE4"
              roleDescription="Dark primary filled action"
            />
            <Swatch
              label="Classic Maple (Light)"
              hex="#DD9554"
              fg="#2B2017"
              roleDescription="Brand accent & badges"
            />
            <Swatch
              label="Classic Maple (Dark)"
              hex="#EBA85F"
              fg="#211B15"
              roleDescription="Dark brand accent"
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
                <Table.Th>Light (fg / bg)</Table.Th>
                <Table.Th>Dark (fg / bg)</Table.Th>
                <Table.Th>Preview</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>Success</Table.Td>
                <Table.Td>#176647 / #E6F6EC</Table.Td>
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
                <Table.Td>#795514 / #FFF3D5</Table.Td>
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
                <Table.Td>#9A293B / #FBE8EC</Table.Td>
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
                <Table.Td>#2A5878 / #E8F1FB</Table.Td>
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
            Surfaces & Boundaries
          </Title>
          <Group gap="md">
            <Swatch
              label="Porcelain Canvas"
              hex="#FAFAFB"
              roleDescription="Light body background"
            />
            <Swatch
              label="Porcelain Panel"
              hex="#FFFFFF"
              roleDescription="Light cards and table"
            />
            <Swatch
              label="Graphite Canvas"
              hex="#111114"
              fg="#F5F5F5"
              roleDescription="Dark body background"
            />
            <Swatch
              label="Graphite Panel"
              hex="#1A1A1D"
              fg="#F5F5F5"
              roleDescription="Dark cards and table"
            />
            <Swatch
              label="Maple Glow Selection"
              hex="#FFF2E2"
              roleDescription="Light selected row"
            />
            <Swatch
              label="Graphite Selection"
              hex="#4D382B"
              fg="#F5F5F5"
              roleDescription="Dark selected row"
            />
            <Swatch
              label="Heritage Soft"
              hex="#FDF0E4"
              roleDescription="Warm highlight (light)"
            />
          </Group>
        </Stack>
      </Stack>
    );
  },
};
