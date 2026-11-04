import { Accordion, Burger, CloseButton, Drawer, Popover } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CaretDown } from '@phosphor-icons/react';
import {
  useId,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import classes from '@/components/Header/Header.module.css';
import type {
  HeaderGroupLink,
  HeaderLink,
  HeaderLinkRenderer,
  HeaderLinkRenderProps,
  HeaderProps,
  HeaderSubLink,
} from '@/components/Header/types';

const popoverTransition = { duration: 75 };

function isGroupLink(link: HeaderLink): link is HeaderGroupLink {
  return link.children !== undefined && link.children.length > 0;
}

function isDetailedGroup(link: HeaderGroupLink): boolean {
  return (
    Boolean(link.description) ||
    link.children.some((child) => Boolean(child.description || child.icon))
  );
}

function navigableLink(link: HeaderLink): HeaderSubLink | undefined {
  return link.href === undefined ? undefined : { ...link, href: link.href };
}

function renderLinkContent(link: HeaderSubLink, detailed: boolean): ReactNode {
  if (!detailed) return link.label;

  return (
    <>
      {link.icon ? (
        <span className={classes['linkIcon']} aria-hidden="true">
          {link.icon}
        </span>
      ) : null}
      <span className={classes['linkCopy']}>
        <span className={classes['linkLabel']}>{link.label}</span>
        {link.description ? (
          <span className={classes['linkDescription']}>{link.description}</span>
        ) : null}
      </span>
    </>
  );
}

function renderNavigationLink(
  link: HeaderSubLink,
  className: string,
  onActivate: (() => void) | undefined,
  linkRenderer: HeaderLinkRenderer | undefined,
  detailed = false,
): ReactNode {
  const content = renderLinkContent(link, detailed);
  const anchorProps = {
    href: link.href,
    className,
    'aria-current': link.current === true ? ('page' as const) : undefined,
    'data-active':
      link.active === true || link.current === true
        ? ('true' as const)
        : undefined,
    onClick: onActivate,
  };
  const props: HeaderLinkRenderProps = { ...anchorProps, children: content };

  return linkRenderer ? (
    linkRenderer(link, props)
  ) : (
    <a {...anchorProps}>{content}</a>
  );
}

function DesktopGroup({
  link,
  linkRenderer,
  opened,
  onOpenChange,
  returnFocus,
}: {
  readonly link: HeaderGroupLink;
  readonly linkRenderer: HeaderLinkRenderer | undefined;
  readonly opened: boolean;
  readonly onOpenChange: (opened: boolean) => void;
  readonly returnFocus: boolean;
}): ReactElement {
  const dropdownId = useId();
  const parentLink = navigableLink(link);
  const children = link.children;
  const detailed = isDetailedGroup(link);
  const handleDisclosureKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    // Popover handles Escape inside the panel; mirror it on the trigger.
    if (event.key === 'Escape' && opened) {
      event.preventDefault();
      onOpenChange(false);
    }
  };

  return (
    <li className={classes['desktopItem']}>
      <div
        className={classes['group']}
        data-expanded={opened ? 'true' : undefined}
      >
        {parentLink
          ? renderNavigationLink(
              parentLink,
              classes['desktopLink'] ?? '',
              undefined,
              linkRenderer,
            )
          : null}
        {/* A portal would move the links to the end of the document and break Tab order. */}
        <Popover
          opened={opened}
          onChange={onOpenChange}
          position="bottom-start"
          transitionProps={popoverTransition}
          width={detailed ? '27rem' : undefined}
          withinPortal={false}
          withRoles={false}
          returnFocus={returnFocus}
        >
          <Popover.Target>
            <button
              type="button"
              className={
                parentLink ? classes['disclosure'] : classes['groupTrigger']
              }
              aria-label={parentLink ? `Show ${link.label} links` : undefined}
              aria-expanded={opened}
              aria-controls={opened ? dropdownId : undefined}
              data-active={
                link.active === true || link.current === true
                  ? 'true'
                  : undefined
              }
              onClick={() => onOpenChange(!opened)}
              onKeyDown={handleDisclosureKeyDown}
            >
              {parentLink ? null : <span>{link.label}</span>}
              <CaretDown size={14} aria-hidden="true" />
            </button>
          </Popover.Target>
          <Popover.Dropdown
            id={dropdownId}
            className={
              detailed
                ? `${classes['dropdown']} ${classes['richDropdown']}`
                : classes['dropdown']
            }
          >
            {detailed ? (
              <div className={classes['panelHeader']}>
                <div className={classes['panelCopy']}>
                  <h2 className={classes['panelTitle']}>{link.label}</h2>
                  {link.description ? (
                    <p className={classes['panelDescription']}>
                      {link.description}
                    </p>
                  ) : null}
                </div>
                <CloseButton
                  type="button"
                  size="xl"
                  className={classes['panelClose']}
                  aria-label={`Close ${link.label} navigation`}
                  onClick={() => onOpenChange(false)}
                />
              </div>
            ) : null}
            <ul
              className={
                detailed
                  ? `${classes['subList']} ${classes['richList']}`
                  : classes['subList']
              }
            >
              {children.map((child) => (
                <li key={child.id}>
                  {renderNavigationLink(
                    child,
                    detailed
                      ? `${classes['subLink']} ${classes['richLink']}`
                      : (classes['subLink'] ?? ''),
                    () => onOpenChange(false),
                    linkRenderer,
                    detailed,
                  )}
                </li>
              ))}
            </ul>
          </Popover.Dropdown>
        </Popover>
      </div>
    </li>
  );
}

