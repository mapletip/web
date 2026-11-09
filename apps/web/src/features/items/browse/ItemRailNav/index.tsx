import { NavLink, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import type { ItemNavScope } from '../navigation';

import classes from './styles.module.css';

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
          const visibleChildren = scope.children.filter(
            (child) => !child.zeroCount,
          );
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

          const hasChildren = visibleChildren.length > 0;

          return (
            <div key={scope.slug}>
              <NavLink
                renderRoot={(props) => (
                  <Link
                    to={scope.to}
                    params={scope.params}
                    search={scope.search}
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
              {hasChildren && (
                <div className={classes['childrenContainer']}>
                  {visibleChildren.map((child) => {
                    const isVisible = scope.expanded;
                    return (
                      <NavLink
                        key={child.slug}
                        renderRoot={(props) => (
                          <Link
                            to={child.to}
                            params={child.params}
                            search={child.search}
                            activeOptions={{
                              exact: true,
                              includeSearch: false,
                            }}
                            {...props}
                          />
                        )}
                        label={child.label}
                        rightSection={<Text size="xs">{child.count}</Text>}
                        active={child.active}
                        disableRightSectionRotation
                        style={isVisible ? undefined : { display: 'none' }}
                        className={classes['childNavLink']}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </Stack>
    </nav>
  );
}
