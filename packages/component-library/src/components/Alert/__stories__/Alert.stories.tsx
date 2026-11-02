import { Alert, Badge, Group, Stack } from '@mantine/core';
import { mapleTwilightScheme as scheme } from '@mapletip/theme/colors';
import {
  CheckCircle,
  Info,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const alerts = [
  {
    name: 'Success',
    label: 'Done',
    detail: 'The change was applied.',
    color: scheme.statuses.success,
    background: scheme.statuses.successBg,
    Icon: CheckCircle,
  },
  {
    name: 'Warning',
    label: 'Check this',
    detail: 'Something needs attention before you continue.',
    color: scheme.statuses.warning,
    background: scheme.statuses.warningBg,
    Icon: WarningCircle,
  },
  {
    name: 'Danger',
    label: 'Failed',
    detail: 'The action could not be completed.',
    color: scheme.statuses.danger,
    background: scheme.statuses.dangerBg,
    Icon: XCircle,
  },
  {
    name: 'Information',
    label: 'Note',
    detail: 'Additional context about this page.',
    color: scheme.statuses.info,
    background: scheme.statuses.infoBg,
    Icon: Info,
  },
];

const meta = {
  title: 'Components/Alert',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SemanticStatuses: Story = {
  render: () => (
    <Stack gap="md" maw={720}>
      {alerts.map(({ name, label, detail, color, background, Icon }) => (
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