function DesktopNavigation({
  navigation,
  navigationLabel,
  linkRenderer,
}: {
  readonly navigation: readonly HeaderLink[];
  readonly navigationLabel: string;
  readonly linkRenderer: HeaderLinkRenderer | undefined;
}): ReactElement {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  return (
    <nav aria-label={navigationLabel} className={classes['desktopNavigation']}>
      <ul className={classes['desktopList']}>
        {navigation.map((link) => {
          if (isGroupLink(link)) {
            return (
              <DesktopGroup
                key={link.id}
                link={link}
                linkRenderer={linkRenderer}
                opened={openGroupId === link.id}
                onOpenChange={(opened) =>
                  setOpenGroupId(opened ? link.id : null)
                }
                returnFocus={openGroupId === null || openGroupId === link.id}
              />
            );
          }

          const parentLink = navigableLink(link);
          return parentLink ? (
            <li key={link.id} className={classes['desktopItem']}>
              {renderNavigationLink(
                parentLink,
                classes['desktopLink'] ?? '',
                undefined,
                linkRenderer,
              )}
            </li>
          ) : null;
        })}
      </ul>
    </nav>
  );
}

function MobileLeaf({
  link,
  linkRenderer,
  onNavigate,
}: {
  readonly link: HeaderLink;
  readonly linkRenderer: HeaderLinkRenderer | undefined;
  readonly onNavigate: () => void;
}): ReactElement {
  const parentLink = navigableLink(link);

  return (
    <li>
      {parentLink ? (
        renderNavigationLink(
          parentLink,
          classes['mobileLink'] ?? '',
          onNavigate,
          linkRenderer,
        )
      ) : (
        <span className={classes['mobileGroupLabel']}>{link.label}</span>
      )}
    </li>
  );
}

function MobileGroup({
  link,
  linkRenderer,
  onNavigate,
}: {
  readonly link: HeaderGroupLink;
  readonly linkRenderer: HeaderLinkRenderer | undefined;
  readonly onNavigate: () => void;
}): ReactElement {
  const parentLink = navigableLink(link);
  const detailed = isDetailedGroup(link);

  return (
    <li>
      <Accordion.Item value={link.id}>
        <div className={classes['mobileGroupRow']}>
          {parentLink
            ? renderNavigationLink(
                parentLink,
                classes['mobileLink'] ?? '',
                onNavigate,
                linkRenderer,
              )
            : null}
          {/* An icon-only control keeps the parent destination a sibling link, never nested in a button. */}
          <Accordion.Control
            className={
              parentLink
                ? (classes['mobileDisclosure'] ?? '')
                : (classes['mobileGroupControl'] ?? '')
            }
            aria-label={parentLink ? `Show ${link.label} links` : undefined}
            // Mantine owns data-active for the expanded state on its control.
            data-current={
              link.active === true || link.current === true ? 'true' : undefined
            }
          >
            {parentLink ? null : link.label}
          </Accordion.Control>
        </div>
        <Accordion.Panel>
          <ul
            aria-label={`${link.label} links`}
            className={classes['mobileSubList']}
          >
            {link.children.map((child) => (
              <li key={child.id}>
                {renderNavigationLink(
                  child,
                  detailed
                    ? `${classes['mobileSubLink']} ${classes['mobileRichLink']}`
                    : (classes['mobileSubLink'] ?? ''),
                  onNavigate,
                  linkRenderer,
                  detailed,
                )}
              </li>
            ))}
          </ul>
        </Accordion.Panel>
      </Accordion.Item>
    </li>
  );
}

