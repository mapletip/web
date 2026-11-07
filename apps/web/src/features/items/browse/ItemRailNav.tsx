import { NavLink, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import classes from './ItemRailNav.module.css';
import type { ItemNavScope } from './navigation';

export interface ItemRailNavProps {
  readonly navScopes: readonly ItemNavScope[];
}

export function ItemRailNav({ navScopes }: ItemRailNavProps): ReactElement {
  return (
    <nav className={classes['railNav']} aria-label="Item categories">
      <Stack gap={4}>
        <Title order={2} size="h4">
          Inventory
        </Title>
        {navScopes.map((scope) => {
          const icon = (
            <img
              src={scope.icon}
              alt=""
              width={20}
              height={20}
              decoding="async"
              style={{ objectFit: 'contain' }}
            />
          );
          const countBadge = (
            <Text size="xs" {...(scope.count === 0 ? { c: 'dimmed' } : {})}>
              {scope.count}
            </Text>
          );

          const renderChildren = scope.expanded && scope.children.length > 0;

          return (
            <div key={scope.slug}>
              <NavLink
                renderRoot={(props) => (
                  <Link
                    to={scope.to}
                    params={scope.params}
                    activeOptions={{ exact: true, includeSearch: false }}
                    {...props}
                  />
                )}
                label={scope.label}
                leftSection={icon}
                rightSection={countBadge}
                active={scope.active}
                disableRightSectionRotation
                className={classes['navLink']}
              />
              {renderChildren ? (
                <div className={classes['childrenContainer']}>
                  {scope.children.map((child) => (
                    <NavLink
                      key={child.slug}
                      renderRoot={(props) => (
                        <Link
                          to={child.to}
                          params={child.params}
                          activeOptions={{ exact: true, includeSearch: false }}
                          {...props}
                        />
                      )}
                      label={child.label}
                      rightSection={
                        <Text
                          size="xs"
                          {...(child.zeroCount ? { c: 'dimmed' } : {})}
                        >
                          {child.count}
                        </Text>
                      }
                      active={child.active}
                      disableRightSectionRotation
                      className={classes['childNavLink']}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </Stack>
    </nav>
  );
}
