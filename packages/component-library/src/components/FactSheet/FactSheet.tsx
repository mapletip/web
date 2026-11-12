import { Tooltip } from '@mantine/core';
import type { CSSProperties, ReactElement } from 'react';

import classes from '@/components/FactSheet/FactSheet.module.css';
import type { FactSheetProps } from '@/components/FactSheet/types';

/**
 * One ordered description list of labelled facts.
 *
 * Values are rendered exactly as supplied; formatting is the host's job. A fact
 * without a known value shows the host's wording in the value position instead
 * of a zero or a blank. Facts fill the first column and then the second, so the
 * reading order is the DOM order at every width.
 */
export function FactSheet({ facts }: FactSheetProps): ReactElement | null {
  if (facts.length === 0) return null;

  // Two columns from the tablet breakpoint. The row count lets the grid fill
  // each column in turn without measuring the rendered content.
  const rows = Math.ceil(facts.length / 2);

  return (
    <dl
      className={classes['sheet']}
      style={{ '--fact-sheet-rows': rows } as CSSProperties}
    >
      {facts.map((fact, index) => {
        const label =
          fact.explanation === undefined ? (
            <span className={classes['label']}>{fact.label}</span>
          ) : (
            <Tooltip
              label={fact.explanation}
              withArrow
              multiline
              maw={280}
              position="top-start"
              events={{ hover: true, focus: true, touch: true }}
            >
              <button
                type="button"
                className={classes['explainable']}
                data-explainable="true"
              >
                {fact.label}
              </button>
            </Tooltip>
          );

        const notKnown = fact.notKnown !== undefined;

        return (
          <div className={classes['fact']} key={`${index}-${fact.label}`}>
            <dt className={classes['term']}>
              {fact.icon !== undefined && (
                <span className={classes['icon']} aria-hidden="true">
                  {fact.icon}
                </span>
              )}
              {label}
            </dt>
            <dd
              className={classes['value']}
              data-not-known={notKnown ? 'true' : undefined}
            >
              {notKnown ? fact.notKnown : fact.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