function MobileNavigation({
  navigation,
  navigationLabel,
  linkRenderer,
  onNavigate,
}: {
  readonly navigation: readonly HeaderLink[];
  readonly navigationLabel: string;
  readonly linkRenderer: HeaderLinkRenderer | undefined;
  readonly onNavigate: () => void;
}): ReactElement {
  const initialGroup = navigation.find(
    (link) =>
      isGroupLink(link) && (link.active === true || link.current === true),
  );

  return (
    <nav aria-label={navigationLabel}>
      {/* One collection keeps a single group open at a time without extra state. */}
      <Accordion
        defaultValue={initialGroup?.id ?? null}
        chevron={<CaretDown size={16} aria-hidden="true" />}
        unstyled
        classNames={{
          chevron: classes['mobileChevron'] ?? '',
          label: classes['mobileGroupLabelText'] ?? '',
        }}
      >
        <ul className={classes['mobileList']}>
          {navigation.map((link) =>
            isGroupLink(link) ? (
              <MobileGroup
                key={link.id}
                link={link}
                linkRenderer={linkRenderer}
                onNavigate={onNavigate}
              />
            ) : (
              <MobileLeaf
                key={link.id}
                link={link}
                linkRenderer={linkRenderer}
                onNavigate={onNavigate}
              />
            ),
          )}
        </ul>
      </Accordion>
    </nav>
  );
}

/**
 * Generic, host-configured global header. Branding, destinations and selected
 * state belong to the host; this component owns semantic markup, responsive
 * presentation and supported Mantine disclosure/drawer behaviour.
 */
export function Header({
  brand,
  navigation = [],
  utility,
  navigationLabel = 'Primary navigation',
  renderLink,
}: HeaderProps): ReactElement {
  const [drawerOpened, drawer] = useDisclosure();
  const [utilityInDrawer, setUtilityInDrawer] = useState(false);
  const drawerId = useId();
  const hasNavigation = navigation.length > 0;
  const hasUtility =
    utility !== null && utility !== undefined && utility !== false;
  const hasMobileMenu = hasNavigation || hasUtility;
  const drawerTitle = hasNavigation ? 'Navigation' : 'Menu';

  const openDrawer = () => {
    setUtilityInDrawer(true);
    drawer.open();
  };

  return (
    <>
      <header
        className={classes['header']}
        data-mobile-navigation-open={drawerOpened ? 'true' : undefined}
      >
        {hasMobileMenu ? (
          <Burger
            className={classes['burger']}
            opened={drawerOpened}
            onClick={drawerOpened ? drawer.close : openDrawer}
            aria-label={drawerOpened ? 'Close navigation' : 'Open navigation'}
            aria-expanded={drawerOpened}
            aria-controls={drawerId}
            size="sm"
          />
        ) : null}
        <div className={classes['brand']}>{brand}</div>
        {hasNavigation ? (
          <DesktopNavigation
            navigation={navigation}
            navigationLabel={navigationLabel}
            linkRenderer={renderLink}
          />
        ) : null}
        {hasUtility && !utilityInDrawer ? (
          <div className={classes['utility']}>{utility}</div>
        ) : null}
      </header>

      {hasMobileMenu ? (
        // Compound composition keeps the dialog content id and avoids Mantine's
        // default header landmark, which would duplicate the page banner.
        <Drawer.Root
          opened={drawerOpened}
          onClose={drawer.close}
          onExitTransitionEnd={() => setUtilityInDrawer(false)}
          position="left"
          size="22rem"
        >
          <Drawer.Overlay backgroundOpacity={0.65} />
          {/* `className` would also land on Mantine's full-width inner
              positioning wrapper and paint the panel over the overlay. */}
          <Drawer.Content
            id={drawerId}
            classNames={{ content: classes['drawerContent'] ?? '' }}
          >
            <Drawer.Header component="div" className={classes['drawerHeader']}>
              <Drawer.Title>{drawerTitle}</Drawer.Title>
              <Drawer.CloseButton aria-label="Close navigation drawer" />
            </Drawer.Header>
            <Drawer.Body className={classes['drawerBody']}>
              {hasNavigation ? (
                <MobileNavigation
                  navigation={navigation}
                  navigationLabel={navigationLabel}
                  linkRenderer={renderLink}
                  onNavigate={drawer.close}
                />
              ) : null}
              {hasUtility && utilityInDrawer ? (
                <div className={classes['drawerUtility']}>{utility}</div>
              ) : null}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Root>
      ) : null}
    </>
  );
}
