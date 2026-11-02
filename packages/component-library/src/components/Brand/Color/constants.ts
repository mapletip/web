import { mapleTwilightScheme as scheme } from '@mapletip/theme/colors';

import type { ColorGroup } from '@/components/Brand/Color/types';

export const colorGroups: ColorGroup[] = [
  {
    title: 'Surfaces and text',
    roles: [
      ['Canvas', '--mapletip-color-canvas', scheme.canvas],
      ['Panel', '--mapletip-color-panel', scheme.panel],
      ['Raised surface', '--mapletip-color-raised', scheme.raised],
      ['Primary text', '--mapletip-color-ink', scheme.textPrimary],
      ['Secondary text', '--mapletip-color-muted', scheme.textSecondary],
    ],
  },
  {
    title: 'Brand, links and selection',
    roles: [
      ['Brand accent', '--mapletip-color-brand', scheme.brand],
      ['Brand text', '--mapletip-color-brand-text', scheme.brandText],
      ['Link', '--mapletip-color-link', scheme.link],
      ['Selection', '--mapletip-color-selection', scheme.selection],
      [
        'Selection edge',
        '--mapletip-color-selection-edge',
        scheme.selectionEdge,
      ],
      ['Focus ring', '--mapletip-color-focus', scheme.focus],
    ],
  },
  {
    title: 'Walnut primary action',
    roles: [
      ['CTA background', '--mapletip-color-cta', scheme.cta.background],
      ['CTA foreground', '--mapletip-color-cta-fg', scheme.cta.foreground],
      ['CTA hover', '--mapletip-color-cta-hover', scheme.cta.hover],
      ['CTA border', '--mapletip-color-cta-border', scheme.cta.border],
    ],
  },
  {
    title: 'Clear Signals status roles',
    roles: [
      ['Success', '--mapletip-color-status-success', scheme.statuses.success],
      [
        'Success background',
        '--mapletip-color-status-success-bg',
        scheme.statuses.successBg,
      ],
      ['Warning', '--mapletip-color-status-warning', scheme.statuses.warning],
      [
        'Warning background',
        '--mapletip-color-status-warning-bg',
        scheme.statuses.warningBg,
      ],
      ['Danger', '--mapletip-color-status-danger', scheme.statuses.danger],
      [
        'Danger background',
        '--mapletip-color-status-danger-bg',
        scheme.statuses.dangerBg,
      ],
      ['Information', '--mapletip-color-status-info', scheme.statuses.info],
      [
        'Information background',
        '--mapletip-color-status-info-bg',
        scheme.statuses.infoBg,
      ],
    ],
  },
];
