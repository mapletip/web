import { theme } from '@mapletip/theme';
import { describe, expect, it } from 'vitest';

import { numericTextStyle } from '@/components/Brand/Typography';

describe('typography', () => {
  it('keeps the semantic theme scale and tabular numeric specimen', () => {
    expect(theme.fontSizes).toMatchObject({
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
    });
    expect(theme.lineHeights).toMatchObject({
      xs: '1rem',
      sm: '1.25rem',
      md: '1.5rem',
    });
    expect(theme.headings?.sizes).toMatchObject({
      h1: { fontSize: '1.75rem', lineHeight: '2.25rem' },
      h2: { fontSize: '1.5rem', lineHeight: '2rem' },
      h3: { fontSize: '1.25rem', lineHeight: '1.75rem' },
      h4: { fontSize: '1rem', lineHeight: '1.5rem' },
    });
    expect(numericTextStyle.fontVariantNumeric).toBe('tabular-nums');
  });
});
