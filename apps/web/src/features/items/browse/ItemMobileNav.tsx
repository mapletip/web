import { Box, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { ReactElement } from 'react';

import classes from './ItemMobileNav.module.css';
import type { ItemNavScope } from './navigation';

interface ItemMobileNavProps {
  readonly navScopes: readonly ItemNavScope[];
}

export function ItemMobileNav({ navScopes }: ItemMobileNavProps): ReactElement {
  const expandedScope = navScopes.find((s) => s.expanded);
  const children = expandedScope?.children ?? [];

  return (
    <Box hiddenFrom="md" className={classes['root']}>
      <nav className={classes['scopeRow']} aria-label="Inventory scopes">
        {navScopes.map((scope) => (
          <Link
            key={scope.slug}
            to={scope.to}
            params={scope.params}
            search={scope.search}
            activeOptions={{ exact: true, includeSearch: false }}
            className={classes['scopeTab']}
          >
            <img
              src={scope.icon}
              alt=""
              width={18}
              height={18}
              decoding="async"
              style={{ objectFit: 'contain' }}
            />
            <span>{scope.label}</span>
          </Link>
        ))}
      </nav>

      {children.length > 0 && (
        <nav className={classes['childRow']} aria-label="Category children">
          {children.map((child) => (
            <Link
              key={child.slug}
              to={child.to}
              params={child.params}
              search={child.search}
              activeOptions={{ exact: true, includeSearch: false }}
              className={`${classes['childChip']} ${
                child.zeroCount ? classes['childChipDimmed'] : ''
              }`}
            >
              <span>{child.label}</span>
              <Text size="xs" {...(child.zeroCount ? { c: 'dimmed' } : {})}>
                {child.count}
              </Text>
            </Link>
          ))}
        </nav>
      )}
    </Box>
  );
}
