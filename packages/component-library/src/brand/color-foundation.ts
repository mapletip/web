import { mapleTwilightScheme as scheme } from '@mapletip/theme/colors';

type ColorRole = [label: string, token: string, color: string];

type ColorGroup = { title: string; roles: ColorRole[] };

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

function luminance(color: string): number {
  const channels = color
    .slice(1)
    .match(/.{2}/g)
    ?.map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  if (!channels) return 0;
  const [red = 0, green = 0, blue = 0] = channels;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string): string {
  const first = luminance(foreground);
  const second = luminance(background);
  const [lighter, darker] = first > second ? [first, second] : [second, first];
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

type ContrastPair = [label: string, foreground: string, background: string];

export const contrastPairs: ContrastPair[] = [
  ['Primary text on canvas', scheme.textPrimary, scheme.canvas],
  ['Primary text on panel', scheme.textPrimary, scheme.panel],
  ['Primary text on raised surface', scheme.textPrimary, scheme.raised],
  ['Secondary text on panel', scheme.textSecondary, scheme.panel],
  ['Link on canvas', scheme.link, scheme.canvas],
  ['Link on panel', scheme.link, scheme.panel],
  ['Brand text on canvas', scheme.brandText, scheme.canvas],
  ['Selection text on selection', scheme.textPrimary, scheme.selection],
  ['Walnut label on CTA', scheme.cta.foreground, scheme.cta.background],
  ['Walnut label on CTA hover', scheme.cta.foreground, scheme.cta.hover],
  ['Focus ring against panel', scheme.focus, scheme.panel],
  [
    'Success on its background',
    scheme.statuses.success,
    scheme.statuses.successBg,
  ],
  [
    'Warning on its background',
    scheme.statuses.warning,
    scheme.statuses.warningBg,
  ],
  [
    'Danger on its background',
    scheme.statuses.danger,
    scheme.statuses.dangerBg,
  ],
  [
    'Information on its background',
    scheme.statuses.info,
    scheme.statuses.infoBg,
  ],
];
