import { theme } from '@mapletip/theme';

import type { TypographyTheme } from '@/components/Brand/Typography/types';

export const typographyTheme = theme as TypographyTheme;

export const numericTextStyle = {
  fontVariantNumeric: 'tabular-nums',
} as const;
