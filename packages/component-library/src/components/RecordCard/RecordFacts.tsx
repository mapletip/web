import { UnstyledButton } from '@mantine/core';
import { CaretRight } from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import classes from '@/components/RecordCard/RecordCard.module.css';
import type { RecordFact } from '@/components/RecordCard/types';

interface RecordFactsProps {
  readonly facts: readonly RecordFact[];
}

/** A semantic list of short, optionally actionable record facts. */
export function RecordFacts({ facts }: RecordFactsProps): ReactElement | null {
  if (facts.length === 0) return null;

  return (
    <ul className={classes['facts']}>
      {facts.map((fact) => {
        const content = (
          <>
            {fact.icon === undefined ? null : (
              <span className={classes['factIcon']} aria-hidden="true">
                {fact.icon}
              </span>
            )}
            <span className={classes['factText']}>
              <span className={classes['factLabel']}>{fact.label}</span>
              {fact.detail === undefined ? null : (
                <span className={classes['factDetail']} title={fact.detail}>
                  {fact.detail}
                </span>
              )}
            </span>
            {fact.values === undefined ? null : (
              <span className={classes['factValues']}>
                {fact.values.map((value, index) => (
                  <span key={index}>{value}</span>
                ))}
              </span>
            )}
          </>
        );

        return (
          <li key={fact.id} className={classes['fact']}>
            {fact.action === undefined ? (
              <div className={classes['factRow']}>{content}</div>
            ) : (
              <UnstyledButton
                className={`${classes['factRow']} ${classes['factButton']}`}
                onClick={fact.action}
              >
                {content}
                <CaretRight
                  className={classes['factCaret']}
                  size={14}
                  aria-hidden="true"
                />
              </UnstyledButton>
            )}
          </li>
        );
      })}
    </ul>
  );
}
