import { MantineProvider } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';

import '@/styles.css';
import { EntityOption } from '@/components/EntityOption';

function mount(props: ComponentProps<typeof EntityOption>) {
  return render(
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="dark"
    >
      <EntityOption {...props} />
    </MantineProvider>,
  );
}

describe('EntityOption', () => {
  it('keeps an empty icon slot so rows without an icon stay aligned', () => {
    const { container } = mount({ label: 'Synthetic item' });
    const slot = container.querySelector('[aria-hidden="true"]');

    expect(slot).toBeInTheDocument();
    expect(slot).toBeEmptyDOMElement();
  });

  it('renders a description only when one is supplied', () => {
    const { rerender } = mount({ label: 'Synthetic item' });

    expect(screen.queryByText('Monster')).not.toBeInTheDocument();

    rerender(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        <EntityOption label="Synthetic item" description="Monster" />
      </MantineProvider>,
    );

    expect(screen.getByText('Monster')).toBeVisible();
  });
});
