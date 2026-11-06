import { useId, type ReactElement, type ReactNode } from 'react';

import classes from '@/components/Footer/Footer.module.css';
import type {
  FooterLink,
  FooterLinkRenderer,
  FooterLinkRenderProps,
  FooterProps,
} from '@/components/Footer/types';

const headingTags = {
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
} as const;

function hasContent(node: ReactNode): boolean {
  return node !== null && node !== undefined && node !== false && node !== '';
}

function renderFooterLink(
  link: FooterLink,
  linkRenderer: FooterLinkRenderer | undefined,
): ReactNode {
  const props: FooterLinkRenderProps = {
    href: link.href,
    className: classes['link'] ?? '',
    children: link.label,
  };

  return linkRenderer ? (
    linkRenderer(link, props)
  ) : (
    <a href={props.href} className={props.className}>
      {props.children}
    </a>
  );
}

/**
 * Generic, host-configured footer. Branding, navigation destinations and
 * legal/attribution content belong to the host; this component owns semantic
 * markup, responsive presentation and accessible link treatment. It renders
 * nothing when no optional content is supplied, so it never emits an empty
 * landmark.
 */
export function Footer({
  brand,
  description,
  groups = [],
  legal,
  headingLevel = 2,
  renderLink,
}: FooterProps): ReactElement | null {
  const headingIdPrefix = useId();
  const hasBrand = hasContent(brand);
  const hasDescription = hasContent(description);
  const visibleGroups = groups.filter((group) => group.links.length > 0);
  const hasGroups = visibleGroups.length > 0;
  const hasLegal = hasContent(legal);
  const hasBrandBlock = hasBrand || hasDescription;

  if (!hasBrandBlock && !hasGroups && !hasLegal) return null;

  const Heading = headingTags[headingLevel];

  return (
    <footer className={classes['footer']}>
      <div className={classes['inner']}>
        {hasBrandBlock || hasGroups ? (
          <div
            className={classes['upper']}
            data-has-brand={hasBrandBlock ? 'true' : 'false'}
            data-has-groups={hasGroups ? 'true' : 'false'}
          >
            {hasBrandBlock ? (
              <div className={classes['brandBlock']}>
                {hasBrand ? <div>{brand}</div> : null}
                {hasDescription ? (
                  <div className={classes['description']}>{description}</div>
                ) : null}
              </div>
            ) : null}

            {hasGroups ? (
              <nav
                aria-label="Footer navigation"
                className={classes['navigation']}
              >
                <div className={classes['groups']}>
                  {visibleGroups.map((group) => {
                    const headingId = `${headingIdPrefix}-${group.id}`;

                    return (
                      <div key={group.id} className={classes['group']}>
                        <Heading
                          id={headingId}
                          className={classes['groupTitle']}
                        >
                          {group.title}
                        </Heading>
                        <ul
                          aria-labelledby={headingId}
                          className={classes['linkList']}
                        >
                          {group.links.map((link) => (
                            <li key={link.id}>
                              {renderFooterLink(link, renderLink)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </nav>
            ) : null}
          </div>
        ) : null}

        {hasLegal ? <div className={classes['legal']}>{legal}</div> : null}
      </div>
    </footer>
  );
}
