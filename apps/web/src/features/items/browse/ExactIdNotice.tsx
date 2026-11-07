import { Alert, List, Text } from '@mantine/core';
import type { DrillDownNode } from '@mapletip/component-library';
import type { ReactElement } from 'react';

import { AnchorLink } from '@/components/RouterLinks';

import {
  DEFAULT_NAV_PARAMS,
  findItemNavNode,
  ITEM_NAV_TARGET,
  type ItemNavRouteParams,
} from './navigation';
import type { ExactIdNoticeState } from './search';
import type { ItemBrowseSearch } from './search-params';

export interface ExactIdNoticeProps {
  readonly notice: ExactIdNoticeState;
  readonly navTree: DrillDownNode<ItemNavRouteParams>;
  readonly search: ItemBrowseSearch;
}

interface ScopeCategoryLinkProps {
  readonly scopeSlug: string;
  readonly label: string;
  readonly navTree: DrillDownNode<ItemNavRouteParams>;
  readonly search: ItemBrowseSearch;
}

function ScopeCategoryLink({
  scopeSlug,
  label,
  navTree,
  search,
}: ScopeCategoryLinkProps): ReactElement {
  const node = findItemNavNode(navTree, scopeSlug);
  if (!node) return <Text component="span">{label}</Text>;

  return (
    <AnchorLink
      to={ITEM_NAV_TARGET}
      params={node.meta ?? DEFAULT_NAV_PARAMS}
      search={search}
    >
      {label}
    </AnchorLink>
  );
}

/** Renders the result of an exact numeric ID query. */
export function ExactIdNotice({
  notice,
  navTree,
  search,
}: ExactIdNoticeProps): ReactElement {
  if (notice.kind === 'none') {
    return (
      <Alert variant="light">
        <Text size="sm">
          {notice.buildLabel} has no item with ID {notice.query}.
        </Text>
      </Alert>
    );
  }

  if (notice.kind === 'outside-category') {
    const scope = notice.owningScope;
    return (
      <Alert variant="light">
        <Text size="sm">
          {scope ? (
            <>
              {`Item ${notice.item.sourceId} is in `}
              <ScopeCategoryLink
                scopeSlug={scope.slug}
                label={scope.label}
                navTree={navTree}
                search={search}
              />
              .
            </>
          ) : (
            `Item ${notice.item.sourceId} is outside the browse categories.`
          )}
        </Text>
      </Alert>
    );
  }

  return (
    <Alert variant="light" title={`Matching items for ID ${notice.query}`}>
      <List size="sm">
        {notice.items.map(({ item, owningScope }) => (
          <List.Item key={item.key}>
            {owningScope ? (
              <>
                {`${item.name ?? 'Unnamed item'} (${item.sourceId}) is in `}
                <ScopeCategoryLink
                  scopeSlug={owningScope.slug}
                  label={owningScope.label}
                  navTree={navTree}
                  search={search}
                />
                .
              </>
            ) : (
              `${item.name ?? 'Unnamed item'} (${item.sourceId}) is outside the browse categories.`
            )}
          </List.Item>
        ))}
      </List>
    </Alert>
  );
}
