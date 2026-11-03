import { Burger, Drawer, Popover } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CaretDown } from '@phosphor-icons/react';
import {
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import classes from '@/components/Header/Header.module.css';
import type {
  HeaderLink,
  HeaderLinkRenderer,
  HeaderLinkRenderProps,
  HeaderProps,
  HeaderSubLink,
} from '@/components/Header/types';

/** Mirrors the CSS breakpoint used by the responsive header. */
const DESKTOP_MEDIA_QUERY = '(min-width: 62em)';

function renderNavigationLink(
  link: HeaderLink | HeaderSubLink,
  className: string,
  onActivate: (() => void) | undefined,
  linkRenderer: HeaderLinkRenderer | undefined,
): ReactNode {
  const props: HeaderLinkRenderProps = {
    href: link.href,
    className,
    'aria-current': link.current === true ? 'page' : undefined,
    'data-active':
      link.active === true || link.current === true ? 'true' : undefined,
    onClick: onActivate,
  };

  return linkRenderer ? (
    linkRenderer(link, props)
  ) : (
    <a {...props}>{link.label}</a>
  );
}

function DesktopGroup({
  link,
  linkRenderer,
}: {
  readonly link: HeaderLink;
  readonly linkRenderer: HeaderLinkRenderer | undefined;
}): ReactElement {
  const [opened, disclosure] = useDisclosure();
  const dropdownId = useId();
  const children = link.children ?? [];

  return (
    <li className={classes['desktopItem']}>
      <div
        className={classes['group']}
        data-expanded={opened ? 'true' : undefined}
      >
        {renderNavigationLink(
          link,
          classes['desktopLink'] ?? '',
          undefined,
          linkRenderer,
        )}
        {/* A portal would move the links to the end of the document and break Tab order. */}
        <Popover
          opened={opened}
          onChange={disclosure.set}
          position="bottom-start"
          withinPortal={false}
          withRoles={false}
          returnFocus
        >
          <Popover.Target>
            <button
              type="button"
              className={classes['disclosure']}
              aria-label={`Show ${link.label} links`}
              aria-expanded={opened}
              aria-controls={opened ? dropdownId : undefined}
              data-active={
                link.active === true || link.current === true
                  ? 'true'
                  : undefined
              }
              onClick={disclosure.toggle}
              onKeyDown={(event) => {
                // Popover handles Escape inside the panel; mirror it on the trigger.
                if (event.key === 'Escape' && opened) {
                  event.preventDefault();
                  disclosure.close();
                }
              }}
            >
              <CaretDown size={14} aria-hidden="true" />
            </button>
          </Popover.Target>
          <Popover.Dropdown id={dropdownId} className={classes['dropdown']}>
            <ul className={classes['subList']}>
              {children.map((child) => (
                <li key={child.id}>
                  {renderNavigationLink(
                    child,
                    classes['subLink'] ?? '',
                    disclosure.close,
                    linkRenderer,
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
  return (
    <nav aria-label={navigationLabel} className={classes['desktopNavigation']}>
      <ul className={classes['desktopList']}>
        {navigation.map((link) => {
          const children = link.children ?? [];
          return children.length > 0 ? (
            <DesktopGroup
              key={link.id}
              link={link}
              linkRenderer={linkRenderer}
            />
          ) : (
            <li key={link.id} className={classes['desktopItem']}>
              {renderNavigationLink(
                link,
                classes['desktopLink'] ?? '',
                undefined,
                linkRenderer,
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MobileNavigationLink({
  link,
  linkRenderer,
  onNavigate,
}: {
  readonly link: HeaderLink;
  readonly linkRenderer: HeaderLinkRenderer | undefined;
  readonly onNavigate: () => void;
}): ReactElement {
  const children = link.children ?? [];

  return (
    <li>
      {renderNavigationLink(
        link,
        classes['mobileLink'] ?? '',
        onNavigate,
        linkRenderer,
      )}
      {children.length > 0 ? (
        <ul
          aria-label={`${link.label} links`}
          className={classes['mobileSubList']}
        >
          {children.map((child) => (
            <li key={child.id}>
              {renderNavigationLink(
                child,
                classes['mobileSubLink'] ?? '',
                onNavigate,
                linkRenderer,
              )}
            </li>
          ))}
        </ul>
      ) : null}
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
  return (
    <nav aria-label={navigationLabel}>
      <ul className={classes['mobileList']}>
        {navigation.map((link) => (
          <MobileNavigationLink
            key={link.id}
            link={link}
            linkRenderer={linkRenderer}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
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
  const brandRef = useRef<HTMLDivElement>(null);
  const hasNavigation = navigation.length > 0;
  const hasUtility =
    utility !== null && utility !== undefined && utility !== false;
  const hasMobileMenu = hasNavigation || hasUtility;
  const drawerTitle = hasNavigation ? 'Navigation' : 'Menu';

  const openDrawer = () => {
    setUtilityInDrawer(true);
    drawer.open();
  };

  const handleDrawerExit = () => {
    setUtilityInDrawer(false);
    if (window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
      brandRef.current?.querySelector<HTMLElement>('a[href], button')?.focus();
    }
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
        <div ref={brandRef} className={classes['brand']}>
          {brand}
        </div>
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
          onExitTransitionEnd={handleDrawerExit}
          position="left"
          size="min(22rem, 88vw)"
        >
          <Drawer.Overlay backgroundOpacity={0.65} />
          <Drawer.Content id={drawerId} className={classes['drawerContent']}>
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
