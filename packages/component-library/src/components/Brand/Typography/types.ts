/** The theme values the type scale documentation reads from the live theme. */
export type TypographyTheme = {
  fontSizes: Record<'xs' | 'sm' | 'md', string>;
  lineHeights: Record<'xs' | 'sm' | 'md', string>;
  headings: {
    sizes: Record<
      'h1' | 'h2' | 'h3' | 'h4',
      { fontSize: string; lineHeight: string }
    >;
  };
};
