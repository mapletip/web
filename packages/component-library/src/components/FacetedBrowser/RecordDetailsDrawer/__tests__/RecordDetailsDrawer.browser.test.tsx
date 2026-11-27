import { MantineProvider } from '@mantine/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { RecordDetailsDrawer } from '@/components/FacetedBrowser/RecordDetailsDrawer/RecordDetailsDrawer';

async function sideDrawerWidth({
  sideSize,
}: {
  readonly sideSize?: number;
}): Promise<number> {
  await page.viewport(1440, 900);
  await render(
    <MantineProvider>
      <RecordDetailsDrawer
        opened
        sideOnDesktop
        {...(sideSize === undefined ? {} : { sideSize })}
        title="Record 001"
        closeLabel="Close details"
        onClose={() => undefined}
      >
        Details
      </RecordDetailsDrawer>
    </MantineProvider>,
  );
  const dialog = page.getByRole('dialog', { name: 'Record 001' });
  await expect.element(dialog).toBeVisible();
  return dialog.element().getBoundingClientRect().width;
}

describe('RecordDetailsDrawer side size', () => {
  it('opens at 75vw by default', async () => {
    expect(await sideDrawerWidth({})).toBeCloseTo(1080, 0);
  });

  it('opens at the host side size when given', async () => {
    expect(await sideDrawerWidth({ sideSize: 440 })).toBeCloseTo(440, 0);
  });
});
