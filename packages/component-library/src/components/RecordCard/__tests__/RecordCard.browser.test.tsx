import { MantineProvider, Tooltip } from '@mantine/core';
import { cssVariablesResolver, theme } from '@mapletip/theme';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '@/styles.css';
import { RecordCard } from '@/components/RecordCard';

describe('RecordCard stretched link in the browser', () => {
  it('keeps a linked mediaAside card footer action above the stretched link', async () => {
    const onLocate = vi.fn();

    await render(
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="dark"
      >
        <div style={{ width: 420 }}>
          <RecordCard
            layout="mediaAside"
            title="Practice Meadow"
            secondaryLine={
              <span style={{ display: 'block', height: 160 }}>
                West Practice Grounds
              </span>
            }
            footer={
              <Tooltip label="Locate">
                <button onClick={onLocate}>Locate</button>
              </Tooltip>
            }
            destination={{ href: '#practice-meadow' }}
            renderLink={(_destination, props) => (
              <a href={props.href} className={props.className}>
                {props.children}
              </a>
            )}
          />
        </div>
      </MantineProvider>,
    );

    const link = page.getByRole('link', {
      name: 'Practice Meadow',
      exact: true,
    });
    const button = page.getByRole('button', { name: 'Locate' });
    await expect.element(link).toBeVisible();
    const cardElement = link.element().closest('[data-record-card="true"]');
    if (cardElement === null)
      throw new Error('The title link is outside its card.');
    expect(getComputedStyle(cardElement).isolation).toBe('isolate');
    const buttonElement = button.element();
    expect(buttonElement.closest('a')).toBeNull();
    const bounds = buttonElement.getBoundingClientRect();
    const hitTarget = document.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
    expect(buttonElement.contains(hitTarget)).toBe(true);
    await button.click();
    expect(onLocate).toHaveBeenCalledOnce();
    expect(window.location.hash).toBe('');

    await link.click();
    expect(window.location.hash).toBe('#practice-meadow');
  });
});
