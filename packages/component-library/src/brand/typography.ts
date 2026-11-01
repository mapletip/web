import { theme } from '@mapletip/theme';

type TypographyTheme = {
  fontSizes: Record<'xs' | 'sm' | 'md', string>;
  lineHeights: Record<'xs' | 'sm' | 'md', string>;
  headings: {
    sizes: Record<
      'h1' | 'h2' | 'h3' | 'h4',
      { fontSize: string; lineHeight: string }
    >;
  };
};

export const typographyTheme = theme as TypographyTheme;

export const numericTextStyle = {
  fontVariantNumeric: 'tabular-nums',
} as const;
