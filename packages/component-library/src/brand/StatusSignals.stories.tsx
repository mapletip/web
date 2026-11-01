import { Alert, Badge, Group, Stack } from '@mantine/core';
import { mapleTwilightScheme as scheme } from '@mapletip/theme/colors';
import {
  CheckCircle,
  Info,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const statuses = [
  {
    name: 'Success',
    label: 'Verified',
    detail: 'The record is confirmed in the selected build.',
    color: scheme.statuses.success,
    background: scheme.statuses.successBg,
    Icon: CheckCircle,
  },
  {
    name: 'Warning',
    label: 'Uncertain',
    detail: 'The source does not settle this detail.',
    color: scheme.statuses.warning,
    background: scheme.statuses.warningBg,
    Icon: WarningCircle,
  },
  {
    name: 'Danger',
    label: 'Unavailable',
    detail: 'This record cannot be loaded for the selected build.',
    color: scheme.statuses.danger,
    background: scheme.statuses.dangerBg,
    Icon: XCircle,
  },
  {
    name: 'Information',
    label: 'Build context',
    detail: 'The visible values use the selected historical build.',
    color: scheme.statuses.info,
    background: scheme.statuses.infoBg,
    Icon: Info,
  },
];

const meta = {
  title: 'Brand/Foundations/Status Signals',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SemanticStatuses: Story = {
  render: () => (
    <Stack gap="md" maw={720}>
      {statuses.map(({ name, label, detail, color, background, Icon }) => (
        <Stack key={name} gap="xs">
          <Badge
            leftSection={<Icon size={14} weight="bold" aria-hidden="true" />}
            style={{ backgroundColor: background, color }}
          >
            {label}
          </Badge>
          <Alert
            title={
              <Group gap="xs">
                <Icon size={18} weight="bold" aria-hidden="true" />
                <span>{name}</span>
              </Group>
            }
            style={{
              backgroundColor: background,
              borderColor: color,
              color,
            }}
          >
            {detail}
          </Alert>
        </Stack>
      ))}
    </Stack>
  ),
};
