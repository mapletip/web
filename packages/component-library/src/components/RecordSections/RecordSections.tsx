import { Accordion } from '@mantine/core';
import type { ReactElement } from 'react';

import classes from '@/components/RecordSections/RecordSections.module.css';
import type {
  RecordSection,
  RecordSectionsProps,
} from '@/components/RecordSections/types';

function formatCount(count: RecordSection['count']): string | undefined {
  if (count === undefined) return undefined;
  return `(${count === 'unknown' ? '?' : count})`;
}

function SectionLabel({ section }: { readonly section: RecordSection }) {
  const count = formatCount(section.count);

  return (
    <>
      {section.icon !== undefined && (
        <span className={classes['icon']} aria-hidden="true">
          {section.icon}
        </span>
      )}
      <span>{section.title}</span>
      {count !== undefined && (
        <>
          {' '}
          <span className={classes['count']}>{count}</span>
        </>
      )}
    </>
  );
}

/** Renders an in-page navigation and collapsible sections from one ordered list. */
export function RecordSections({
  sections,
}: RecordSectionsProps): ReactElement {
  const initiallyOpen = sections.map((section) => section.id);

  return (
    <div className={classes['root']}>
      <nav className={classes['navigation']} aria-label="Record sections">
        <ul className={classes['navigation-list']}>
          {sections.map((section) => (
            <li key={section.id}>
              <a className={classes['navigation-link']} href={`#${section.id}`}>
                <SectionLabel section={section} />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Accordion
        className={classes['accordion']}
        multiple
        defaultValue={initiallyOpen}
        variant="separated"
        radius="md"
      >
        {sections.map((section) => (
          <Accordion.Item
            className={classes['item']}
            key={section.id}
            value={section.id}
          >
            <h2 className={classes['heading']} id={section.id}>
              <Accordion.Control className={classes['control']}>
                <SectionLabel section={section} />
              </Accordion.Control>
            </h2>
            <Accordion.Panel className={classes['panel']}>
              {section.content}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
}
