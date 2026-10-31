import {
  Badge,
  Button,
  Card,
  Code,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';

import { MapleTipBrandHeader } from './BrandLogo';

const meta = {
  title: 'Brand/Foundations',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrinciplesAndIdentity: Story = {
  name: '1. Principles & Identity',
  render: (): ReactElement => (
    <Stack gap="xl" style={{ maxWidth: 840 }}>
      <MapleTipBrandHeader />
      <div>
        <Title order={1}>Brand Principles & Visual Identity</Title>
        <Text c="dimmed" size="sm" mt="xs">
          Approved MapleTip design system foundation v7 (Clear Porcelain &
          Graphite).
        </Text>
      </div>

      <Stack gap="md">
        <Paper p="md" withBorder>
          <Title order={2} size="h3">
            1. Reference first, game identity second
          </Title>
          <Text size="sm" mt="xs">
            Optimized for searching, filtering, comparing, and reading Classic
            MapleStory records. Conveys nostalgia through MapleTip&apos;s
            authentic mark, warm maple colors, and contextual pixel art without
            emulating clunky 2006 game-client chrome or decorative paper
            textures.
          </Text>
        </Paper>

        <Paper p="md" withBorder>
          <Title order={2} size="h3">
            2. One identity, two schemes
          </Title>
          <Text size="sm" mt="xs">
            Light is <strong>Clear Porcelain</strong> (clean white and subtle
            gray), dark is <strong>Graphite</strong> (charcoal neutral). Both
            form a unified semantic system, not competing aesthetics. Dark
            remains default; no runtime palette picker is shipped.
          </Text>
        </Paper>

        <Paper p="md" withBorder>
          <Title order={2} size="h3">
            3. Quiet information canvas
          </Title>
          <Text size="sm" mt="xs">
            Color highlights actions, state, relationships, and identity—not
            every cell or number is orange. Hierarchy is established through
            typography, position, spacing, and grouping.
          </Text>
        </Paper>

        <Paper p="md" withBorder>
          <Title order={2} size="h3">
            4. Softly rounded but precise
          </Title>
          <Text size="sm" mt="xs">
            Controls and inputs use restrained ~8px radius; outer panels and
            cards use ~12px radius. Table internal data cells remain strictly
            squared to preserve numeric scanning and border alignments.
          </Text>
        </Paper>

        <Paper p="md" withBorder>
          <Title order={2} size="h3">
            5. Accessibility as a constraint
          </Title>
          <Text size="sm" mt="xs">
            WCAG 2.2 AA compliant. Keyboard focus is warm Maple Orange / apricot
            with a 2px offset and focus gap, visible on Walnut CTAs and
            selection rows alike.
          </Text>
        </Paper>
      </Stack>
    </Stack>
  ),
};

export const TypographyAndHierarchy: Story = {
  name: '2. Typography & Hierarchy',
  render: (): ReactElement => (
    <Stack gap="xl" style={{ maxWidth: 880 }}>
      <div>
        <Title order={1}>Productive Information Typography</Title>
        <Text c="dimmed" size="sm" mt="xs">
          System sans-serif stack; scalable rem units, tabular figures for
          numeric alignment, and semantic heading levels.
        </Text>
      </div>

      <Table withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Role</Table.Th>
            <Table.Th>Size / Line-height</Table.Th>
            <Table.Th>Weight</Table.Th>
            <Table.Th>Example</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Page Heading (h1)</Table.Td>
            <Table.Td>28px / 36px (1.75rem)</Table.Td>
            <Table.Td>600</Table.Td>
            <Table.Td>
              <Title order={1}>Browse Monsters</Title>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Entity Heading (h2)</Table.Td>
            <Table.Td>24px / 32px (1.5rem)</Table.Td>
            <Table.Td>600</Table.Td>
            <Table.Td>
              <Title order={2}>Crimson Balrog</Title>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Section Heading (h3)</Table.Td>
            <Table.Td>20px / 28px (1.25rem)</Table.Td>
            <Table.Td>600</Table.Td>
            <Table.Td>
              <Title order={3}>Spawn Geography</Title>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Component Heading (h4)</Table.Td>
            <Table.Td>16px / 24px (1rem)</Table.Td>
            <Table.Td>600</Table.Td>
            <Table.Td>
              <Title order={4}>Active Filters (3)</Title>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Product UI & Data</Table.Td>
            <Table.Td>14px / 20px (0.875rem)</Table.Td>
            <Table.Td>400 / 600</Table.Td>
            <Table.Td>
              <Text size="sm">Level 100 Boss Monster</Text>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Reading Text</Table.Td>
            <Table.Td>16px / 24px (1rem)</Table.Td>
            <Table.Td>400</Table.Td>
            <Table.Td>
              <Text size="md">
                Spawns periodically during the voyage to Orbis.
              </Text>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Metadata & Help</Table.Td>
            <Table.Td>12px / 16px (0.75rem)</Table.Td>
            <Table.Td>400–600</Table.Td>
            <Table.Td>
              <Text size="xs" c="dimmed">
                Source: v83 client WZ data
              </Text>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Numeric Columns</Table.Td>
            <Table.Td>14px / 20px (0.875rem)</Table.Td>
            <Table.Td>Tabular figures</Table.Td>
            <Table.Td>
              <Text size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                HP 100,000 / EXP 3,500
              </Text>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Stack>
  ),
};

export const SpacingAndShape: Story = {
  name: '3. Density, Spacing & Shape',
  render: (): ReactElement => (
    <Stack gap="xl" style={{ maxWidth: 840 }}>
      <div>
        <Title order={1}>Balanced-Compact Density & Rounded Shape</Title>
        <Text c="dimmed" size="sm" mt="xs">
          Calibrated for efficient scanning of tabular game data while keeping
          accessible touch targets.
        </Text>
      </div>

      <Stack gap="md">
        <Paper p="md" withBorder>
          <Title order={2} size="h4">
            Density Targets
          </Title>
          <Stack gap="xs" mt="xs">
            <Text size="sm">
              • <strong>Table rows:</strong> ~44–48px default row target; adapts
              gracefully to wrapping content without clipping.
            </Text>
            <Text size="sm">
              • <strong>Controls & inputs:</strong> ~40–44px height baseline
              satisfying WCAG 2.5.8 pointer target requirements.
            </Text>
            <Text size="sm">
              • <strong>Filter rail:</strong> persistent 240px width at ≥992px
              desktop; responsive drawer below 992px.
            </Text>
          </Stack>
        </Paper>

        <Paper p="md" withBorder>
          <Title order={2} size="h4">
            Rounded Surface Geometry
          </Title>
          <Group mt="md" gap="lg">
            <Card withBorder style={{ width: 220, borderRadius: 12 }}>
              <Text size="sm" fw={600}>
                Outer Card / Panel
              </Text>
              <Text size="xs" c="dimmed">
                radius: md (12px)
              </Text>
              <Button size="sm" mt="md">
                Control (8px)
              </Button>
            </Card>

            <Stack gap="xs">
              <Text size="sm">
                • <strong>Controls, inputs, selects:</strong> 8px radius
                (`radius: sm`).
              </Text>
              <Text size="sm">
                • <strong>Cards, drawers, dialogs:</strong> 12px radius
                (`radius: md`).
              </Text>
              <Text size="sm">
                • <strong>Badges & chips:</strong> 8px radius or contextual pill
                where appropriate.
              </Text>
              <Text size="sm">
                • <strong>Table cells:</strong> strictly square internal data
                cells for clean vertical grid lines.
              </Text>
            </Stack>
          </Group>
        </Paper>
      </Stack>
    </Stack>
  ),
};

export const FocusAndAccessibility: Story = {
  name: '4. Focus & Accessibility',
  render: (): ReactElement => (
    <Stack gap="xl" style={{ maxWidth: 840 }}>
      <div>
        <Title order={1}>Keyboard Focus & Interaction States</Title>
        <Text c="dimmed" size="sm" mt="xs">
          Warm Maple Orange focus ring with 2px offset and focus gap,
          guaranteeing contrast on Walnut CTAs, selected rows, and panels.
        </Text>
      </div>

      <Paper p="md" withBorder>
        <Title order={2} size="h4">
          Focus Verification on Real Controls
        </Title>
        <Text size="xs" c="dimmed" mb="md">
          Use the Tab key to navigate through the interactive controls below.
        </Text>

        <Stack gap="md">
          <Group gap="md">
            <Button>Walnut Primary CTA</Button>
            <Button variant="default">Default Button</Button>
            <Button variant="outline">Outline Action</Button>
          </Group>

          <Group gap="md">
            <a href="#focus-specimen">Standard Anchor Link</a>
            <Badge>Brand Badge</Badge>
          </Group>

          <Paper
            p="sm"
            style={{
              backgroundColor: 'var(--mapletip-color-selection)',
              border: '1px solid var(--mapletip-color-selection-edge)',
              borderRadius: 8,
            }}
          >
            <Group justify="space-between">
              <Text size="sm" fw={600}>
                Selected Table Row Context (Maple Glow)
              </Text>
              <Button size="compact-sm">Action in Row</Button>
            </Group>
          </Paper>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Title order={2} size="h4">
          Standards & Assistive Technology
        </Title>
        <Stack gap="xs" mt="xs">
          <Text size="sm">
            • <strong>WCAG 2.4.7 AA (Focus Visible):</strong> 2px perimeter
            ring, offset 2px, contrasting against both element and surface.
          </Text>
          <Text size="sm">
            • <strong>Forced Colors:</strong> System `Highlight` outline under
            Windows High Contrast / forced-colors modes.
          </Text>
          <Text size="sm">
            • <strong>Reduced Motion:</strong> Honored across transitions,
            drawers, and DataTable animations.
          </Text>
          <Text size="sm">
            • <strong>320px Reflow:</strong> No horizontal page-level overflow
            at 320px minimum viewport.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  ),
};

export const IconographyAndMedia: Story = {
  name: '5. Iconography, Sprites & Motion',
  render: (): ReactElement => (
    <Stack gap="xl" style={{ maxWidth: 840 }}>
      <div>
        <Title order={1}>Iconography & Game Media Guidelines</Title>
        <Text c="dimmed" size="sm" mt="xs">
          Distinguishing user interface controls from authentic game content
          assets.
        </Text>
      </div>

      <Stack gap="md">
        <Paper p="md" withBorder>
          <Title order={2} size="h4">
            1. UI Icons (Phosphor)
          </Title>
          <Text size="sm" mt="xs">
            Phosphor is the standard icon family for UI navigation, sorting,
            filtering, and dismiss actions. Standard sizing: 16px (inline), 20px
            (buttons/headers), 24px (standalone). Icon-only buttons must have an
            explicit <Code>aria-label</Code>.
          </Text>
        </Paper>

        <Paper p="md" withBorder>
          <Title order={2} size="h4">
            2. Game Sprites & Media
          </Title>
          <Text size="sm" mt="xs">
            Authentic MapleStory sprites, mob icons, and item thumbnails are
            content assets, not generic icons. They render with crisp pixel art
            scaling (nearest-neighbor when scaled), preserving aspect ratios.
          </Text>
        </Paper>

        <Paper p="md" withBorder>
          <Title order={2} size="h4">
            3. Missing Media Resilience
          </Title>
          <Text size="sm" mt="xs">
            Missing, broken, or unavailable artwork falls back to a neutral
            container labeled with <Code>role=&quot;img&quot;</Code> and an
            accessible description. Records remain fully searchable, readable,
            and navigable without imagery.
          </Text>
        </Paper>
      </Stack>
    </Stack>
  ),
};
