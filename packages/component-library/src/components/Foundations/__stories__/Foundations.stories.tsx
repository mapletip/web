import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Checkbox,
  Code,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { Gear } from '@phosphor-icons/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, type ReactNode } from 'react';

const meta = {
  title: 'Foundations/Maple Twilight',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <Stack gap="sm">
      <Title order={2} size="h4">
        {title}
      </Title>
      {children}
    </Stack>
  );
}

function Swatch({
  label,
  color,
}: {
  readonly label: string;
  readonly color: string;
}) {
  return (
    <Group gap="sm" wrap="nowrap">
      <Box
        w={44}
        h={44}
        style={{
          flex: '0 0 auto',
          borderRadius: 'var(--mantine-radius-md)',
          border: '1px solid var(--mantine-color-default-border)',
          background: color,
        }}
      />
      <Stack gap={0}>
        <Text size="sm" fw={600}>
          {label}
        </Text>
        <Code>{color}</Code>
      </Stack>
    </Group>
  );
}

const surfaceRoles = [
  ['Canvas', 'var(--mantine-color-body)'],
  ['Panel', 'var(--mantine-color-default)'],
  ['Raised', 'var(--mantine-color-default-hover)'],
] as const;

const semanticRoles = [
  ['Primary text', 'var(--mantine-color-text)'],
  ['Secondary text', 'var(--mantine-color-dimmed)'],
  ['Link', 'var(--mantine-color-anchor)'],
  ['Control border', 'var(--mantine-color-default-border)'],
  ['Decorative border', 'var(--mapletip-color-border-subtle)'],
  ['Focus ring', 'var(--mapletip-color-focus)'],
] as const;

const accents = [
  ['Forest', 'var(--mapletip-color-accent-forest)'],
  ['Sky', 'var(--mapletip-color-accent-sky)'],
  ['Grape', 'var(--mapletip-color-accent-grape)'],
  ['Gold', 'var(--mapletip-color-accent-gold)'],
  ['Danger', 'var(--mapletip-color-accent-danger)'],
] as const;

function Overview() {
  return (
    <Stack gap="xl" p="lg" style={{ maxWidth: 1100 }}>
      <Stack gap={4}>
        <Title order={1}>Maple Twilight</Title>
        <Text c="dimmed">
          The shared theme used by the component library, Storybook and future
          MapleTip pages. Switch the toolbar between dark and light to inspect
          the same specimens.
        </Text>
      </Stack>

      <Section title="Surfaces">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {surfaceRoles.map(([label, color]) => (
            <Box
              key={label}
              p="md"
              style={{
                border: '1px solid var(--mapletip-color-border-subtle)',
                borderRadius: 'var(--mantine-radius-md)',
                background: color,
              }}
            >
              <Text fw={600}>{label}</Text>
              <Code>{color}</Code>
            </Box>
          ))}
        </SimpleGrid>
      </Section>

      <Section title="Text, links and boundaries">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {semanticRoles.map(([label, color]) => (
            <Swatch key={label} label={label} color={color} />
          ))}
        </SimpleGrid>
        <Text>
          Primary copy is used for records and controls;{' '}
          <Text span c="dimmed">
            secondary copy
          </Text>{' '}
          carries counts and supporting labels. Read more in the{' '}
          <Anchor href="#foundations">theme documentation</Anchor>.
        </Text>
      </Section>

      <Section title="Actions">
        <Group gap="sm">
          <Button>Primary</Button>
          <Button variant="light">Light</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="default">Default</Button>
          <Button variant="subtle">Subtle</Button>
          <Button disabled>Disabled</Button>
          <ActionIcon variant="default" size={36} aria-label="Example settings">
            <Gear aria-hidden="true" size={18} weight="bold" />
          </ActionIcon>
        </Group>
      </Section>

      <Section title="Selection and status">
        <Group gap="sm">
          <Badge>Selected</Badge>
          <Badge variant="light">Filter active</Badge>
          <Badge variant="outline">Neutral</Badge>
          <Button
            size="compact-sm"
            variant="light"
            aria-label="Remove Category: Beta"
          >
            Category: Beta ×
          </Button>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {accents.map(([label, color]) => (
            <Swatch key={label} label={label} color={color} />
          ))}
        </SimpleGrid>
        <Text size="xs" c="dimmed">
          Accents always ship with a text label; colour is never the only
          carrier of status, element or category meaning.
        </Text>
      </Section>

      <Section title="Inputs">
        <Paper withBorder p="md">
          <Stack gap="sm">
            <TextInput
              label="Search records"
              placeholder="Record name"
              description="Placeholder and description use theme text roles."
            />
            <Select
              label="Records per page"
              defaultValue="25"
              data={['25', '50', '100']}
            />
            <Checkbox label="Include archived records" defaultChecked />
            <TextInput
              label="With validation error"
              error="This field is required."
              defaultValue=""
            />
          </Stack>
        </Paper>
      </Section>

      <Section title="Typography">
        <Stack gap="xs">
          <Title order={1}>Heading level 1</Title>
          <Title order={2}>Heading level 2</Title>
          <Title order={3}>Heading level 3</Title>
          <Text size="lg">Large body copy</Text>
          <Text>Default body copy</Text>
          <Text size="sm">Small body copy</Text>
          <Text size="xs" c="dimmed">
            Extra small supporting copy
          </Text>
          <Code>const records = await loadRecords();</Code>
        </Stack>
      </Section>
    </Stack>
  );
}

function FocusSpecimen() {
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primaryRef.current?.focus();
  }, []);

  return (
    <Stack gap="md" p="lg" style={{ maxWidth: 720 }}>
      <Title order={2} size="h4">
        Keyboard focus
      </Title>
      <Text size="sm" c="dimmed">
        The focus ring is separated from the control and uses the scheme focus
        role, so it stays visible on filled orange actions and neutral surfaces.
      </Text>
      <Group gap="sm">
        <Button ref={primaryRef}>Filled primary</Button>
        <Button variant="default">Default</Button>
        <ActionIcon variant="default" size={36} aria-label="Example settings">
          <Gear aria-hidden="true" size={18} weight="bold" />
        </ActionIcon>
      </Group>
      <TextInput label="Search records" placeholder="Record name" />
      <Text size="sm">
        Record links use the same ring:{' '}
        <Anchor href="#records">Record 001</Anchor>
      </Text>
    </Stack>
  );
}

export const Default: Story = {
  render: () => <Overview />,
};

export const Focus: Story = {
  render: () => <FocusSpecimen />,
};
